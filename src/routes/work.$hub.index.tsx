import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
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

  return (
    <div>
      <SiteNav />

      {/* Header — mirrors the reference: title + thumbnail strip */}
      <header className="pt-32 md:pt-40 pb-10 px-6 md:px-12 lg:px-16 border-b border-border">
        <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
          Chapter {hub.chapter}
        </p>
        <h1 className="font-display font-black uppercase tracking-[-0.03em] leading-[0.9] text-5xl md:text-8xl animate-reveal">
          {hub.title}
        </h1>
        <p className="mt-6 font-display font-light text-lg md:text-2xl text-foreground/80 max-w-3xl text-balance">
          {hub.description}
        </p>

        {/* Thumbnail strip (reference-style) */}
        <div className="mt-12 -mx-2 md:-mx-3 overflow-x-auto pb-2">
          <ul className="flex gap-3 md:gap-4 min-w-full snap-x">
            {projects.map((p: Project) => (
              <li key={p.slug} className="snap-start shrink-0 w-40 md:w-56">
                <Link
                  to="/work/$hub/$slug"
                  params={{ hub: p.hub, slug: p.slug }}
                  className="group block"
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-md bg-secondary">
                    <img
                      src={p.cover}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-700 ease-cinematic"
                    />
                  </div>
                  <p className="mt-2 text-[10px] tracking-[0.15em] uppercase text-foreground/70 group-hover:text-accent transition-colors line-clamp-2">
                    {p.title}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Projects — reference-style long stacked layout */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 space-y-24 md:space-y-32">
        {projects.map((p: Project, idx: number) => (
          <Link
            key={p.slug}
            to="/work/$hub/$slug"
            params={{ hub: p.hub, slug: p.slug }}
            className="group block"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-end">
              <div
                className={
                  "md:col-span-9 overflow-hidden rounded-md bg-secondary " +
                  (idx % 2 === 1 ? "md:col-start-4" : "")
                }
              >
                <img
                  src={p.cover}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-auto max-h-[70vh] object-cover group-hover:scale-[1.02] transition-transform duration-1000 ease-cinematic"
                />
              </div>
              <div
                className={
                  "md:col-span-3 " +
                  (idx % 2 === 1 ? "md:col-start-1 md:row-start-1 md:text-right" : "")
                }
              >
                <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-3">
                  0{idx + 1} · {hub.title}
                </p>
                <h2 className="font-display font-black uppercase tracking-tight text-3xl md:text-4xl leading-[0.95] group-hover:text-accent transition-colors">
                  {p.title}
                </h2>
                <p className="mt-3 text-sm text-foreground/60 tracking-[0.1em] uppercase">
                  {p.subtitle}
                </p>
                <span className="mt-6 inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase">
                  Enter
                  <span className="h-px w-6 bg-foreground group-hover:w-16 transition-all duration-500" />
                </span>
              </div>
            </div>
          </Link>
        ))}
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
    </div>
  );
}
