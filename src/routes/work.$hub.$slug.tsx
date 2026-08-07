import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useScrollScrubVideo } from "@/hooks/use-scroll-scrub-video";
import { AnimatedHeading, RevealBlock } from "@/components/animated-text";
import { ScrollFrameSequence } from "@/components/scroll-frame-sequence";

/**
 * TaB can spin frames. The export intentionally kept only every other frame
 * to halve the payload, so the numbering runs 0, 1, then odds up to 61 —
 * hence building the list explicitly rather than by a stride.
 */
const TAB_SPIN_FRAMES = [
  "/tab-spin/00000.webp",
  ...Array.from({ length: 31 }, (_, i) => {
    const n = i * 2 + 1; // 1, 3, 5 … 61
    return `/tab-spin/${String(n).padStart(5, "0")}.webp`;
  }),
];
import tabAnimation from "@/assets/rg/tab-animation.svg";
import tabBanner from "@/assets/rg/tab-banner.webp";
import { InlineAnimatedSvg } from "@/components/inline-animated-svg";
import { InViewVideo } from "@/components/in-view-video";
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
  const isTrueWest = project.slug === "true-west";
  const isAnneFrank = project.slug === "the-diary-of-anne-frank";
  const isReshuffling = project.slug === "reshuffling-the-deck";
  const isLollapalooza = project.slug === "lollapalooza";
  const isPortraitHero = project.heroPortrait === true;
  const isTitleAbove = project.heroTitleAbove === true;

  /* What the standard gallery should list. TaB gives its closeup video and
     both halves of the PINK FOUNTAIN drawing their own sections higher up the
     page, so only the opening contact sheet is left to show here. The original
     index travels with each item, since that's what the lightbox counts by. */
  const galleryMedia = project.media
    .map((item: MediaItem, index: number) => ({ item, index }))
    .filter(({ index }: { index: number }) => !(isTab && index !== 0));

  const recordScrubWrapperRef = useRef<HTMLDivElement>(null);
  const recordScrubVideoRef = useRef<HTMLVideoElement>(null);
  const [recordScrubProgress, setRecordScrubProgress] = useState(0);
  useScrollScrubVideo(recordScrubWrapperRef, recordScrubVideoRef, setRecordScrubProgress);

  const segmentOpacity = (p: number, start: number, end: number, fade = 0.06) => {
    if (p < start - fade || p > end + fade) return 0;
    if (p < start) return (p - (start - fade)) / fade;
    if (p > end) return 1 - (p - end) / fade;
    return 1;
  };

  return (
    <div className={`relative ${mood.wrap}${isLollapalooza ? " lolla-cursor" : ""}`}>
      <SiteNav />

      {/* Back — to /work for tagged projects, to hub for visualizations */}
      <div className="pt-28 md:pt-32 px-6 md:px-12 lg:px-16">
        {project.tags && project.tags.length > 0 ? (
          <Link
            to="/work"
            search={{ tag: project.tags[0] }}
            className={isLollapalooza ? "retro-btn" : "inline-flex items-center gap-3 pill pill-touch"}
          >
            <span aria-hidden>←</span>
            Back to Projects
          </Link>
        ) : (
          <Link
            to="/work/$hub"
            params={{ hub: hub.slug }}
            className={isLollapalooza ? "retro-btn" : "inline-flex items-center gap-3 pill pill-touch"}
          >
            <span aria-hidden>←</span>
            Back to {hub.title}
          </Link>
        )}
      </div>

      {/* Header + hero.
          Two arrangements, both keeping the same sticky behaviour:

          • Overlay (default) — title and image sit in one single-cell grid so
            they occupy the same space and the text reads over the photo. The
            title layer uses self-start so it spans only its own content plus
            the runway rather than the image's full height, which keeps the
            sticky release governed purely by the 300px runway. It's
            pointer-events-none so the transparent runway doesn't swallow
            clicks meant for the image; its links re-enable them.

          • Title-above (heroTitleAbove) — for compositions whose top carries
            subject matter that shouldn't be covered. The title stacks above
            and the image is pulled up by exactly the runway height so it
            begins right where the title ends, with no gap and no overlap. */}
      <div
        className={
          isPortraitHero
            ? "relative md:grid md:grid-cols-[8fr_5fr] md:gap-8 lg:gap-12 md:px-12 lg:px-16"
            : "relative"
        }
      >
      <div
        className={`${
          isTitleAbove ? "relative" : "relative grid grid-cols-1 grid-rows-1"
        } ${isReshuffling ? "md:col-start-1 md:row-start-1" : ""}`}
      >
        <div
          className={
            isTitleAbove
              ? "relative z-10"
              : "col-start-1 row-start-1 self-start z-10 pointer-events-none"
          }
        >
          <div
            /* Sticky offsets match the height of the fixed bar the title pins
               under — 76px on phones, 82px from md — so the title comes to rest
               against the bar rather than sliding a few pixels behind it. */
            className={`sticky top-[76px] md:top-20 pt-10 md:pt-14 bg-gradient-to-b from-black via-black/70 to-transparent ${
              isTitleAbove ? "pb-8 md:pb-10" : "pb-16 md:pb-24 pointer-events-none"
            } ${isPortraitHero ? "px-6 md:px-0" : "px-6 md:px-12 lg:px-16"}`}
          >
            {project.tags && project.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {project.tags.map((t: ProjectTag) => (
                  <Link
                    key={t}
                    to="/work"
                    search={{ tag: t }}
                    className="pointer-events-auto text-[10px] tracking-[0.3em] uppercase text-foreground/70 hover:text-accent transition-colors"
                  >
                    {t.replace("/", " ")}
                  </Link>
                ))}
              </div>
            )}

            <AnimatedHeading
              text={project.title}
              className="font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-[clamp(2rem,11vw,3rem)] md:text-[clamp(3rem,8.5vw,6rem)] text-balance max-w-5xl"
            />

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
          </div>

          {/* Fixed-height runway — controls exactly how long the title stays pinned. */}
          <div className="h-[300px]" />
        </div>

        <figure
          className={`z-0 ${
            isTitleAbove
              ? /* -300px cancels the runway exactly, so the image begins where
                   the title ends. TaB goes further and tucks the image up
                   behind the whole title block, which lifts everything below
                   it by the same amount — the point being that the closeup
                   animation starts near enough to the fold to signal there's
                   more page. Readable because of the blue scrim above. */
                isTab
                ? "relative -mt-[340px] md:-mt-[540px]"
                : "relative -mt-[300px]"
              : "col-start-1 row-start-1"
          } ${isPortraitHero ? "px-6 md:px-0" : "px-6 md:px-12 lg:px-16"} ${
            /* nudged down so the title clears more of the composition and the
               stacked views alongside sit within the page rather than above it */
            isReshuffling ? "mt-10 md:mt-24" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="block w-full h-auto overflow-hidden rounded-md bg-secondary group"
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

      </div>

      {/* Portrait heroes only: description sits beside the image, filling the
          space a tall hero leaves empty, rather than below it. Sticky so it
          stays in view alongside the image as it scrolls. */}
      {/* Reshuffling occupies all four cells of the two-column grid rather
          than a hero-plus-aside pair: hero and stacked views share row 1,
          credits and description share row 2. Putting both text blocks in
          the same grid row is what keeps them starting on the same line —
          they'd otherwise be sized by their own columns and drift apart.
          The views are self-end so the pair finishes level with the hero.
          DOM order is the mobile reading order; desktop placement is
          explicit, so the two are free to differ. */}
      {isReshuffling && (
        <>
          <div className="px-6 md:px-0 pt-8 md:pt-0 space-y-4 md:space-y-6 md:col-start-2 md:row-start-1 md:self-end">
            {[1, 2].map((idx) => (
              <figure key={idx} className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(idx)}
                  className="block w-full overflow-hidden rounded-md bg-secondary"
                  aria-label={project.media[idx].caption ?? `View ${idx}`}
                >
                  <img
                    src={project.media[idx].src}
                    alt={project.media[idx].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto object-cover animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
            ))}
          </div>

          <RevealBlock className="px-6 md:px-0 mt-6 md:mt-0 md:col-start-2 md:row-start-2">
            <p className="font-display font-light text-base md:text-lg leading-snug tracking-tight text-balance md:text-right">
              {project.description}
            </p>
          </RevealBlock>

          {project.credits && project.credits.length > 0 && (
            <ul className="px-6 md:px-0 mt-8 md:mt-0 space-y-3 md:col-start-1 md:row-start-2">
              {project.credits.map((c: Credit) => (
                <li key={c.role} className="text-sm">
                  <span className="text-foreground/50">{c.role}</span>
                  <br />
                  <span className="text-foreground">{c.name}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {isPortraitHero && !isReshuffling && (
        <aside className="px-6 md:px-0 pt-8 md:pt-14 pb-4 md:pb-0">
          <div className="md:sticky md:top-32">
            <p className="font-display font-light text-lg md:text-xl lg:text-2xl leading-snug tracking-tight text-balance">
              {project.description}
            </p>
            {project.credits && project.credits.length > 0 && (
              <ul className="mt-8 space-y-3">
                {project.credits.map((c: Credit) => (
                  <li key={c.role} className="text-sm">
                    <span className="text-foreground/50">{c.role}</span>
                    <br />
                    <span className="text-foreground">{c.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}
      </div>

      {/* TaB: Renaissance — closeup animation, directly under the hero.
          Presented as a moving image rather than an embedded video: no
          controls, no play badge, no poster affordance. It runs once when
          scrolled into view and then holds on its last frame, so for most of
          the time on screen it simply reads as a still. Clicking opens it in
          the lightbox like any other media on the page. */}
      {isTab && (
        <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10">
          <div className="md:grid md:grid-cols-[1fr_1fr] md:gap-8 lg:gap-12 md:items-center">
            <figure className="group">
              <button
                type="button"
                onClick={() => setLightbox(1)}
                className="block w-full overflow-hidden rounded-md bg-secondary md:max-w-[92%]"
                aria-label="Enlarge TaB closeup animation"
              >
                <InViewVideo
                  src="/tab-closeup-animation.mp4"
                  playOnce
                  className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                />
              </button>
            </figure>

            <div className="mt-8 md:mt-0">
              <RevealBlock>
                <p className="font-display font-light text-lg md:text-xl lg:text-2xl leading-snug tracking-tight text-balance">
                  {project.description}
                </p>
              </RevealBlock>
            </div>
          </div>
        </section>
      )}

      {/* TaB: Renaissance — full-bleed graphic marking the black-to-white transition.
          The graphic's own bottom portion is solid white; whatever comes after this
          section should start white too, so the seam is hidden behind the graphic
          rather than appearing as a visible hard cut. */}
      {isTab && (
        <div className="w-full bg-black">
          <InlineAnimatedSvg
            src={tabAnimation}
            className="block w-full [&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
          />
        </div>
      )}

      {/* Everything past the TaB transition graphic sits in a light region:
          that graphic's lower half is solid white, so the page is meant to
          stay white from there down. .light-zone redefines the theme tokens
          for this subtree, so the sections inside adapt without each needing
          its own light styling. A no-op on every other project. */}
      <div className={isTab ? "light-zone" : undefined}>

      {/* TaB: Renaissance — the PINK FOUNTAIN technical drawing, directly under
          the transition animation where the page turns white.

          It's one drawing split into two files so each half can be enlarged on
          its own, so the two must read as a single sheet rather than as two
          images that happen to sit together. Both halves were scaled by the
          same factor at export, so sizing the columns to their pixel widths
          (1584 and 2400) keeps every line weight and label at one consistent
          scale across the seam. They're top-aligned for the same reason.

          The gap is wider than the drawing's own internal spacing, per Reid —
          enough to read as two enlargeable pieces without breaking the sheet. */}
      {isTab && (
        <section className="px-6 md:px-12 lg:px-16 pt-10 md:pt-16 pb-8 md:pb-12">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1584fr_2400fr] md:gap-16 lg:gap-20 md:items-start">
            {[2, 3].map((idx) => (
              <figure key={idx} className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(idx)}
                  className="block w-full"
                  aria-label={`Enlarge ${project.media[idx].caption}`}
                >
                  <img
                    src={project.media[idx].src}
                    alt={project.media[idx].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto"
                  />
                </button>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Lollapalooza — record-player scroll-scrub video, full-bleed background with text overlaid on top */}
      {isLollapalooza && (
        <div ref={recordScrubWrapperRef} className="relative w-full h-[400vh] bg-black">
          {/* svh, not vh: on a phone the sticky frame must fit the space that's
              actually visible with the address bar showing, or its bottom is cut
              off. vh measures the tall viewport the bar is hidden in. */}
          <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
            <video
              ref={recordScrubVideoRef}
              src="/lollapalooza-recordplayer.mp4"
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Text overlaid on top of the video, right side.
                The width is set explicitly rather than left to max-w: every
                line inside is absolutely positioned, so there's nothing in flow
                to size this box — it collapsed to zero, and the `w-full` on each
                line collapsed with it, breaking every beat onto one word per
                line against the right edge. */}
            <div className="absolute right-6 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 z-10 w-[min(74vw,20rem)] md:w-[28rem] text-right">
              <p
                className="absolute right-0 top-0 w-full font-display font-light text-foreground text-2xl md:text-4xl leading-snug text-balance transition-opacity duration-200"
                style={{ opacity: segmentOpacity(recordScrubProgress, 0.05, 0.3) }}
              >
                Copy pending — first beat
              </p>
              <p
                className="absolute right-0 top-0 w-full font-display font-light text-foreground text-2xl md:text-4xl leading-snug text-balance transition-opacity duration-200"
                style={{ opacity: segmentOpacity(recordScrubProgress, 0.4, 0.65) }}
              >
                Copy pending — second beat
              </p>
              <p
                className="absolute right-0 top-0 w-full font-display font-light text-foreground text-2xl md:text-4xl leading-snug text-balance transition-opacity duration-200"
                style={{ opacity: segmentOpacity(recordScrubProgress, 0.75, 0.95) }}
              >
                Copy pending — closing beat
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description + credits — skipped on portrait-hero pages, where both
          already appear in the column beside the hero. */}
      {!isPortraitHero && (
      <section className="px-6 md:px-12 lg:px-16 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 border-b border-border">
        <div className="md:col-span-8">
          {/* Skipped on TaB, where the description already appears alongside
              the closeup animation higher up the page. */}
          {!isYctiwy && !isTab && !isAnneFrank && (
            <RevealBlock>
              <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
                {project.description}
              </p>
            </RevealBlock>
          )}
        </div>
        {project.credits && project.credits.length > 0 && (
          <RevealBlock className="md:col-span-4" delay={0.1}>
            <ul className="space-y-3">
              {project.credits.map((c: Credit) => (
                <li key={c.role} className="text-sm">
                  <span className="text-foreground/50">{c.role}</span>
                  <br />
                  <span className="text-foreground">{c.name}</span>
                </li>
              ))}
            </ul>
          </RevealBlock>
        )}
      </section>
      )}

      {/* Pull quote */}
      {project.pullQuote && (
        <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10 border-b border-border">
          <RevealBlock>
            <blockquote className="font-display font-light text-2xl md:text-4xl leading-snug text-balance max-w-4xl">
              {project.pullQuote}
            </blockquote>
          </RevealBlock>
        </section>
      )}

      {/* Special: True West — dual-world comparison + plan diagrams */}
      {isTrueWest && (
        <>
          <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10 border-b border-border">
            <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-3 md:gap-4">
              <figure className="group h-full animate-slide-from-left">
                <button
                  type="button"
                  onClick={() => setLightbox(1)}
                  className="block h-full w-full overflow-hidden rounded-md bg-secondary"
                  aria-label={project.media[1].caption ?? "True West — second act"}
                >
                  <img
                    src={project.media[1].src}
                    alt={project.media[1].caption ?? project.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>

              <div className="flex flex-col">
                <figure className="group animate-slide-from-right">
                  <button
                    type="button"
                    onClick={() => setLightbox(2)}
                    className="block w-full overflow-hidden bg-secondary"
                    aria-label={project.media[2].caption ?? "Rendered model study"}
                  >
                    <img
                      src={project.media[2].src}
                      alt={project.media[2].caption ?? project.title}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                    />
                  </button>
                </figure>
                <figure className="group animate-slide-from-right" style={{ animationDelay: "0.15s" }}>
                  <button
                    type="button"
                    onClick={() => setLightbox(3)}
                    className="block w-full overflow-hidden bg-secondary"
                    aria-label={project.media[3].caption ?? "Rendered model study"}
                  >
                    <img
                      src={project.media[3].src}
                      alt={project.media[3].caption ?? project.title}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                    />
                  </button>
                </figure>
              </div>
            </div>

            {project.dualityLines && (
              <div className="mt-8 md:mt-10 max-w-3xl space-y-3">
                <p className="font-serif italic text-lg md:text-xl leading-relaxed text-foreground/90">
                  {project.dualityLines[0]}
                </p>
                <p className="font-serif italic text-lg md:text-xl leading-relaxed text-foreground/90">
                  {project.dualityLines[1]}
                </p>
              </div>
            )}
          </section>

          <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10 border-b border-border">
            <figure className="group">
              <button
                type="button"
                onClick={() => setLightbox(4)}
                className="block w-full overflow-hidden rounded-md bg-secondary"
                aria-label={project.media[4].caption ?? "Plan comparison diagram"}
              >
                <img
                  src={project.media[4].src}
                  alt={project.media[4].caption ?? project.title}
                  loading="lazy"
                  className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                />
              </button>
            </figure>
          </section>
        </>
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
      {/* Skipped where every media item already appears in a bespoke layout
          above, which would otherwise repeat the whole set. */}
      {!isTrueWest && !isReshuffling && (
      <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10">
        {isAnneFrank ? (
          /* Anne Frank layout, per the supplied reference:
             upper band — conceptual sketch left (sitting higher), kitchen
             closeup right (dropped lower), with the description tucked under
             the sketch and to the left of the photo. Lower band — the two
             technical drawings side by side, each independently clickable but
             sharing a row so they read as a matched pair. */
          <div className="space-y-10 md:space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 lg:gap-14 md:items-start">
              {/* Left: sketch, then the description beneath it */}
              <div className="md:pt-4">
                <figure className="group">
                  <button
                    type="button"
                    onClick={() => setLightbox(1)}
                    className="block w-full overflow-hidden rounded-md"
                    aria-label={project.media[1].caption ?? "Conceptual sketch"}
                  >
                    <img
                      src={project.media[1].src}
                      alt={project.media[1].caption ?? project.title}
                      loading="lazy"
                      className="w-full h-auto object-contain animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                    />
                  </button>
                </figure>

                <RevealBlock>
                  <p className="mt-6 md:mt-8 font-display font-light text-base md:text-lg leading-relaxed text-balance text-foreground/85 md:max-w-sm md:ml-auto md:text-right">
                    {project.description}
                  </p>
                </RevealBlock>
              </div>

              {/* Right: kitchen closeup, dropped lower than the sketch */}
              <figure className="group md:mt-24 lg:mt-32">
                <button
                  type="button"
                  onClick={() => setLightbox(2)}
                  className="block w-full overflow-hidden rounded-md bg-secondary"
                  aria-label={project.media[2].caption ?? "Set closeup"}
                >
                  <img
                    src={project.media[2].src}
                    alt={project.media[2].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto object-cover animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
            </div>

            {/* Technical drawings — separate images so each opens on its own,
                but placed in one row with tops aligned so they read parallel.
                Their source ratios differ slightly (1.97 vs 2.09), so heights
                won't match exactly; alignment is to the top edge. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 md:items-start">
              {[3, 4].map((idx) => (
                <figure key={idx} className="group">
                  <button
                    type="button"
                    onClick={() => setLightbox(idx)}
                    className="block w-full overflow-hidden rounded-md"
                    aria-label={project.media[idx].caption ?? `Technical drawing ${idx - 2}`}
                  >
                    <img
                      src={project.media[idx].src}
                      alt={project.media[idx].caption ?? project.title}
                      loading="lazy"
                      className="w-full h-auto object-contain animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                    />
                  </button>
                </figure>
              ))}
            </div>
          </div>
        ) : isYctiwy ? (
          // Custom YCTIWU layout: closeup (left) + sketch (top-right, on dark) + drawing (bottom-right)
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
            <div className="flex flex-col gap-3 md:gap-4">
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
          <div className="space-y-3 md:space-y-4">
            {galleryMedia.map(({ item: m, index: i }) => (
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
      )}


      {/* TaB: Renaissance — closing beat. A rendered frame sequence of the can,
          scrubbed by scroll so it spins forward on the way down and backward on
          the way up. Last content section on the page. */}
      {isTab && (
        <section className="bg-background">
          <ScrollFrameSequence
            frames={TAB_SPIN_FRAMES}
            alt="TaB soda can rotating"
            className="relative h-[300vh]"
            backdrop={
              /* Event banner as a full-bleed strip behind the can. It's inside
                 the sticky frame, so it holds still while the can turns over
                 it. Edge to edge and vertically centred, which leaves the
                 can — taller than the strip — overhanging above and below,
                 and keeps it clear of the logo on the strip's left third. */
              <img
                src={tabBanner}
                alt=""
                aria-hidden
                className="pointer-events-none absolute left-0 right-0 top-1/2 w-full -translate-y-1/2 select-none"
              />
            }
          />
        </section>
      )}

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

      </div>{/* end light-zone */}

      {/* Lightbox — deliberately outside the light region so it stays dark. */}
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
              className="pill pill-touch"
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
            {project.media[lightbox].type === "video" ? (
              /* Enlarged video: autoplays, loops, no controls — it reads as a
                 moving image rather than a video player, same as inline. */
              <video
                key={project.media[lightbox].src}
                src={project.media[lightbox].src}
                autoPlay
                loop
                muted
                playsInline
                onClick={close}
                style={{ transform: `scale(${zoom})`, transition: pinchStart.current ? "none" : "transform 120ms ease-out" }}
                className="max-h-full max-w-full object-contain cursor-zoom-out select-none"
              />
            ) : (
              <img
                src={project.media[lightbox].src}
                alt={project.media[lightbox].caption ?? project.title}
                onClick={close}
                style={{ transform: `scale(${zoom})`, transition: pinchStart.current ? "none" : "transform 120ms ease-out" }}
                className="max-h-full max-w-full object-contain cursor-zoom-out select-none"
                draggable={false}
              />
            )}

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
