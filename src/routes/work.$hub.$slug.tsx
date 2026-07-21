import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  HUBS,
  PROJECTS,
  projectBySlug,
  type MediaItem,
  type Credit,
  type Mood,
  type PhilosophyCard,
  type ProjectTag,
} from "@/lib/projects";

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

// Palette + entrance tone per mood.
const MOOD_STYLES: Record<Mood, { wrap: string; enter: string }> = {
  noir: { wrap: "bg-black text-foreground", enter: "animate-fade-from-black" },
  warm: { wrap: "bg-black text-foreground", enter: "animate-reveal" },
  desert: { wrap: "bg-black text-foreground", enter: "animate-reveal" },
  cinema: { wrap: "bg-black text-foreground", enter: "animate-reveal" },
  pop: { wrap: "bg-black text-foreground", enter: "animate-pop-in" },
  concrete: { wrap: "bg-black text-foreground", enter: "animate-reveal" },
  aqua: { wrap: "bg-black text-foreground", enter: "animate-reveal" },
  theatrical: { wrap: "bg-black text-foreground", enter: "animate-fade-from-black" },
};


function ProjectPage() {
  const { project } = Route.useLoaderData();
  const hub = HUBS.find((h) => h.slug === project.hub)!;
  const mood = MOOD_STYLES[(project.mood ?? "concrete") as Mood];

  const idxInHub = PROJECTS.filter((p) => p.hub === project.hub).findIndex(
    (p) => p.slug === project.slug,
  );
  const hubProjects = PROJECTS.filter((p) => p.hub === project.hub);
  const next = hubProjects[(idxInHub + 1) % hubProjects.length];

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

  const [zoom, setZoom] = useState(1);
  useEffect(() => setZoom(1), [lightbox]);

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

  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const onWheelZoom = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(1, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1))));
  }, []);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = { dist: Math.hypot(dx, dy), zoom };
    }
  }, [zoom]);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStart.current.dist;
      setZoom(Math.min(5, Math.max(1, pinchStart.current.zoom * ratio)));
    }
  }, []);
  const onTouchEnd = useCallback(() => {
    pinchStart.current = null;
  }, []);

  const isStaging = project.slug === "staging-aesthetics";
  const isTab = project.slug === "tab-renaissance";
  const isYctiwy = project.slug === "you-cant-take-it-with-you";

  return (
    <div className={`relative ${mood.wrap}`}>
      <SiteNav />

      {/* Back — to /work for tagged projects, to hub for visualizations */}
      <div className="pt-28 md:pt-32 px-6 md:px-12 lg:px-16">
        {project.tags && project.tags.length > 0 ? (
          <Link
            to="/work"
            search={{ tag: project.tags[0] }}
            className="inline-flex items-center gap-3 pill"
          >
            <span aria-hidden>←</span>
            Back to Projects
          </Link>
        ) : (
          <Link
            to="/work/$hub"
            params={{ hub: hub.slug }}
            className="inline-flex items-center gap-3 pill"
          >
            <span aria-hidden>←</span>
            Back to {hub.title}
          </Link>
        )}
      </div>

      {/* Header + hero */}
      <header
        className="px-6 md:px-12 lg:px-16 pt-10 md:pt-14 pb-12 md:pb-16 border-b border-border"
      >
        {/* Tag pills — clickable, link back to filtered feed */}
        {project.tags && project.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {project.tags.map((t: ProjectTag) => (
              <Link
                key={t}
                to="/work"
                search={{ tag: t }}
                className="text-[10px] tracking-[0.3em] uppercase text-foreground/70 hover:text-accent transition-colors"
              >
                {t.replace("/", " ")}
              </Link>
            ))}
          </div>
        )}

        <h1
          className="font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-5xl md:text-8xl text-balance max-w-5xl"
        >
          {project.title}
        </h1>

        <p className="mt-4 text-[10px] tracking-[0.3em] uppercase text-foreground/50">
          {project.subtitle}
        </p>

        {project.notes && project.notes.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.notes.map((n: string, i: number) => (
              <li key={i} className="pill">{n}</li>
            ))}
          </ul>
        )}
      </header>



      {/* Hero photo */}
      <figure className="px-6 md:px-12 lg:px-16 pt-10 md:pt-14">
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className="block w-full overflow-hidden rounded-md bg-secondary group"
          aria-label={`Enlarge ${project.title}`}
        >
          <img
            src={project.cover}
            alt={project.title}
            className={`w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-1000 ease-cinematic ${
              isYctiwy ? "animate-image-drift-up" : mood.enter
            }`}
          />
        </button>
      </figure>

      {/* Description + credits */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-border">
        <div className="md:col-span-8">
          {!isYctiwy && (
            <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
              {project.description}
            </p>
          )}
        </div>
        {project.credits && project.credits.length > 0 && (
          <div className="md:col-span-4">
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

      {/* Pull quote */}
      {project.pullQuote && (
        <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-b border-border">
          <blockquote className="font-display font-light text-2xl md:text-4xl leading-snug text-balance max-w-4xl">
            {project.pullQuote}
          </blockquote>
        </section>
      )}


      {/* Special: TaB cellphone fade-up-from-white beat */}
      {isTab && (
        <section className="relative px-6 md:px-12 lg:px-16 py-24 md:py-32 border-b border-border bg-white text-black overflow-hidden">
          <div className="max-w-3xl mx-auto text-center animate-cellphone-rise">
            <div className="mx-auto w-40 h-72 md:w-56 md:h-96 rounded-[2.5rem] border-4 border-black bg-[hsl(320_60%_88%)] shadow-2xl relative overflow-hidden">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-black/70 rounded-full" />
              <div className="absolute inset-6 flex flex-col items-center justify-center text-center">
                <p className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl">TaB</p>
                <p className="mt-2 font-serif italic text-sm md:text-base">Renaissance</p>
                <p className="mt-6 text-[10px] tracking-[0.3em] uppercase">The Garden of<br/>Earthly Delights</p>
              </div>
            </div>
            <p className="mt-8 text-xs tracking-[0.3em] uppercase text-black/60">
              Pop-up experiential marketing moment
            </p>
          </div>
        </section>
      )}

      {/* Special: Staging Aesthetics — native video + philosophy cards + tilted layout */}
      {isStaging && (
        <>
          {project.video && (
            <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-b border-border">
              <video
                src={project.video.src}
                poster={project.video.poster}
                controls
                playsInline
                className="w-full rounded-md bg-black"
              />
              {project.video.caption && (
                <p className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide">
                  {project.video.caption}
                </p>
              )}
            </section>
          )}

          {project.philosophyCards && (
            <section className="px-6 md:px-12 lg:px-16 py-20 md:py-28 border-b border-border">
              <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
                Time / Space
              </p>
              <h2 className="font-display font-black uppercase tracking-tight text-3xl md:text-5xl mb-12">
                Five projected aesthetics
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {project.philosophyCards.map((c: PhilosophyCard, i: number) => (
                  <li
                    key={c.title}
                    className="relative rounded-md border border-border bg-background/40 p-6 md:p-7 animate-twitch"
                    style={{
                      transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (1 + (i % 3) * 0.4)}deg)`,
                      animationDelay: `${i * 0.6}s`,
                    }}
                  >
                    <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-3">
                      0{i + 1}
                    </p>
                    <h3 className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl mb-4">
                      {c.title}
                    </h3>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-1">
                      Time
                    </p>
                    <p className="text-sm text-foreground/80 mb-4">{c.time}</p>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-1">
                      Space
                    </p>
                    <p className="text-sm text-foreground/80">{c.space}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

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

        {isYctiwy ? (
          // Custom YCTIWU layout: closeup (left) + sketch (top-right, on dark) + drawing (bottom-right)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Closeup, left column */}
            <figure className="group">
              <button
                type="button"
                onClick={() => setLightbox(1)}
                className="block w-full overflow-hidden rounded-md bg-secondary"
                aria-label={project.media[1].caption ?? "Closeup"}
              >
                <img
                  src={project.media[1].src}
                  alt={project.media[1].caption ?? project.title}
                  loading="lazy"
                  className="w-full h-auto object-cover animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                />
              </button>
              <figcaption className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide leading-relaxed">
                {project.media[1].caption}
              </figcaption>
            </figure>

            {/* Sketch + drawing stacked, right column */}
            <div className="flex flex-col gap-6">
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(2)}
                  className="block w-full overflow-hidden rounded-md bg-black p-6 md:p-8"
                  aria-label={project.media[2].caption ?? "Sketch"}
                >
                  <img
                    src={project.media[2].src}
                    alt={project.media[2].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto object-contain animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(3)}
                  className="block w-full overflow-hidden rounded-md bg-black p-6 md:p-8"
                  aria-label={project.media[3].caption ?? "Drawing"}
                >
                  <img
                    src={project.media[3].src}
                    alt={project.media[3].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto object-contain animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {project.media.map((m: MediaItem, i: number) => (
              <figure
                key={i}
                className={`group ${
                  isStaging
                    ? `transform ${i % 2 === 0 ? "-rotate-1" : "rotate-1"} animate-twitch`
                    : ""
                }`}
                style={isStaging ? { animationDelay: `${i * 0.9}s` } : undefined}
              >
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
        )}
      </section>


      {/* Back to feed + next */}
      <section className="border-t border-border px-6 md:px-12 lg:px-16 py-20 grid grid-cols-1 md:grid-cols-2 gap-8">
        {project.tags && project.tags.length > 0 ? (
          <Link
            to="/work"
            search={{ tag: project.tags[0] }}
            className="group block"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
              Return to
            </p>
            <h3 className="font-display font-black uppercase tracking-tight text-2xl md:text-4xl group-hover:text-accent transition-colors">
              ← All Projects
            </h3>
          </Link>
        ) : (
          <Link
            to="/work/$hub"
            params={{ hub: hub.slug }}
            className="group block"
          >
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
              Return to
            </p>
            <h3 className="font-display font-black uppercase tracking-tight text-2xl md:text-4xl group-hover:text-accent transition-colors">
              ← {hub.title}
            </h3>
          </Link>
        )}
        <Link
          to="/work/$hub/$slug"
          params={{ hub: next.hub, slug: next.slug }}
          className="group block md:text-right"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
            Next
          </p>
          <h3 className="font-display font-black uppercase tracking-tight text-2xl md:text-4xl group-hover:text-accent transition-colors">
            {next.title} →
          </h3>
        </Link>
      </section>


      <SiteFooter />

      {/* Lightbox */}
      {lightbox != null && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-2xl flex flex-col cursor-zoom-out"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-6 py-5">
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/70">
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
            className="flex-1 relative flex items-center justify-center px-6 md:px-16 pb-6 group/lb overflow-hidden"
            onWheel={onWheelZoom}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={project.media[lightbox].src}
              alt={project.media[lightbox].caption ?? project.title}
              onClick={close}
              style={{ transform: `scale(${zoom})`, transition: pinchStart.current ? "none" : "transform 120ms ease-out" }}
              className="max-h-full max-w-full object-contain cursor-zoom-out select-none"
              draggable={false}
            />

            {/* Chevron arrows over image */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous"
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-foreground text-2xl font-light flex items-center justify-center opacity-0 group-hover/lb:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100 hover:bg-black/80 hover:text-accent transition-opacity"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next"
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-foreground text-2xl font-light flex items-center justify-center opacity-0 group-hover/lb:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100 hover:bg-black/80 hover:text-accent transition-opacity"
            >
              ›
            </button>
          </div>

          {project.media[lightbox].caption && (
            <p
              className="text-xs md:text-sm text-foreground/80 text-center px-6 pb-6"
              onClick={(e) => e.stopPropagation()}
            >
              {project.media[lightbox].caption}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
