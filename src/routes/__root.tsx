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
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter+Tight:wght@400;600;700;800&family=Poppins:wght@100;200;300;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap",
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

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
