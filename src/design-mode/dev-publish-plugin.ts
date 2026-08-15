import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { Plugin, ViteDevServer } from "vite";

const run = promisify(execFile);

/**
 * A deliberately separate action from the save endpoint. Saving writes
 * approved values to `design-overrides.json` on disk and nothing else —
 * it's local and reversible. Publishing runs `git add / commit / push`,
 * which triggers Cloudflare's build on the connected branch: a real,
 * public, hard-to-reverse action. Keeping them as two endpoints (and two
 * separate UI actions) means clicking Save never accidentally ships
 * whatever else happens to be sitting in the working tree.
 *
 * Dev-only, same as the save endpoint — inert outside `vite dev --mode design`,
 * never imported by production route code.
 */
export function designModePublishPlugin(repoRoot: string): Plugin {
  let mode = "";
  return {
    name: "design-mode-publish-endpoint",
    configResolved(config) {
      mode = config.mode;
    },
    configureServer(server: ViteDevServer) {
      if (mode !== "design") return;
      const cwd = path.resolve(repoRoot);

      server.middlewares.use("/__design-mode/git-status", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        try {
          const [branch, status] = await Promise.all([
            run("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd }),
            run("git", ["status", "--porcelain"], { cwd }),
          ]);
          const files = status.stdout
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ branch: branch.stdout.trim(), files }));
        } catch (err) {
          res.statusCode = 500;
          res.end(`git status failed: ${(err as Error).message}`);
        }
      });

      server.middlewares.use("/__design-mode/publish", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 10_000) req.destroy();
        });
        req.on("end", async () => {
          const log: string[] = [];
          try {
            const status = await run("git", ["status", "--porcelain"], { cwd });
            if (!status.stdout.trim()) {
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ ok: true, published: false, message: "Nothing to publish — working tree is clean." }));
              return;
            }

            let message = "Design Mode: approved changes";
            try {
              const parsed = JSON.parse(body) as { message?: unknown };
              if (typeof parsed.message === "string" && parsed.message.trim()) {
                message = parsed.message.trim().slice(0, 500);
              }
            } catch {
              /* use default message */
            }

            const add = await run("git", ["add", "-A"], { cwd });
            log.push(add.stdout, add.stderr);
            const commit = await run("git", ["commit", "-m", message], { cwd });
            log.push(commit.stdout, commit.stderr);
            const push = await run("git", ["push"], { cwd });
            log.push(push.stdout, push.stderr);

            res.setHeader("content-type", "application/json");
            res.end(
              JSON.stringify({
                ok: true,
                published: true,
                message: "Pushed to GitHub — Cloudflare will build and deploy automatically.",
                log: log.filter(Boolean).join("\n"),
              }),
            );
          } catch (err) {
            const e = err as { message?: string; stdout?: string; stderr?: string };
            res.statusCode = 500;
            res.setHeader("content-type", "application/json");
            res.end(
              JSON.stringify({
                ok: false,
                message: e.message ?? "Publish failed",
                log: [...log, e.stdout, e.stderr].filter(Boolean).join("\n"),
              }),
            );
          }
        });
      });
    },
  };
}
