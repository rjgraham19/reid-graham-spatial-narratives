import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import { HUBS, PROJECTS } from "@/lib/projects";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const featured = PROJECTS[0]; // The Liminal Chamber

  return (
    <div className="relative">
      <SiteNav />

      {/* Hero — The Darkened Entry */}
      <header className="relative h-screen min-h-[720px] w-full flex flex-col justify-end px-6 md:px-10 pb-16 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="A monumental architectural installation lit by a single beam of light through fog"
            width={1920}
            height={1080}
            className="w-full h-full object-cover opacity-70 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/30" />
        </div>

        <div className="relative max-w-5xl">
          <p className="animate-fade-in-slow text-[10px] tracking-[0.35em] uppercase text-accent mb-8">
            Experiential Designer · Portfolio MMXXVI
          </p>
          <h1 className="animate-reveal font-display text-[clamp(3rem,9vw,10rem)] font-extrabold leading-[0.85] tracking-tighter text-balance uppercase">
            Building
            <br />
            worlds.
          </h1>
          <div className="mt-8 flex items-baseline gap-6 animate-reveal-delay">
            <div className="h-px w-24 bg-accent shrink-0" />
            <p className="font-serif italic text-lg md:text-2xl text-muted-foreground max-w-md">
              Reid Graham crafts spatial narratives at the intersection of architecture, stage, and light.
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 right-6 md:right-10 z-10 text-[10px] tracking-[0.3em] text-muted-foreground uppercase hidden md:flex items-center gap-3">
          <span>Scroll</span>
          <span className="h-px w-12 bg-muted-foreground" />
        </div>
      </header>

      {/* Practice hubs — Chapters */}
      <main className="w-full px-6 md:px-10 py-32">
        <div className="mb-24 flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground mb-4">
              Four practices
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-extrabold tracking-tighter uppercase max-w-2xl text-balance">
              Each project is its own room.
            </h2>
          </div>
          <Link
            to="/work"
            className="hidden md:inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:text-accent transition-colors group"
          >
            All work
            <span className="h-px w-8 bg-foreground group-hover:w-16 group-hover:bg-accent transition-all duration-500" />
          </Link>
        </div>

        <div className="space-y-40 md:space-y-56">
          {/* Experiential */}
          <HubRow hub={HUBS[0]} align="right" />
          {/* Scenic */}
          <HubRow hub={HUBS[1]} align="left" />

          {/* Compact grid for hubs 3 & 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
            {HUBS.slice(2).map((hub) => (
              <Link
                key={hub.slug}
                to="/work/$hub"
                params={{ hub: hub.slug }}
                className="group block space-y-8"
              >
                <div className="w-full aspect-[3/4] bg-ash overflow-hidden">
                  <img
                    src={hub.cover}
                    alt={hub.title}
                    loading="lazy"
                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-cinematic"
                  />
                </div>
                <div>
                  <span className="text-accent font-display font-bold text-xs tracking-[0.25em] uppercase">
                    {hub.chapter}
                  </span>
                  <h3 className="text-3xl md:text-4xl font-display font-extrabold tracking-tighter uppercase mt-2">
                    {hub.title}
                  </h3>
                  <p className="text-muted-foreground mt-3 max-w-xs font-serif italic">
                    {hub.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured narrative */}
        <section className="mt-48 border-t border-border pt-24">
          <div className="mb-12 flex items-end justify-between flex-wrap gap-6">
            <div>
              <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-4">
                Currently on view
              </p>
              <h2 className="font-serif italic text-4xl md:text-6xl leading-none">
                {featured.title}
              </h2>
            </div>
            <Link
              to="/work/$hub/$slug"
              params={{ hub: featured.hub, slug: featured.slug }}
              className="inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:text-accent transition-colors group"
            >
              Enter the room
              <span className="h-px w-8 bg-foreground group-hover:w-16 group-hover:bg-accent transition-all duration-500" />
            </Link>
          </div>
          <Link
            to="/work/$hub/$slug"
            params={{ hub: featured.hub, slug: featured.slug }}
            className="block group"
          >
            <div className="w-full aspect-[21/9] overflow-hidden bg-ash">
              <img
                src={featured.cover}
                alt={featured.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-1000 ease-cinematic"
              />
            </div>
          </Link>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 max-w-2xl">
              <p className="font-serif italic text-2xl md:text-3xl leading-snug text-foreground/90 text-balance">
                "{featured.logline}"
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                Themes
              </p>
              <ul className="space-y-2 text-sm font-serif italic text-foreground/80">
                {featured.themes.map((t) => (
                  <li key={t}>— {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function HubRow({
  hub,
  align,
}: {
  hub: (typeof HUBS)[number];
  align: "left" | "right";
}) {
  const imageFirst = align === "right";
  return (
    <Link
      to="/work/$hub"
      params={{ hub: hub.slug }}
      className="group relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center"
    >
      <div
        className={
          "md:col-span-7 overflow-hidden bg-ash aspect-[4/5] md:aspect-[16/10] " +
          (imageFirst ? "md:order-1" : "md:order-2")
        }
      >
        <img
          src={hub.cover}
          alt={hub.title}
          loading="lazy"
          className="w-full h-full object-cover grayscale-[0.6] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-cinematic"
        />
      </div>
      <div
        className={
          "md:col-span-5 " +
          (imageFirst ? "md:order-2 md:pl-12" : "md:order-1 md:pr-12")
        }
      >
        <span className="text-accent font-display font-bold text-sm tracking-[0.25em] uppercase">
          {hub.chapter}
        </span>
        <h2 className="text-5xl md:text-7xl font-display font-extrabold tracking-tighter mt-4 mb-6 uppercase">
          {hub.title}
        </h2>
        <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed font-serif italic text-lg">
          {hub.tagline}
        </p>
        <span className="inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase group-hover:text-accent transition-colors">
          View hub
          <span className="h-px w-8 bg-foreground group-hover:bg-accent group-hover:w-16 transition-all duration-500" />
        </span>
      </div>
    </Link>
  );
}
