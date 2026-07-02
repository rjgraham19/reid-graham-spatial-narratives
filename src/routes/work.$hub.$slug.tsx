import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { HUBS, PROJECTS, projectBySlug, type MediaItem, type Credit } from "@/lib/projects";

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
        { name: "description", content: p.description.slice(0, 160) },
        { property: "og:title", content: `${p.title} — Reid Graham` },
        { property: "og:description", content: p.description.slice(0, 160) },
        { property: "og:image", content: p.cover },
        { name: "twitter:image", content: p.cover },
      ],
    };
  },
  component: ProjectPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="text-foreground/60">This project isn't part of the portfolio.</p>
        <Link to="/" className="mt-6 inline-block pill">← Back to home</Link>
      </div>
    </div>
  ),
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const hub = HUBS.find((h) => h.slug === project.hub)!;

  const idxAll = PROJECTS.findIndex((p) => p.slug === project.slug);
  const next = PROJECTS[(idxAll + 1) % PROJECTS.length];

  const [lightbox, setLightbox] = useState<number | null>(null);
  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) => {
      setLightbox((cur) => {
        if (cur == null) return cur;
        const n = project.media.length;
        return (cur + delta + n) % n;
      });
    },
    [project.media.length],
  );

  useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, step]);

  return (
    <div className="relative">
      <SiteNav />

      {/* Header */}
      <header className="pt-32 md:pt-40 px-6 md:px-12 lg:px-16 pb-16 border-b border-border">
        <Link
          to="/work/$hub"
          params={{ hub: hub.slug }}
          className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/60 hover:text-foreground transition-colors mb-10"
        >
          <span className="h-px w-8 bg-current" />
          {hub.title}
        </Link>
        <h1 className="font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-5xl md:text-8xl text-balance max-w-5xl animate-reveal">
          {project.title}
        </h1>
        <p className="mt-6 text-sm md:text-base tracking-[0.15em] uppercase text-foreground/60">
          {project.subtitle}
        </p>
      </header>

      {/* Description + credits */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-border">
        <div className="md:col-span-8">
          <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
            {project.description}
          </p>
          {project.notes && project.notes.length > 0 && (
            <ul className="mt-10 space-y-3 text-foreground/70">
              {project.notes.map((n: string, i: number) => (
                <li key={i} className="flex gap-4">
                  <span className="text-foreground/40 text-xs mt-1.5">0{i + 1}</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {project.credits && project.credits.length > 0 && (
          <div className="md:col-span-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-5">Credits</p>
            <ul className="space-y-3">
              {project.credits.map((c: Credit) => (
                <li key={c.role} className="text-sm">
                  <span className="text-foreground/50">{c.role}</span>
                  <br />
                  <span className="text-foreground">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Media gallery */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50">
            Media · {project.media.length}
          </p>
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 hidden md:block">
            Click any image to enlarge
          </p>
        </div>

        <div className="space-y-6">
          {project.media.map((m: MediaItem, i: number) => (
            <figure key={i} className="group">
              <button
                type="button"
                onClick={() => setLightbox(i)}
                className="block w-full overflow-hidden rounded-md bg-secondary"
                aria-label={m.caption ?? `Media ${i + 1}`}
              >
                <img
                  src={m.src}
                  alt={m.caption ?? project.title}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                />
              </button>
              {m.caption && (
                <figcaption className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide">
                  {String(i + 1).padStart(2, "0")} — {m.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </section>

      {/* Next project */}
      <section className="border-t border-border px-6 md:px-12 lg:px-16 py-20">
        <Link
          to="/work/$hub/$slug"
          params={{ hub: next.hub, slug: next.slug }}
          className="group flex items-end justify-between gap-6 flex-wrap"
        >
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
              Next project
            </p>
            <h3 className="font-display font-black uppercase tracking-tight text-3xl md:text-5xl group-hover:text-accent transition-colors">
              {next.title}
            </h3>
          </div>
          <span className="pill pill-lg group-hover:pill-active">Continue →</span>
        </Link>
      </section>

      <SiteFooter />

      {/* Lightbox */}
      {lightbox != null && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-lg flex flex-col"
          onClick={close}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/60">
              {String(lightbox + 1).padStart(2, "0")} / {String(project.media.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              className="pill"
              aria-label="Close"
            >
              CLOSE ✕
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center px-6 md:px-12 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={project.media[lightbox].src}
              alt={project.media[lightbox].caption ?? project.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between px-6 pb-6 gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="pill"
            >
              ← PREV
            </button>
            {project.media[lightbox].caption && (
              <p className="text-xs md:text-sm text-foreground/70 text-center flex-1 px-4">
                {project.media[lightbox].caption}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="pill"
            >
              NEXT →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
