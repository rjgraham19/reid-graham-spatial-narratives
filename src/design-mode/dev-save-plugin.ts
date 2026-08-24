import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import type { DesignOverridesFile, ElementOverride } from "../lib/design-overrides.types";
import { WHITELISTED_IMAGE_PROPS, WHITELISTED_TEXT_PROPS, WHITELISTED_SCOPES } from "../lib/design-overrides.types";
import { MEDIA_ORDER_ID_PATTERN, type MediaOrderFile } from "../lib/media-additions.types";

/**
 * Element IDs are self-describing (see src/lib/design-ids.ts) and can name
 * any project slug or page, so the whitelist here is pattern-based rather
 * than an enumerated list — but it's still a closed set of known namespaces.
 * Anything outside these patterns is rejected before it ever reaches disk.
 */
const ID_PATTERNS = [
  /^project\.[a-z0-9-]+\.(title|subtitle|description|pull-quote)$/,
  /^project\.[a-z0-9-]+\.credit\.[a-z0-9-]+$/,
  /^project\.[a-z0-9-]+\.media\.[a-z0-9-]+(\.caption)?$/,
  /^project\.[a-z0-9-]+\.note\.\d+$/,
  /^connect\.[a-z0-9-]+$/,
  /^home\.[a-z0-9-]+$/,
];

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const MEDIA_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}$/;
const STAGED_PREFIX = "/__design-mode/staged/";
const APPROVED_PREFIX = "/design-media/";

