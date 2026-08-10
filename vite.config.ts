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
   * Netlify by default, so nothing about the existing GitHub → Netlify flow
   * changes. Cloudflare Pages sets NITRO_PRESET=cloudflare-pages in its own
   * build environment and gets a Workers build from the same commit — two
   * hosts off one repo, without either of them needing a branch of its own.
   *
   * The preset decides where the server bundle lands, which is why it can't
   * just be swapped by hand per deploy: netlify writes to
   * .netlify/functions-internal/, cloudflare-pages writes a worker into dist/.
   */
  nitro: {
    preset: process.env.NITRO_PRESET ?? "netlify",
  },
});
