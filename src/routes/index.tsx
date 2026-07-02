import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { HUBS, HERO_URL, PROJECTS } from "@/lib/projects";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reid Graham Design — Experiential, Scenic & Architecture" },
      {
        name: "description",
        content:
          "The portfolio of Reid Graham — production/scenic design, architecture and visualization work exploring spatial storytelling.",
      },
      { property: "og:title", content: "Reid Graham Design" },
      {
        property: "og:description",
        content:
          "Experiential, scenic and architectural design — a portfolio of built and speculative worlds.",
      },
      { property: "og:image", content: HERO_URL },
      { name: "twitter:image", content: HERO_URL },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="relative">
      <SiteNav variant="top-transparent" />

      {/* Split hero: title left, full-bleed image right */}
      <header className="relative h-screen min-h-[720px] w-full overflow-hidden">
        {/* Image on right ~55% */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[55%] z-0">
          <img
            src={HERO_URL}
            alt="Payphone booth in an overgrown, neon-lit environment — a still from Reid Graham's Immersion rendering"
            className="w-full h-full object-cover animate-slow-zoom"
          />
          {/* Left-edge fade into black so title reads cleanly */}
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background via-background/70 to-transparent" />
          {/* Mobile: darken more */}
          <div className="absolute inset-0 md:hidden bg-background/60" />
        </div>

        {/* Title block */}
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 lg:px-16 pt-24">
          <div className="max-w-[720px]">
            <h1 className="font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(3.5rem,10vw,9.5rem)] animate-reveal">
              Reid Graham
            </h1>
            <p className="font-thin uppercase leading-[0.9] tracking-[0.02em] text-[clamp(2.5rem,8vw,7rem)] mt-2 md:mt-0 animate-reveal-delay text-foreground/95">
              Design
            </p>
          </div>
        </div>

        {/* Bottom category pills */}
        <div className="absolute bottom-8 md:bottom-12 left-0 right-0 z-10 px-6 md:px-12 lg:px-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              {HUBS.map((h) => (
                <Link
                  key={h.slug}
                  to="/work/$hub"
                  params={{ hub: h.slug }}
                  className="pill pill-lg"
                >
                  {h.title.toUpperCase()}
                </Link>
              ))}
            </div>
            <Link to="/contact" className="pill pill-lg">CONTACT</Link>
          </div>
        </div>
      </header>

      {/* Intro / statement */}
      <section className="px-6 md:px-12 lg:px-16 py-24 md:py-32 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <p className="md:col-span-3 text-[10px] tracking-[0.3em] uppercase text-foreground/50">
            Portfolio · MMXXVI
          </p>
          <p className="md:col-span-9 font-display font-light text-2xl md:text-4xl leading-tight tracking-tight text-balance">
            Reid Graham is a designer working across{" "}
            <span className="text-foreground">production &amp; scenic design</span>,{" "}
            <span className="text-foreground">architecture</span>, and{" "}
            <span className="text-foreground">visualization</span> — building rooms, sets, and speculative worlds that ask the viewer to step inside.
          </p>
        </div>
      </section>

      {/* Hubs — three tiles with thumbnails, like the reference index bar */}
      <section className="px-6 md:px-12 lg:px-16 pb-24 md:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {HUBS.map((hub) => {
            const count = PROJECTS.filter((p) => p.hub === hub.slug).length;
            return (
              <Link
                key={hub.slug}
                to="/work/$hub"
                params={{ hub: hub.slug }}
                className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-secondary"
              >
                <img
                  src={hub.cover}
                  alt={hub.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-[1.03] transition-all duration-1000 ease-cinematic"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                  <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-foreground/60">
                    {hub.chapter} · {count} projects
                  </span>
                  <div>
                    <h2 className="font-display font-black uppercase tracking-tight leading-[0.9] text-3xl md:text-4xl lg:text-5xl">
                      {hub.title}
                    </h2>
                    <p className="mt-3 text-sm text-foreground/70 max-w-xs">{hub.tagline}</p>
                    <span className="mt-6 inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase">
                      Enter
                      <span className="h-px w-6 bg-foreground group-hover:w-12 transition-all duration-500" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Selected projects — quick index */}
      <section className="px-6 md:px-12 lg:px-16 pb-32 border-t border-border pt-24">
        <div className="mb-12 flex items-end justify-between flex-wrap gap-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-3">Index</p>
            <h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight">
              All projects
            </h2>
          </div>
        </div>
        <ul className="divide-y divide-border border-t border-b border-border">
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <Link
                to="/work/$hub/$slug"
                params={{ hub: p.hub, slug: p.slug }}
                className="group grid grid-cols-12 items-center gap-4 py-5 hover:bg-secondary/40 px-2 -mx-2 transition-colors"
              >
                <span className="col-span-7 md:col-span-6 font-display font-semibold uppercase tracking-tight text-lg md:text-2xl group-hover:text-accent transition-colors">
                  {p.title}
                </span>
                <span className="hidden md:block col-span-4 text-xs tracking-[0.2em] uppercase text-foreground/60">
                  {HUBS.find((h) => h.slug === p.hub)?.title}
                </span>
                <span className="col-span-5 md:col-span-2 text-right text-[10px] tracking-[0.3em] uppercase text-foreground/50">
                  View →
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
