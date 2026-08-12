// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
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