const ALLOWED_PROPS = new Set<string>([...WHITELISTED_TEXT_PROPS, ...WHITELISTED_IMAGE_PROPS]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validatePropValue(key: string, value: unknown): boolean {
  switch (key) {
    case "text":
    case "caption":
    case "alt":
    case "fontFamily":
    case "color":
      return typeof value === "string" && value.length <= 4000;
    case "src":
      // Only ever a path back into Design Mode's own upload area — never an
      // arbitrary URL, filesystem path, or protocol.
      return typeof value === "string" && (value.startsWith(STAGED_PREFIX) || value.startsWith(APPROVED_PREFIX));
    case "link":
      return typeof value === "string" && (value === "" || value.startsWith("/") || /^https:\/\//.test(value));
    case "align":
      return value === "left" || value === "center" || value === "right";
    case "objectFit":
      return value === "cover" || value === "contain";
    case "hidden":
      return typeof value === "boolean";
    case "fontSize":
    case "fontWeight":
    case "lineHeight":
    case "letterSpacing":
    case "textWidth":
    case "widthPct":
    case "maxWidth":
    case "offsetX":
    case "offsetY":
    case "layoutShiftY":
    case "objectPositionX":
    case "objectPositionY":
      return typeof value === "number" && Number.isFinite(value) && Math.abs(value) < 100000;
    default:
      return false;
  }
}

function validateElementOverride(o: unknown): o is ElementOverride {
  if (!isPlainObject(o)) return false;
  for (const [key, value] of Object.entries(o)) {
    if (!ALLOWED_PROPS.has(key)) return false;
    if (!validatePropValue(key, value)) return false;
  }
  return true;
}

function isKnownId(id: string): boolean {
  return ID_PATTERNS.some((re) => re.test(id));
}

function validateOverridesFile(o: unknown): o is DesignOverridesFile {
  if (!isPlainObject(o)) return false;
  for (const [elementId, scoped] of Object.entries(o)) {
    if (!isKnownId(elementId)) return false;
    if (!isPlainObject(scoped)) return false;
    for (const [scope, patch] of Object.entries(scoped)) {
      if (!WHITELISTED_SCOPES.includes(scope as never)) return false;
      if (!validateElementOverride(patch)) return false;
    }
  }
  return true;
}

type RawMediaEntry = {
  id: unknown;
  type: unknown;
  src: unknown;
  caption?: unknown;
  alt?: unknown;
  decorative?: unknown;
  layout: unknown;
  insertAfterId?: unknown;
  link?: unknown;
  filename?: unknown;
};

function validateMediaEntry(o: unknown): o is RawMediaEntry {
  if (!isPlainObject(o)) return false;
  const e = o as RawMediaEntry;
  if (typeof e.id !== "string" || !MEDIA_ID_PATTERN.test(e.id)) return false;
  if (e.type !== "image" && e.type !== "video") return false;
  if (typeof e.src !== "string" || !(e.src.startsWith(STAGED_PREFIX) || e.src.startsWith(APPROVED_PREFIX))) return false;
  if (e.layout !== "full" && e.layout !== "half") return false;
  if (e.caption !== undefined && typeof e.caption !== "string") return false;
  if (e.alt !== undefined && typeof e.alt !== "string") return false;
  if (e.decorative !== undefined && typeof e.decorative !== "boolean") return false;
  if (e.insertAfterId !== undefined && (typeof e.insertAfterId !== "string" || !MEDIA_ID_PATTERN.test(e.insertAfterId))) return false;
  if (e.link !== undefined && typeof e.link !== "string") return false;
  if (e.filename !== undefined && typeof e.filename !== "string") return false;
  if (e.alt === undefined && e.decorative !== true && e.type === "image" && !e.caption) {
    // Alt text (or an explicit decorative flag, or a caption to fall back
    // to) is required for new images — enforced here too, not only in the UI.
    return false;
  }
  return true;
}

function validateMediaOrderFile(o: unknown): o is MediaOrderFile {
  if (!isPlainObject(o)) return false;
  for (const [slug, order] of Object.entries(o)) {
    if (!SLUG_PATTERN.test(slug)) return false;
    if (!Array.isArray(order)) return false;
    for (const id of order) {
      if (typeof id !== "string" || !MEDIA_ORDER_ID_PATTERN.test(id)) return false;
    }
  }
  return true;
}

function validateMediaFile(o: unknown): o is Record<string, RawMediaEntry[]> {
  if (!isPlainObject(o)) return false;
  for (const [slug, list] of Object.entries(o)) {
    if (!SLUG_PATTERN.test(slug)) return false;
    if (!Array.isArray(list)) return false;
    for (const entry of list) {
      if (!validateMediaEntry(entry)) return false;
    }
  }
  return true;
}

/** Renames staging → public/design-media, resolving filename collisions without overwriting anything. */
function promoteStagedFile(stagedUrl: string, stagingDir: string, publicMediaDir: string, slug: string): string {
  const storedName = decodeURIComponent(stagedUrl.slice(STAGED_PREFIX.length));
  const stagedPath = path.resolve(stagingDir, storedName);
  if (!stagedPath.startsWith(path.resolve(stagingDir) + path.sep) || !existsSync(stagedPath)) {
    throw new Error(`Staged file not found: ${storedName}`);
  }
  // storedName is "<token>__<sanitizedOriginalName>" — drop the token for the
  // approved filename, since it no longer needs to be unique on its own.
  const originalName = storedName.includes("__") ? storedName.slice(storedName.indexOf("__") + 2) : storedName;
  const ext = path.extname(originalName);
  const base = originalName.slice(0, originalName.length - ext.length);

  const destDir = path.join(publicMediaDir, slug);
  mkdirSync(destDir, { recursive: true });
  let finalName = originalName;
  let n = 2;
  while (existsSync(path.join(destDir, finalName))) {
    finalName = `${base}-${n}${ext}`;
    n += 1;
  }
  renameSync(stagedPath, path.join(destDir, finalName));
  return `${APPROVED_PREFIX}${slug}/${finalName}`;
}

/**
 * Dev-only Vite middleware, active only under `vite dev --mode design`.
 * Never present in the production build (see vite.config.ts) and never
 * imported by anything under src/routes/** or src/server.ts.
 */
export function designModeSavePlugin(
  overridesFilePath: string,
  mediaAdditionsFilePath: string,
  mediaOrderFilePath: string,
  stagingDir: string,
  publicMediaDir: string,
): Plugin {
  let mode = "";
  return {
    name: "design-mode-save-endpoint",
    configResolved(config) {
      mode = config.mode;
    },
    configureServer(server: ViteDevServer) {
      if (mode !== "design") return;
      server.middlewares.use("/__design-mode/save", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 2_000_000) req.destroy();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body) as { overrides?: unknown; media?: unknown; mediaOrder?: unknown };
            if (!validateOverridesFile(payload.overrides)) {
              res.statusCode = 400;
              res.end("Invalid overrides payload");
              return;
            }
            const mediaPayload = payload.media ?? {};
            if (!validateMediaFile(mediaPayload)) {
              res.statusCode = 400;
              res.end(
                "Invalid media payload — check that every added image has alt text (or is marked decorative) and every entry has a valid id, type, and layout.",
              );
              return;
            }
            const mediaOrderPayload = payload.mediaOrder ?? {};
            if (!validateMediaOrderFile(mediaOrderPayload)) {
              res.statusCode = 400;
              res.end("Invalid media order payload");
              return;
            }

            // Promote any still-staged files (new uploads, replacements) to
            // their approved location before writing anything to disk, so a
            // failure here leaves the previous approved state untouched.
            const overrides = payload.overrides as DesignOverridesFile;
            for (const [elementId, scoped] of Object.entries(overrides)) {
              const slugMatch = /^project\.([a-z0-9-]+)\./.exec(elementId);
              const slug = slugMatch?.[1] ?? "misc";
              for (const patch of Object.values(scoped)) {
                if (patch.src?.startsWith(STAGED_PREFIX)) {
                  patch.src = promoteStagedFile(patch.src, stagingDir, publicMediaDir, slug);
                }
              }
            }
            const media = mediaPayload as Record<string, RawMediaEntry[]>;
            for (const [slug, list] of Object.entries(media)) {
              for (const entry of list) {
                if (typeof entry.src === "string" && entry.src.startsWith(STAGED_PREFIX)) {
                  entry.src = promoteStagedFile(entry.src, stagingDir, publicMediaDir, slug);
                }
              }
            }

            // The client always sends its complete working set (already
            // initialized from whatever was previously saved), so this is a
            // full replace — not a merge — or a Reset/Remove on the client
            // could never actually clear a previously-saved value.
            const overridesAbs = path.resolve(overridesFilePath);
            writeFileSync(overridesAbs, JSON.stringify(overrides, null, 2) + "\n", "utf-8");
            const mediaAbs = path.resolve(mediaAdditionsFilePath);
            writeFileSync(mediaAbs, JSON.stringify(media, null, 2) + "\n", "utf-8");
            const mediaOrder = mediaOrderPayload as MediaOrderFile;
            const mediaOrderAbs = path.resolve(mediaOrderFilePath);
            writeFileSync(mediaOrderAbs, JSON.stringify(mediaOrder, null, 2) + "\n", "utf-8");

            // The client reloads its canvas iframe right after this request
            // resolves, expecting the freshly-written files. Vite's own file
            // watcher would pick them up too, but asynchronously and with no
            // ordering guarantee against that reload — invalidating both
            // module graphs here makes the next request deterministic
            // instead of racing the watcher.
            for (const abs of [overridesAbs, mediaAbs, mediaOrderAbs]) {
              const clientMod = server.moduleGraph.getModuleById(abs);
              if (clientMod) server.moduleGraph.invalidateModule(clientMod);
              const ssrGraph = server.environments?.ssr?.moduleGraph;
              const ssrMod = ssrGraph?.getModuleById(abs);
              if (ssrGraph && ssrMod) ssrGraph.invalidateModule(ssrMod);
            }

            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, overrides, media, mediaOrder }));
          } catch (err) {
            res.statusCode = 400;
            res.end(`Bad request: ${(err as Error).message}`);
          }
        });
      });

      // So the client can show the *proposed* approved destination before
      // committing — read-only, no filesystem writes.
      server.middlewares.use("/__design-mode/media-preview-path", (req, res) => {
        try {
          const url = new URL(req.url ?? "", "http://localhost");
          const staged = url.searchParams.get("staged") ?? "";
          const slug = url.searchParams.get("slug") ?? "misc";
          if (!staged.startsWith(STAGED_PREFIX) || !SLUG_PATTERN.test(slug)) {
            res.statusCode = 400;
            res.end("Bad request");
            return;
          }
          const storedName = decodeURIComponent(staged.slice(STAGED_PREFIX.length));
          const originalName = storedName.includes("__") ? storedName.slice(storedName.indexOf("__") + 2) : storedName;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ path: `public/design-media/${slug}/${originalName}` }));
        } catch {
          res.statusCode = 400;
          res.end("Bad request");
        }
      });
    },
  };
}

