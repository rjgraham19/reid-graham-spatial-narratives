import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { HUBS, PROJECTS, projectsByHub, type Hub } from "@/lib/projects";

const HUB_SLUGS = new Set(HUBS.map((h) => h.slug));

export const Route = createFileRoute("/work/$hub")({
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
      ],
    };
  },
  component: HubPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-serif italic text-muted-foreground">Hub not found.</p>
    </div>
  ),
});

function HubPage() {
  const { hub, projects } = Route.useLoaderData();

  return (
    <div>
      <SiteNav mixBlend={false} />

      {/* Hub header with cover backdrop */}
      <header className="relative pt-40 pb-32 px-6 md:px-10 overflow-hidden border-b border-border">
        <img
          src={hub.cover}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-25 grayscale-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
        <div className="relative max-w-5xl animate-reveal">
          <Link
            to="/work"
            className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground hover:text-accent transition-colors mb-12"
          >
            <span className="h-px w-8 bg-current" /> Back to index
          </Link>
          <p className="text-accent font-display font-bold text-xs tracking-[0.3em] uppercase mb-6">
            {hub.chapter}
          </p>
          <h1 className="font-display text-6xl md:text-[9rem] font-extrabold tracking-tighter uppercase leading-[0.85]">
            {hub.title}
          </h1>
          <p className="mt-10 font-serif italic text-xl md:text-3xl text-muted-foreground max-w-3xl text-balance">
            {hub.tagline}
          </p>
          <p className="mt-6 max-w-xl text-sm md:text-base text-foreground/70 leading-relaxed">
            {hub.description}
          </p>
        </div>
      </header>

      {/* Projects */}
      <section className="px-6 md:px-10 py-24 md:py-32 space-y-32">
        {projects.length === 0 ? (
          <p className="font-serif italic text-muted-foreground">
            No projects published in this hub yet.
          </p>
        ) : (
          projects.map((p, idx) => (
            <Link
              key={p.slug}
              to="/work/$hub/$slug"
              params={{ hub: p.hub, slug: p.slug }}
              className="group grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12"
            >
              <div
                className={
                  "md:col-span-8 " + (idx % 2 === 1 ? "md:order-2" : "")
                }
              >
                <div className="w-full aspect-[4/3] overflow-hidden bg-ash">
                  <img
                    src={p.cover}
                    alt={p.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-1000 ease-cinematic"
                  />
                </div>
              </div>
              <div
                className={
                  "md:col-span-4 flex flex-col justify-end " +
                  (idx % 2 === 1 ? "md:order-1" : "")
                }
              >
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
                  {p.chapter} · {p.year}
                </p>
                <h3 className="font-serif italic text-4xl md:text-5xl leading-tight group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="mt-4 text-foreground/70 max-w-sm">{p.logline}</p>
                <div className="mt-8 flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase">
                  Enter
                  <span className="h-px w-8 bg-foreground group-hover:w-16 group-hover:bg-accent transition-all duration-500" />
                </div>
              </div>
            </Link>
          ))
        )}
      </section>

      {/* Adjacent hubs */}
      <section className="border-t border-border grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
        {HUBS.filter((h) => h.slug !== hub.slug)
          .slice(0, 3)
          .map((h) => (
            <Link
              key={h.slug}
              to="/work/$hub"
              params={{ hub: h.slug }}
              className="group px-6 md:px-10 py-16 hover:bg-ash/40 transition-colors"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
                {h.chapter}
              </p>
              <h4 className="font-display text-3xl font-extrabold tracking-tighter uppercase group-hover:text-accent transition-colors">
                {h.title}
              </h4>
              <p className="mt-2 font-serif italic text-sm text-muted-foreground max-w-xs">
                {h.tagline}
              </p>
            </Link>
          ))}
      </section>

      <SiteFooter />
    </div>
  );
}
