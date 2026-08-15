import { writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import type { DesignOverridesFile, ElementOverride } from "../lib/design-overrides.types";
import { WHITELISTED_IMAGE_PROPS, WHITELISTED_TEXT_PROPS, WHITELISTED_SCOPES } from "../lib/design-overrides.types";

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
];

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

/**
 * Dev-only Vite middleware, active only under `vite dev --mode design`.
 * Never present in the production build (see vite.config.ts) and never
 * imported by anything under src/routes/** or src/server.ts.
 */
export function designModeSavePlugin(overridesFilePath: string): Plugin {
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
            const payload = JSON.parse(body) as { overrides?: unknown };
            if (!validateOverridesFile(payload.overrides)) {
              res.statusCode = 400;
              res.end("Invalid overrides payload");
              return;
            }

            // The client always sends its complete working set (already
            // initialized from whatever was previously saved), so this is a
            // full replace — not a merge — or a Reset on the client could
            // never actually clear a previously-saved value.
            const absPath = path.resolve(overridesFilePath);
            writeFileSync(absPath, JSON.stringify(payload.overrides, null, 2) + "\n", "utf-8");

            // The client reloads its canvas iframe right after this request
            // resolves, expecting the freshly-written file. Vite's own file
            // watcher would pick up the change too, but asynchronously and
            // with no ordering guarantee against that reload — invalidating
            // both module graphs here makes the next request deterministic
            // instead of racing the watcher.
            const clientMod = server.moduleGraph.getModuleById(absPath);
            if (clientMod) server.moduleGraph.invalidateModule(clientMod);
            const ssrGraph = server.environments?.ssr?.moduleGraph;
            const ssrMod = ssrGraph?.getModuleById(absPath);
            if (ssrGraph && ssrMod) ssrGraph.invalidateModule(ssrMod);

            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.statusCode = 400;
            res.end(`Bad request: ${(err as Error).message}`);
          }
        });
      });
    },
  };
}
