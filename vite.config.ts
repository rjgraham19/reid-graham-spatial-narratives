// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { designModeSavePlugin } from "./src/design-mode/dev-save-plugin";
import { designModePublishPlugin } from "./src/design-mode/dev-publish-plugin";
import { designModeMediaPlugin } from "./src/design-mode/dev-media-plugin";
import { designModeResumePlugin } from "./src/design-mode/dev-resume-plugin";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  /* Local-only Design Mode save + publish + media endpoints. All three
     plugins no-op unless running `vite dev --mode design` (see
     dev-save-plugin.ts / dev-publish-plugin.ts / dev-media-plugin.ts) — this
     file is Node build tooling, never bundled into the app, so including it
     here carries no production risk regardless.
     Save (writes design-overrides.json + design-media-additions.json,
     promoting any staged uploads into public/design-media/ as part of the
     same write) and Publish (git commit + push) stay two separate
     endpoints/actions deliberately — approving a design change should never
     itself trigger a live deploy. Uploads stage into .design-mode-staging/
     (gitignored) until approved. */
  vite: {
    plugins: [
      designModeSavePlugin(
        "./src/lib/design-overrides.json",
        "./src/lib/design-media-additions.json",
        "./.design-mode-staging",
        "./public/design-media",
      ),
      designModePublishPlugin("."),
      designModeMediaPlugin("./.design-mode-staging"),
      /* Résumé replacement — a fourth, deliberately separate dev-only
         endpoint. It writes straight to public/resume.pdf and
         src/lib/resume-meta.json rather than going through the media
         pipeline above, since a résumé is one file at a fixed path with no
         draft/approve state worth having (see dev-resume-plugin.ts). */
      designModeResumePlugin("./public/resume.pdf", "./src/lib/resume-meta.json"),
    ],
  },
  /* Which host this build targets.
   *
   * Cloudflare Pages by default, because that's where the site is hosted.
   * This has to be the default rather than something Cloudflare sets in its
   * dashboard: the preset decides where the server bundle lands, and under
   * the netlify preset the build emits .netlify/functions-internal/ and a
   * dist/ with no worker in it at all — assets and nothing to render them.
   * Cloudflare would deploy that quite happily and serve nothing.
   *
   * Netlify still builds correctly from the same commit by setting
   * NITRO_PRESET=netlify in its own build environment.
   */
  nitro: {
    preset: process.env.NITRO_PRESET ?? "cloudflare-pages",
  },
});
