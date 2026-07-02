import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProjectModal } from "@/components/project-modal";
import { HUBS, projectsByHub, type Hub, type Project } from "@/lib/projects";

const HUB_SLUGS = new Set(HUBS.map((h) => h.slug));

export const Route = createFileRoute("/work/$hub/")({
  loader: ({ params }) => {
    if (!HUB_SLUGS.has(params.hub as Hub)) throw notFound();
    const hub = HUBS.find((h) => h.slug === params.hub)!;
    return { hub, projects: projectsByHub(hub.slug) };
  },
  head: ({ params }) => {
    const hub = HUBS.find((h) => h.slug === params.hub);
    const title = hub ? `${hub.title} — Reid Graham` : "Work — Reid Graham";
    const desc = hub?.description ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(hub ? [{ property: "og:image", content: hub.cover }] : []),
      ],
    };
  },
  component: HubPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-foreground/60">Section not found.</p>
    </div>
  ),
});

function HubPage() {
  const { hub, projects } = Route.useLoaderData();
  const [active, setActive] = useState<Project | null>(null);

  return (
    <div>
      <SiteNav />

      {/* Header */}
      <header className="pt-32 md:pt-40 pb-16 px-6 md:px-12 lg:px-16 border-b border-border">
        <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
          Chapter {hub.chapter}
        </p>
        <h1 className="font-display font-black uppercase tracking-[-0.03em] leading-[0.9] text-5xl md:text-8xl animate-reveal">
          {hub.title}
        </h1>
        <p className="mt-6 font-display font-light text-lg md:text-2xl text-foreground/80 max-w-3xl text-balance">
          {hub.description}
        </p>
      </header>

      {/* Square grid of projects */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50">
            {projects.length} Projects
          </p>
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 hidden md:block">
            Select to enter
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {projects.map((p: Project, idx: number) => (
            <li key={p.slug}>
              <button
                type="button"
                onClick={() => setActive(p)}
                className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                aria-label={`Open ${p.title}`}
              >
                <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
                  <img
                    src={p.cover}
                    alt={p.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-[900ms] ease-cinematic"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
                  <div className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-foreground/70">
                    0{idx + 1}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl leading-[0.95] text-balance group-hover:text-accent transition-colors">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-[10px] tracking-[0.25em] uppercase text-foreground/70 line-clamp-1">
                      {p.subtitle}
                    </p>
                  </div>
                  <span className="absolute top-4 right-4 pill opacity-0 group-hover:opacity-100 transition-opacity">
                    Enter →
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Sibling hubs */}
      <section className="border-t border-border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {HUBS.filter((h) => h.slug !== hub.slug).map((h) => (
          <Link
            key={h.slug}
            to="/work/$hub"
            params={{ hub: h.slug }}
            className="group px-6 md:px-12 py-12 md:py-16 hover:bg-secondary/40 transition-colors"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-3">
              Chapter {h.chapter}
            </p>
            <h3 className="font-display font-black uppercase tracking-tight text-3xl md:text-4xl group-hover:text-accent transition-colors">
              {h.title}
            </h3>
            <p className="mt-3 text-sm text-foreground/60 max-w-md">{h.tagline}</p>
          </Link>
        ))}
      </section>

      <SiteFooter />

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </div>
  );
}
