import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { HUBS, PROJECTS, projectBySlug } from "@/lib/projects";

export const Route = createFileRoute("/work/$hub/$slug")({
  loader: ({ params }) => {
    const project = projectBySlug(params.slug);
    if (!project || project.hub !== params.hub) throw notFound();
    return { project };
  },
  head: ({ params }) => {
    const p = projectBySlug(params.slug);
    if (!p) return { meta: [{ title: "Project — Reid Graham" }] };
    return {
      meta: [
        { title: `${p.title} — Reid Graham` },
        { name: "description", content: p.logline },
        { property: "og:title", content: `${p.title} — Reid Graham` },
        { property: "og:description", content: p.logline },
        { property: "og:image", content: p.cover },
        { name: "twitter:image", content: p.cover },
      ],
    };
  },
  component: ProjectPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-serif italic text-muted-foreground">This project isn't part of the exhibition.</p>
        <Link
          to="/work"
          className="mt-6 inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase hover:text-accent transition-colors"
        >
          Back to work <span className="h-px w-8 bg-current" />
        </Link>
      </div>
    </div>
  ),
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const hub = HUBS.find((h) => h.slug === project.hub)!;

  // Find next project (any hub) for the "next room" link
  const idx = PROJECTS.findIndex((p) => p.slug === project.slug);
  const next = PROJECTS[(idx + 1) % PROJECTS.length];

  // Bespoke palette applied per-project via CSS vars
  const style = {
    ["--proj-bg" as string]: project.palette.background,
    ["--proj-ink" as string]: project.palette.ink,
    ["--proj-accent" as string]: project.palette.accent,
  };

  return (
    <div
      style={style}
      className="relative"
    >
      <div
        style={{
          backgroundColor: "var(--proj-bg)",
          color: "var(--proj-ink)",
        }}
      >
        <SiteNav />

        {/* Cinematic full-bleed opening */}
        <section className="relative h-screen min-h-[720px] w-full overflow-hidden">
          <img
            src={project.cover}
            alt={project.title}
            className="absolute inset-0 w-full h-full object-cover animate-slow-zoom"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--proj-bg) 0%, transparent 40%, var(--proj-bg) 100%)",
              opacity: 0.85,
            }}
          />
          <div className="relative h-full flex flex-col justify-end px-6 md:px-10 pb-16 md:pb-24">
            <Link
              to="/work/$hub"
              params={{ hub: hub.slug }}
              className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase mb-8 opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: "var(--proj-ink)" }}
            >
              <span className="h-px w-8" style={{ backgroundColor: "var(--proj-ink)" }} />
              {hub.title}
            </Link>
            <p
              className="font-display font-bold text-xs tracking-[0.3em] uppercase mb-6"
              style={{ color: "var(--proj-accent)" }}
            >
              Room {project.chapter} · {project.year}
            </p>
            <h1 className="font-serif italic text-6xl md:text-9xl leading-[0.9] text-balance max-w-5xl animate-reveal">
              {project.title}
            </h1>
          </div>
        </section>

        {/* Logline — oversized quote */}
        <section className="px-6 md:px-10 py-32 md:py-48 border-t" style={{ borderColor: "color-mix(in oklab, var(--proj-ink) 15%, transparent)" }}>
          <div className="max-w-5xl">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-8"
              style={{ color: "var(--proj-accent)" }}
            >
              The premise
            </p>
            <p className="font-serif italic text-3xl md:text-6xl leading-tight text-balance">
              "{project.logline}"
            </p>
          </div>
        </section>

        {/* Meta grid */}
        <section
          className="px-6 md:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10 border-t"
          style={{ borderColor: "color-mix(in oklab, var(--proj-ink) 15%, transparent)" }}
        >
          {[
            { label: "Year", value: project.year },
            { label: "Location", value: project.location },
            { label: "Role", value: project.role },
            { label: "Client", value: project.client ?? "Self-initiated" },
          ].map((m) => (
            <div key={m.label}>
              <p
                className="text-[10px] tracking-[0.3em] uppercase mb-3"
                style={{ color: "color-mix(in oklab, var(--proj-ink) 55%, transparent)" }}
              >
                {m.label}
              </p>
              <p className="font-serif italic text-lg md:text-xl">{m.value}</p>
            </div>
          ))}
        </section>

        {/* Narrative — each paragraph on its own beat */}
        <section
          className="px-6 md:px-10 py-32 space-y-24 border-t"
          style={{ borderColor: "color-mix(in oklab, var(--proj-ink) 15%, transparent)" }}
        >
          <div className="max-w-4xl">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-16"
              style={{ color: "var(--proj-accent)" }}
            >
              The narrative
            </p>
            <div className="space-y-16">
              {project.narrative.map((para: string, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-6">
                  <span
                    className="col-span-1 font-display text-xs tracking-[0.2em] pt-2"
                    style={{ color: "color-mix(in oklab, var(--proj-ink) 45%, transparent)" }}
                  >
                    0{i + 1}
                  </span>
                  <p className="col-span-11 md:col-span-10 font-serif text-xl md:text-3xl leading-relaxed text-balance">
                    {para}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Second image beat */}
        <section className="px-6 md:px-10">
          <div className="w-full aspect-[21/9] overflow-hidden">
            <img
              src={project.cover}
              alt=""
              aria-hidden
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.85) contrast(1.1)" }}
            />
          </div>
        </section>

        {/* Themes */}
        <section
          className="px-6 md:px-10 py-32 border-t mt-24"
          style={{ borderColor: "color-mix(in oklab, var(--proj-ink) 15%, transparent)" }}
        >
          <p
            className="text-xs tracking-[0.3em] uppercase mb-12"
            style={{ color: "var(--proj-accent)" }}
          >
            Themes running through the room
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
            {project.themes.map((t: string, i: number) => (
              <li key={t} className="border-t pt-6" style={{ borderColor: "color-mix(in oklab, var(--proj-ink) 25%, transparent)" }}>
                <span
                  className="text-[10px] tracking-[0.3em] uppercase mb-3 block"
                  style={{ color: "color-mix(in oklab, var(--proj-ink) 55%, transparent)" }}
                >
                  0{i + 1}
                </span>
                <p className="font-serif italic text-2xl md:text-3xl leading-tight">
                  {t}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Next room */}
        <section
          className="px-6 md:px-10 py-24 border-t"
          style={{ borderColor: "color-mix(in oklab, var(--proj-ink) 15%, transparent)" }}
        >
          <Link
            to="/work/$hub/$slug"
            params={{ hub: next.hub, slug: next.slug }}
            className="group flex items-end justify-between gap-6 flex-wrap"
          >
            <div>
              <p
                className="text-[10px] tracking-[0.3em] uppercase mb-4"
                style={{ color: "color-mix(in oklab, var(--proj-ink) 55%, transparent)" }}
              >
                Next room
              </p>
              <h3 className="font-serif italic text-4xl md:text-6xl leading-none group-hover:opacity-70 transition-opacity">
                {next.title}
              </h3>
            </div>
            <span
              className="text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-4"
              style={{ color: "var(--proj-accent)" }}
            >
              Continue
              <span
                className="h-px w-8 group-hover:w-24 transition-all duration-500"
                style={{ backgroundColor: "var(--proj-accent)" }}
              />
            </span>
          </Link>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
