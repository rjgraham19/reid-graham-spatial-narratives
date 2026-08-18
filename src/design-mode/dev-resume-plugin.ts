import { existsSync, mkdirSync, renameSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Plugin, ViteDevServer } from "vite";

const MAX_SIZE = 12 * 1024 * 1024; // a text résumé is a few hundred KB even with embedded fonts — generous headroom, not a real ceiling
const PDF_SIGNATURE = Buffer.from("%PDF-");

/**
 * Dev-only Vite middleware for replacing the site's résumé PDF, active only
 * under `vite dev --mode design` (see vite.config.ts). Deliberately separate
 * from dev-media-plugin.ts: that pipeline stages content-block additions
 * (images/video inserted into a project's media array) through a
 * draft-then-approve flow. A résumé is a single file at one fixed path with
 * no draft/approve distinction worth having, so this writes straight to
 * `public/resume.pdf` — same as replacing the file by hand — and leaves
 * publishing to the normal `git push` deploy flow.
 */
export function designModeResumePlugin(resumePath: string, metaPath: string): Plugin {
  let mode = "";
  let uploadInFlight = false;

  return {
    name: "design-mode-resume-endpoint",
    configResolved(config) {
      mode = config.mode;
    },
    configureServer(server: ViteDevServer) {
      if (mode !== "design") return;
      const resumeAbs = path.resolve(resumePath);
      const metaAbs = path.resolve(metaPath);
      mkdirSync(path.dirname(resumeAbs), { recursive: true });
      mkdirSync(path.dirname(metaAbs), { recursive: true });

      server.middlewares.use("/__design-mode/upload-resume", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        if (uploadInFlight) {
          res.statusCode = 409;
          res.end("Another résumé upload is already in progress — try again in a moment.");
          return;
        }

        const filename = decodeURIComponent(String(req.headers["x-filename"] ?? ""));
        const mime = String(req.headers["content-type"] ?? "");
        if (!filename.toLowerCase().endsWith(".pdf") || mime !== "application/pdf") {
          res.statusCode = 400;
          res.end("Unsupported file — only .pdf files are accepted.");
          return;
        }

        uploadInFlight = true;
        const chunks: Buffer[] = [];
        let size = 0;
        let aborted = false;

        req.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_SIZE) {
            aborted = true;
            uploadInFlight = false;
            res.statusCode = 413;
            res.end(`File too large (${Math.round(MAX_SIZE / 1024 / 1024)}MB limit)`);
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });

        req.on("end", () => {
          if (aborted) return;
          const tmpResume = `${resumeAbs}.tmp-${crypto.randomBytes(6).toString("hex")}`;
          const tmpMeta = `${metaAbs}.tmp-${crypto.randomBytes(6).toString("hex")}`;
          try {
            const buffer = Buffer.concat(chunks);
            if (buffer.length === 0 || !buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
              res.statusCode = 400;
              res.end("That file doesn't look like a valid PDF (missing %PDF- signature).");
              return;
            }

            const updatedAt = new Date().toISOString();
            const originalFilename = filename;

            // Prepare both temp files fully before touching anything real —
            // if either write fails, the previously working résumé and
            // metadata are untouched.
            writeFileSync(tmpResume, buffer);
            writeFileSync(tmpMeta, JSON.stringify({ updatedAt, originalFilename }, null, 2) + "\n", "utf-8");

            // Rename is atomic on the same filesystem (and Node's rename on
            // Windows overwrites the destination too), so each swap either
            // fully lands or doesn't touch the previous file at all.
            renameSync(tmpResume, resumeAbs);
            renameSync(tmpMeta, metaAbs);

            const abs = [resumeAbs, metaAbs];
            for (const modPath of abs) {
              const clientMod = server.moduleGraph.getModuleById(modPath);
              if (clientMod) server.moduleGraph.invalidateModule(clientMod);
              const ssrGraph = server.environments?.ssr?.moduleGraph;
              const ssrMod = ssrGraph?.getModuleById(modPath);
              if (ssrGraph && ssrMod) ssrGraph.invalidateModule(ssrMod);
            }

            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, updatedAt, originalFilename }));
          } catch (err) {
            for (const tmp of [tmpResume, tmpMeta]) {
              if (existsSync(tmp)) {
                try {
                  unlinkSync(tmp);
                } catch {
                  // best-effort cleanup only
                }
              }
            }
            res.statusCode = 500;
            res.end(`Upload failed: ${(err as Error).message}`);
          } finally {
            uploadInFlight = false;
          }
        });
      });
    },
  };
}
