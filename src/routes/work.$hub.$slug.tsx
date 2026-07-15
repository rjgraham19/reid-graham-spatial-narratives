import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
  noir: {
    wrap: "bg-black text-foreground",
    enter: "animate-fade-from-black",
  },
  warm: {
    wrap: "bg-[hsl(28_25%_8%)] text-foreground",
    enter: "animate-reveal",
  },
  desert: {
    wrap: "bg-[hsl(30_10%_10%)] text-foreground",
    enter: "animate-reveal",
  },
  cinema: {
    wrap: "bg-[hsl(200_25%_6%)] text-foreground",
    enter: "animate-reveal",
  },
  pop: {
    wrap: "bg-[hsl(320_35%_10%)] text-foreground",
    enter: "animate-pop-in",
  },
  concrete: {
    wrap: "bg-[hsl(0_0%_7%)] text-foreground",
    enter: "animate-reveal",
  },
  aqua: {
    wrap: "bg-[hsl(195_35%_8%)] text-foreground",
    enter: "animate-reveal",
  },
  theatrical: {
    wrap: "bg-[hsl(280_20%_7%)] text-foreground",
    enter: "animate-fade-from-black",
  },
};

function ProjectPage() {
  const { project } = Route.useLoaderData();
  const hub = HUBS.find((h) => h.slug === project.hub)!;
  const mood = MOOD_STYLES[(project.mood ?? "concrete") as Mood];
  const weight = project.weight ?? "right";

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

  const isStaging = project.slug === "staging-aesthetics";
  const isTab = project.slug === "tab-renaissance";

  return (
    <div className={`relative ${mood.wrap}`}>
      <SiteNav />

      {/* Back-to-hub — intentional way back, not browser back */}
      <div className="pt-28 md:pt-32 px-6 md:px-12 lg:px-16">
        <Link
          to="/work/$hub"
          params={{ hub: hub.slug }}
          className="inline-flex items-center gap-3 pill"
        >
          <span aria-hidden>←</span>
          Back to {hub.title}
        </Link>
      </div>

      {/* Header + hero */}
      <header
        className={`px-6 md:px-12 lg:px-16 pt-10 md:pt-14 pb-12 md:pb-16 border-b border-border ${mood.enter}`}
      >
        <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
          {project.subtitle}
        </p>
        <h1
          className={`font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-5xl md:text-8xl text-balance max-w-5xl ${
            weight === "left" ? "animate-slide-from-left" : "animate-slide-from-right"
          }`}
        >
          {project.title}
        </h1>
        {project.notes && project.notes.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {project.notes.map((n: string, i: number) => (
              <li key={i} className="pill">{n}</li>
            ))}
          </ul>
        )}
      </header>

      {/* Hero photo */}
      <figure className={`px-6 md:px-12 lg:px-16 pt-10 md:pt-14 ${mood.enter}`}>
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className="block w-full overflow-hidden rounded-md bg-secondary group"
          aria-label={`Enlarge ${project.title}`}
        >
          <img
            src={project.cover}
            alt={project.title}
            className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-1000 ease-cinematic"
          />
        </button>
      </figure>

      {/* Description + credits */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-border">
        <div className="md:col-span-8">
          <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
            {project.description}
          </p>
        </div>
        {project.credits && project.credits.length > 0 && (
          <div className="md:col-span-4">
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-5">
              Credits
            </p>
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
          <blockquote className="font-serif italic text-2xl md:text-4xl leading-snug text-balance max-w-4xl">
            “{project.pullQuote}”
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
      </section>

      {/* Back to hub + next in this hub */}
      <section className="border-t border-border px-6 md:px-12 lg:px-16 py-20 grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <Link
          to="/work/$hub/$slug"
          params={{ hub: next.hub, slug: next.slug }}
          className="group block md:text-right"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
            Next in {hub.title}
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
