import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { HUBS, PROJECTS } from "@/lib/projects";

export const Route = createFileRoute("/work")({
  head: () => ({
    meta: [
      { title: "Work — Reid Graham" },
      {
        name: "description",
        content:
          "Selected work across four practices: experiential design, scenic design, architecture, and visualizations.",
      },
      { property: "og:title", content: "Work — Reid Graham" },
      {
        property: "og:description",
        content: "Four practices, one spatial language.",
      },
    ],
  }),
  component: WorkIndex,
});

function WorkIndex() {
  return (
    <div>
      <SiteNav mixBlend={false} />

      <header className="pt-40 pb-24 px-6 md:px-10 border-b border-border">
        <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-8">
          Index of work · {PROJECTS.length} projects
        </p>
        <h1 className="font-display text-6xl md:text-9xl font-extrabold tracking-tighter uppercase leading-[0.85] text-balance max-w-5xl animate-reveal">
          Four practices,
          <br />
          <span className="font-serif italic font-normal normal-case tracking-normal text-muted-foreground">
            one language of space.
          </span>
        </h1>
      </header>

      {/* Hub tiles */}
      <section className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
        {HUBS.map((hub, i) => (
          <Link
            key={hub.slug}
            to="/work/$hub"
            params={{ hub: hub.slug }}
            className={
              "group relative aspect-[4/3] overflow-hidden border-border " +
              (i % 2 === 0 ? "md:border-r" : "") +
              (i < 2 ? " border-b" : "")
            }
          >
            <img
              src={hub.cover}
              alt={hub.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover grayscale-[0.6] opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000 ease-cinematic"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-accent font-display font-bold text-xs tracking-[0.3em] uppercase">
                  {hub.chapter}
                </span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                  {PROJECTS.filter((p) => p.hub === hub.slug).length} projects
                </span>
              </div>
              <div>
                <h2 className="font-display text-5xl md:text-7xl font-extrabold tracking-tighter uppercase mb-4">
                  {hub.title}
                </h2>
                <p className="font-serif italic text-lg text-foreground/80 max-w-md">
                  {hub.tagline}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* Full index list */}
      <section className="px-6 md:px-10 py-24">
        <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-12">
          All projects — chronological
        </p>
        <ul>
          {PROJECTS.map((p) => (
            <li key={p.slug} className="border-t border-border last:border-b">
              <Link
                to="/work/$hub/$slug"
                params={{ hub: p.hub, slug: p.slug }}
                className="group grid grid-cols-12 gap-4 py-6 items-center hover:bg-ash/50 transition-colors px-2 -mx-2"
              >
                <span className="col-span-1 text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  {String(PROJECTS.indexOf(p) + 1).padStart(2, "0")}
                </span>
                <span className="col-span-7 md:col-span-6 font-serif italic text-xl md:text-2xl group-hover:text-accent transition-colors">
                  {p.title}
                </span>
                <span className="hidden md:block col-span-3 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                  {HUBS.find((h) => h.slug === p.hub)?.title}
                </span>
                <span className="col-span-4 md:col-span-2 text-right text-[11px] tracking-[0.2em] uppercase text-muted-foreground truncate">
                  {p.subtitle}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </div>
  );
}
