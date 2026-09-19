import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useLenis } from "../hooks/use-lenis";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-accent">Error 404</p>
        <h1 className="mt-6 font-display text-6xl font-extrabold tracking-tighter uppercase">
          Lost in the dark.
        </h1>
        <p className="mt-4 font-serif italic text-lg text-muted-foreground">
          This room isn't part of the exhibition.
        </p>
        <Link
          to="/"
          className="mt-10 inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:text-accent transition-colors"
        >
          Return to entrance
          <span className="h-px w-8 bg-foreground" />
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-[10px] tracking-[0.3em] uppercase text-accent">Interruption</p>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tighter uppercase">
          The set collapsed.
        </h1>
        <p className="mt-4 font-serif italic text-muted-foreground">
          Something didn't load. Reset the scene and try again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-[10px] font-bold tracking-[0.3em] uppercase">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="hover:text-accent transition-colors"
          >
            Try again
          </button>
          <a href="/" className="hover:text-accent transition-colors">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Reid Graham — Experiential Designer" },
      {
        name: "description",
        content:
          "Reid Graham is an experiential designer working at the intersection of architecture, scenic design, and immersive spatial storytelling.",
      },
      { name: "author", content: "Reid Graham" },
      { property: "og:title", content: "Reid Graham — Experiential Designer" },
      {
        property: "og:description",
        content:
          "Spatial narratives through architecture, scenic design, and immersive environments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/favicon-256.png", type: "image/png", sizes: "256x256" },
      { rel: "apple-touch-icon", href: "/favicon-256.png" },
      // Fonts are self-hosted (see the @font-face rules in styles.css) rather
      // than loaded from Google Fonts, so there's no external font request
      // to throttle or delay — no preconnect/stylesheet links needed here.
      //
      // They're still `font-display: optional`, which only gives the browser
      // a ~100ms window to fetch a font before permanently committing to the
      // fallback for that page view (no swapping in later, which is what
      // keeps a long-word title from reflowing once the real font lands).
      // Normally that fetch doesn't even start until the browser has
      // downloaded and parsed styles.css and matched an element to the
      // @font-face rule — on a cold cache that's often already past the
      // 100ms mark, which is why a first visit can land on the fallback and
      // a refresh (font now cached) does not. Preloading starts the fetch
      // immediately, in parallel with the stylesheet itself, so the font is
      // far more likely to make the window on the very first load. Limited
      // to DM Sans (body copy) and Poppins (every heading/label) — the two
      // families on screen the instant any page paints; EB Garamond and
      // JetBrains Mono show up further down the page, where there's no
      // first-paint deadline to beat.
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/dm-sans-variable.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/poppins-900.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/poppins-700.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/poppins-500.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/poppins-300.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/poppins-200.woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/poppins-100.woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useLenis();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
