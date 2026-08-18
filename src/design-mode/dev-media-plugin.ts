import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Plugin, ViteDevServer } from "vite";
import { isAllowedMediaFile, sanitizeFilename } from "../lib/media-additions.types";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
};

/**
 * Dev-only Vite middleware for local media uploads. Two responsibilities:
 *
 * 1. Accept an upload and stage it — writes to a gitignored directory
 *    outside `public/`, never touches anything a production build could
 *    pick up. Staged files are what the canvas previews before approval.
 * 2. Serve staged files back so the iframe can actually preview the real
 *    uploaded bytes (not a placeholder) while still a draft.
 *
 * Approving a staged file (moving it into `public/design-media/` and
 * rewriting its reference) happens in the save endpoint, alongside writing
 * the rest of the approved overrides — one operation, not two.
 */
export function designModeMediaPlugin(stagingDir: string): Plugin {
  let mode = "";
  return {
    name: "design-mode-media-endpoint",
    configResolved(config) {
      mode = config.mode;
    },
    configureServer(server: ViteDevServer) {
      if (mode !== "design") return;
      const stagingAbs = path.resolve(stagingDir);
      mkdirSync(stagingAbs, { recursive: true });

      server.middlewares.use("/__design-mode/upload-media", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        const filename = decodeURIComponent(String(req.headers["x-filename"] ?? ""));
        const mime = String(req.headers["content-type"] ?? "");
        if (!filename || !isAllowedMediaFile(filename, mime)) {
          res.statusCode = 400;
          res.end("Unsupported file — only .png, .jpg, .jpeg, and .mp4 are accepted, and the file's type must match its extension.");
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 50 * 1024 * 1024) {
            res.statusCode = 413;
            res.end("File too large (50MB limit)");
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        req.on("end", () => {
          try {
            const safeName = sanitizeFilename(filename);
            const token = crypto.randomBytes(8).toString("hex");
            const storedName = `${token}__${safeName}`;
            const dest = path.join(stagingAbs, storedName);
            // Defense in depth: confirm the joined path never leaves the
            // staging directory, even though sanitizeFilename already
            // strips path separators and traversal sequences.
            if (!dest.startsWith(stagingAbs + path.sep)) {
              res.statusCode = 400;
              res.end("Invalid filename");
              return;
            }
            writeFileSync(dest, Buffer.concat(chunks));
            res.setHeader("content-type", "application/json");
            res.end(
              JSON.stringify({
                token,
                url: `/__design-mode/staged/${encodeURIComponent(storedName)}`,
                filename: safeName,
                mime,
                size,
              }),
            );
          } catch (err) {
            res.statusCode = 500;
            res.end(`Upload failed: ${(err as Error).message}`);
          }
        });
      });

      server.middlewares.use("/__design-mode/staged/", (req, res) => {
        const requested = decodeURIComponent((req.url ?? "").replace(/^\/+/, "").split("?")[0]);
        const resolved = path.resolve(stagingAbs, requested);
        if (!resolved.startsWith(stagingAbs + path.sep) || !existsSync(resolved)) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }
        const ext = path.extname(resolved).toLowerCase();
        res.setHeader("content-type", CONTENT_TYPES[ext] ?? "application/octet-stream");
        res.end(readFileSync(resolved));
      });
    },
  };
}
