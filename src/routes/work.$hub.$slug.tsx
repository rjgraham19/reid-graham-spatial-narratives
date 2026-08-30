import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useScrollScrubVideo } from "@/hooks/use-scroll-scrub-video";
import { AnimatedHeading, RevealBlock } from "@/components/animated-text";
import { BackChevron, CloseMark, glassButton, trackSheen } from "@/components/glass-button";
import { LightboxVideo } from "@/components/lightbox-video";
import { SwipeGallery } from "@/components/swipe-gallery";
import { FramerCarousel } from "@/components/ui/framer-carousel";

import tabAnimation from "@/assets/rg/tab-animation.svg";
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
import {
  applyOverrides,
  applyMediaAdditions,
  applyMediaOrder,
  designModeStyleTag,
  mergeOverridesFiles,
  mergeMediaAdditions,
  mergeMediaOrder,
} from "@/lib/apply-overrides";
import designOverrides from "@/lib/design-overrides.json";
import designMediaAdditions from "@/lib/design-media-additions.json";
import designMediaOrder from "@/lib/design-media-order.json";
import type { DesignOverridesFile } from "@/lib/design-overrides.types";
import type { MediaAdditionsFile, MediaOrderFile } from "@/lib/media-additions.types";
import { designId } from "@/lib/design-ids";
import { useLiveOverrides } from "@/lib/use-live-overrides";
import { DesignFrameBridge } from "@/design-mode/frame-bridge";

/**
 * Show the caption under an enlarged image in the lightbox.
 *
 * Off for now — the per-image caption copy still needs a pass and the site is
 * going public before there's time for it. The caption markup below is left
 * intact (and Design Mode still targets it), so flipping this back to `true`
 * brings the captions back with no other change.
 */
const SHOW_LIGHTBOX_CAPTIONS = false as boolean;

export const Route = createFileRoute("/work/$hub/$slug")({
  /* panel=1 is set only when this page is rendered inset over the feed, which
     only happens on a wide screen. It suppresses the site nav: the wordmark
     and top-level links belong to the page showing behind the panel, and
     repeating them there reads as the site nested inside itself. Absent — a
     direct visit, and every visit on a phone — nothing changes. */
  validateSearch: (search: Record<string, unknown>): { panel?: boolean } =>
    search.panel === "1" || search.panel === true ? { panel: true } : {},
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


function CreditRow({ slug, credit }: { slug: string; credit: Credit }) {
  return (
    <li
      className="text-sm"
      data-design-id={designId.projectCredit(slug, credit.role)}
      data-design-kind="text"
    >
      <span className="text-foreground/50">{credit.role}</span>
      <br />
      <span className="text-foreground">{credit.name}</span>
    </li>
  );
}

function ProjectPage() {
  const { project: rawProject } = Route.useLoaderData();
  const { live, liveMedia, liveMediaOrder, onLocalPatch, onLocalReset, onSyncAll } = useLiveOverrides();
  const overridesFile = mergeOverridesFiles(designOverrides as DesignOverridesFile, live);
  const mediaAdditionsFile = mergeMediaAdditions(designMediaAdditions as MediaAdditionsFile, liveMedia);
  const mediaOrderFile = mergeMediaOrder(designMediaOrder as MediaOrderFile, liveMediaOrder);
  const project = applyMediaAdditions(applyOverrides(rawProject, overridesFile), mediaAdditionsFile, overridesFile);
  const responsiveCss = designModeStyleTag(overridesFile);
  const { panel } = Route.useSearch();
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
  const isFieldHouse = project.slug === "field-house";
  const isTownhouse = project.slug === "townhouse";
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
  // The generic two-column gallery grid's own display order can additionally
  // be overridden by a Design Mode Reorder drag (`applyMediaOrder`) — the
  // several bespoke per-project layouts below address `project.media` by
  // fixed index and never read this, so they're unaffected.
  const galleryMedia = applyMediaOrder(
    project.media
      .map((item: MediaItem, index: number) => ({ item, index }))
      .filter(
        ({ item, index }: { item: MediaItem; index: number }) =>
          !(isTab && index !== 0) &&
          !(isLollapalooza && (item.id?.startsWith("gallery-") || item.id?.startsWith("drafting-"))) &&
          !item.hidden,
      ),
    mediaOrderFile[project.slug],
  );

  /* The closing hover-row gallery's own slice of `project.media` — same
     array, same lightbox, just excluded from the standard grid above and
     given the wider hover-to-expand treatment instead. */
  const lollapaloozaGalleryMedia = isLollapalooza
    ? project.media
        .map((item: MediaItem, index: number) => ({ item, index }))
        .filter(({ item }: { item: MediaItem; index: number }) => item.id?.startsWith("gallery-") && !item.hidden)
    : [];

  /* Technical Drafting Package — same idea, its own id prefix so it can sit
     in its own section (directly above the photo row) with its own card
     styling, while still opening in the one shared lightbox. */
  const lollapaloozaDraftingMedia = isLollapalooza
    ? project.media
        .map((item: MediaItem, index: number) => ({ item, index }))
        .filter(({ item }: { item: MediaItem; index: number }) => item.id?.startsWith("drafting-") && !item.hidden)
    : [];

  const recordScrubWrapperRef = useRef<HTMLDivElement>(null);
  const recordScrubVideoRef = useRef<HTMLVideoElement>(null);
  const [, setRecordScrubProgress] = useState(0);
  useScrollScrubVideo(recordScrubWrapperRef, recordScrubVideoRef, setRecordScrubProgress);

  return (
    /* `is-panel-frame` marks this document as the one rendered inside the
       panel. It's server-rendered from the panel=1 search param, so it's in
       the very first HTML the frame parses, which is what lets the stylesheet
       hide the frame's scrollbar before anything is painted. */
    <div
      className={`relative ${mood.wrap}${isLollapalooza ? " lolla-cursor" : ""}${
        panel ? " is-panel-frame" : ""
      }`}
      /* This project's own accent, exposed page-wide so controls that tint on
         hover — the hub-tag pill above the title, and anything else reading
         `--accent-color` — pick up the same colour the overlay gradient and
         the lightbox arrows use. Projects with no accent fall back to the
         site accent at the point of use. */
      style={project.accentColor ? ({ "--accent-color": project.accentColor } as React.CSSProperties) : undefined}
    >
      {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
      <DesignFrameBridge
        liveOverrides={live}
        liveMedia={liveMedia}
        liveMediaOrder={liveMediaOrder}
        onLocalPatch={onLocalPatch}
        onLocalReset={onLocalReset}
        onSyncAll={onSyncAll}
      />

      {!panel && (
        <div data-design-protected="Protected navigation">
          <SiteNav />
        </div>
      )}

      {/* Back — to /work for tagged projects, to hub for visualizations */}
      {/* Back link, and the tall top padding that clears the fixed site nav.
          Both are dropped in the panel: the panel puts its own back control in
          the chrome above the frame, where it stays put instead of scrolling
          away with the page, and without the nav this padding was just dead
          black along the top edge. Outside the panel — every phone and tablet
          visit — this is the only back control, so it stays. */}
      {!panel && (
      <div className="px-6 md:px-12 lg:px-16 pt-28 md:pt-32">
        {project.tags && project.tags.length > 0 ? (
          <Link
            to="/work"
            search={{ tag: project.tags[0] }}
            className={isLollapalooza ? "retro-btn" : glassButton({ touch: true, className: "gap-3" })}
          >
            {isLollapalooza ? <span aria-hidden>←</span> : <BackChevron />}
            Back to Projects
          </Link>
        ) : (
          <Link
            to="/work/$hub"
            params={{ hub: hub.slug }}
            className={isLollapalooza ? "retro-btn" : glassButton({ touch: true, className: "gap-3" })}
          >
            {isLollapalooza ? <span aria-hidden>←</span> : <BackChevron />}
            Back to {hub.title}
          </Link>
        )}
      </div>
      )}

      {/* Header + hero.

          From lg up, two arrangements, both keeping the same sticky behaviour:

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
            begins right where the title ends, with no gap and no overlap.

          Below lg, neither. Both arrangements are built on the image and the
          title sharing space, which works when the image is wide enough to
          have room to spare. On a phone it doesn't: a hero rendering about
          200px tall sat under a title block of 220–290px, so the text and its
          scrim covered the photograph completely — measured at 100% on every
          overlay project, whatever the length of the name.

          So below lg the two simply stack, in ordinary flow. That is the whole
          mechanism: with no runway to reserve height and no negative margin to
          pull the image back over it, the hero begins exactly where the title
          block ends, and a title that runs to three lines pushes the image
          down by three lines rather than eating three lines of it. Nothing
          here is a fixed offset that a longer name could overrun. */}
      <div
        className={
          isPortraitHero
            ? "relative md:grid md:grid-cols-[8fr_5fr] md:gap-8 lg:gap-12 md:px-12 lg:px-16"
            : "relative"
        }
      >
      <div
        className={`${
          /* The single-cell grid — the thing that makes title and image share
             space — only exists from lg. Below it this is a plain block and
             the two children stack. */
          isTitleAbove ? "relative" : "relative lg:grid lg:grid-cols-1 lg:grid-rows-1"
        } ${isReshuffling ? "md:col-start-1 md:row-start-1" : ""}`}
      >
        <div
          className={
            isTitleAbove
              ? "relative z-10"
              : "z-10 lg:col-start-1 lg:row-start-1 lg:self-start lg:pointer-events-none"
          }
        >
          <div
            className={`sticky bg-gradient-to-b from-black via-black/70 to-transparent ${
              /* Two cases, and they want opposite things.

                 In the panel there is no site nav, so the offset and padding
                 that exist to clear it left about 115px of black above the
                 title — the last of the dead space at the top of the panel.
                 It pins to the panel's own top instead, with just enough
                 padding to breathe.

                 On the page, the offsets match the height of the fixed bar the
                 title pins under — 76px on phones, 82px from md — so the title
                 comes to rest against the bar rather than sliding behind it. */
              panel ? "top-0 pt-9 md:pt-10" : "top-[76px] md:top-20 pt-10 md:pt-14"
            } ${
              /* Lollapalooza title lockup, desktop only. Tighter top and
                 bottom padding, pulling the black title area in by about 17%
                 without touching the title's own scale. Paired with the
                 tightened gaps below.

                 Still scoped to this one project rather than promoted to all
                 of them: it's an approved composition for Lollapalooza, and
                 applying it site-wide would restyle every other project's
                 title block, which is its own decision. lg-gated, so phone
                 and tablet are untouched either way. */
              isLollapalooza ? "lg:pt-8 lg:pb-6" : ""
            } ${
              /* Below lg this is the gap between the title and the hero under
                 it, so it wants to be a breath — not the deep run-out the
                 overlay needs to fade its scrim off the photograph. */
              isTitleAbove
                ? "pb-8 md:pb-10"
                : "pb-8 sm:pb-10 lg:pb-24 lg:pointer-events-none"
            } ${isPortraitHero ? "px-6 md:px-0" : "px-6 md:px-12 lg:px-16"}`}
          >
            {project.tags && project.tags.length > 0 && (
              /* Lollapalooza desktop: the tag sits ~40% closer to the title,
                 so the three lines read as one lockup rather than three
                 stacked items.

                 The same glass-pill surface as the tag filters on /work and
                 every other real link styled as a button — before this it
                 was plain tracked-out text with only a hover color change,
                 which read as a caption rather than a working link to its
                 hub. `glassButton()` is the shared class string for exactly
                 this case: a real `<Link>` that needs to look like one of
                 the site's buttons.

                 `target="_top"` only inside the panel: this page can be
                 rendered two ways — as itself, or inset in an iframe inside
                 the panel over the feed (`?panel=1`). A plain in-app Link
                 navigates whichever document it's actually running in, so
                 without this, clicking the tag while inside the panel
                 navigated the *iframe* to /work — opening the whole feed,
                 panel and all, nested inside the panel already open one
                 level up. `_top` breaks out and navigates the real window
                 instead, landing on the actual filtered feed with the panel
                 closed, the same as clicking it from the full page does. */
              <div className={`mb-2 flex flex-wrap gap-2 ${isLollapalooza ? "lg:mb-1" : ""}`}>
                {project.tags.map((t: ProjectTag) => (
                  <Link
                    key={t}
                    to="/work"
                    search={{ tag: t }}
                    target={panel ? "_top" : undefined}
                    onMouseMove={trackSheen}
                    className={`pointer-events-auto hub-tag-pill ${glassButton({
                      quiet: true,
                      touch: true,
                      sheen: true,
                    })}`}
                  >
                    {t.replace("/", " ")}
                  </Link>
                ))}
              </div>
            )}

            {/* One continuous ramp from phone to the lg hand-off, rather than
                a step at md: 11vw capped at 3rem meant every width from 437px
                up to the tablet break rendered at exactly 48px and then jumped
                to 65px, which is why a long name broke to three lines on a
                phone and stayed there. 8vw between 2.25 and 4.75rem tracks the
                screen the whole way, and takes the longest title in the
                portfolio — "You Can't Take It With You!" — from three lines to
                two without it reading as shrunken. Desktop is untouched. */}
            <div data-design-id={designId.projectTitle(project.slug)} data-design-kind="heading">
              <AnimatedHeading
                text={project.title}
                fit
                className="project-hero-title font-display font-black uppercase leading-[0.95] lg:leading-[0.9] tracking-[-0.03em] text-balance max-w-5xl"
              />
            </div>

            {/* Lollapalooza desktop: pulled up under the title so the lockup
                closes, and lifted from 50% to 70% opacity — still clearly
                secondary to the display type, but no longer receding into
                the black at 10px. */}
            <p
              data-design-id={designId.projectSubtitle(project.slug)}
              data-design-kind="text"
              className={`mt-4 text-[10px] tracking-[0.3em] uppercase ${
                isLollapalooza
                  ? "text-foreground/50 lg:mt-2 lg:text-foreground/70"
                  : "text-foreground/50"
              }`}
            >
              {project.subtitle}
            </p>

            {project.notes && project.notes.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.notes.map((n: string, i: number) => (
                  <li
                    key={i}
                    className="pill pill-wrap"
                    data-design-id={`project.${project.slug}.note.${i}`}
                    data-design-kind="text"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Runway — controls exactly how long the title stays pinned while
              the image scrolls under it. It only has a job in the overlaid
              arrangement, so below lg it collapses: with no reserved height
              there is nothing for the hero to be pulled back across, and the
              title block's own height becomes the spacing. */}
          <div className="h-0 lg:h-[300px]" />
        </div>

        <figure
          className={`z-0 ${
            isTitleAbove
              ? /* -300px cancels the runway exactly, so the image begins where
                   the title ends. TaB goes further and tucks the image up
                   behind the whole title block, which lifts everything below
                   it by the same amount — the point being that the closeup
                   animation starts near enough to the fold to signal there's
                   more page. Readable because of the blue scrim above.

                   Both are lg-only. Below it the runway is collapsed, so there
                   is nothing to cancel — and TaB's deeper tuck would be pulling
                   the image up over the title rather than behind a scrim that
                   has room to fade. */
                isTab
                ? "relative mt-0 lg:-mt-[540px]"
                : "relative mt-0 lg:-mt-[300px]"
              : "lg:col-start-1 lg:row-start-1"
          } ${
            /* Full bleed in the panel. The standard 64px gutter left the hero
               sitting inside a black border, which is the effect Reid was
               seeing at the sides; letting the image meet the panel edge reads
               as intentional framing instead. */
            panel
              ? "px-0"
              : isPortraitHero
                ? "px-6 md:px-0"
                : "px-6 md:px-12 lg:px-16"
          } ${
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
              data-design-id={designId.projectMedia(project.slug, project.media[0]?.id ?? "0")}
              data-design-kind="image"
              data-design-role="header"
              data-design-project={project.slug}
              src={project.cover}
              alt={project.title}
              className={`w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-1000 ease-cinematic ${
                isYctiwy ? "animate-image-drift-up" : mood.enter
              }`}
            />
          </button>
        </figure>

      </div>

      {/* Lollapalooza — credits, on the right, directly under the hero. Kept
          out of the shared description+credits section further down (see the
          `!isLollapalooza` guard there) so they don't repeat. */}
      {isLollapalooza && project.credits && project.credits.length > 0 && (
        <section className="px-6 md:px-12 lg:px-16 pt-6 md:pt-8 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <RevealBlock className="md:col-span-4 md:col-start-9">
              <ul className="space-y-3">
                {project.credits
                  .filter((c: Credit) => !c.hidden)
                  .map((c: Credit) => (
                    <CreditRow key={c.role} slug={project.slug} credit={c} />
                  ))}
              </ul>
            </RevealBlock>
          </div>
        </section>
      )}

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
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-base md:text-lg leading-snug tracking-tight text-balance md:text-right"
            >
              {project.description}
            </p>
          </RevealBlock>

          {project.credits && project.credits.length > 0 && (
            <ul className="px-6 md:px-0 mt-8 md:mt-0 space-y-3 md:col-start-1 md:row-start-2">
              {project.credits.filter((c: Credit) => !c.hidden).map((c: Credit) => (
                <CreditRow key={c.role} slug={project.slug} credit={c} />
              ))}
            </ul>
          )}
        </>
      )}

      {isPortraitHero && !isReshuffling && (
        <aside className="px-6 md:px-0 pt-8 md:pt-14 pb-4 md:pb-0">
          <div className="md:sticky md:top-32">
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-lg md:text-xl lg:text-2xl leading-snug tracking-tight text-balance"
            >
              {project.description}
            </p>
            {project.credits && project.credits.length > 0 && (
              <ul className="mt-8 space-y-3">
                {project.credits.filter((c: Credit) => !c.hidden).map((c: Credit) => (
                  <CreditRow key={c.role} slug={project.slug} credit={c} />
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
        <section className="px-6 md:px-12 lg:px-16 pt-2 md:pt-4 pb-4 md:pb-6">
          {/* A straight half-and-half split: the closeup animation fills the
              left half (just under half the page), credits + description hold
              the right half on their own — the text column is a fixed half,
              not sized off the video. */}
          <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-12 md:items-start">
            <figure className="group">
              <button
                type="button"
                onClick={() => setLightbox(1)}
                className="block w-full overflow-hidden rounded-md bg-secondary md:max-w-[95%]"
                aria-label="Enlarge TaB closeup animation"
              >
                <InViewVideo
                  src="/tab-closeup-animation.mp4"
                  playOnce
                  className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                />
              </button>
            </figure>

            {/* Right column: credits sit up here above the description.
                space-y-2 to match the tighter credit spacing on True West /
                Anne Frank / YCTIWU. */}
            <div className="mt-6 md:mt-0">
              {project.credits && project.credits.length > 0 && (
                <RevealBlock>
                  <ul className="mb-5 space-y-2 md:mb-6">
                    {project.credits
                      .filter((c: Credit) => !c.hidden)
                      .map((c: Credit) => (
                        <CreditRow key={c.role} slug={project.slug} credit={c} />
                      ))}
                  </ul>
                </RevealBlock>
              )}
              <RevealBlock delay={0.1}>
                <p
                  data-design-id={designId.projectDescription(project.slug)}
                  data-design-kind="text"
                  className="font-display font-light text-lg md:text-xl lg:text-2xl leading-snug tracking-tight text-balance"
                >
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
          its own light styling. A no-op on every other project — except
          Field House, which uses the same light theme for its whole body
          with no transition graphic (its hero sits above this point and
          stays on the site's usual dark chrome). */}
      <div className={isTab || isFieldHouse || isTownhouse ? "light-zone" : undefined}>

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
        <section className="px-6 md:px-12 lg:px-16 pt-4 md:pt-6 pb-8 md:pb-12">
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
          </div>
        </div>
      )}

      {/* Description + credits — skipped on portrait-hero pages, where both
          already appear in the column beside the hero, and on TaB, where both
          now sit up beside the closeup animation. */}
      {!isPortraitHero && !isTab && (
      <section className="px-6 md:px-12 lg:px-16 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          {/* Skipped on True West, where the two lines of the description now
              run as the pull quotes flanking the image trio below — printing
              it here as well just repeats them. Credits keep their usual place
              on the right either way. */}
          {!isYctiwy && !isAnneFrank && !isTrueWest && (
            <RevealBlock>
              <p
                data-design-id={designId.projectDescription(project.slug)}
                data-design-kind="text"
                className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
              >
                {project.description}
              </p>
            </RevealBlock>
          )}
        </div>
        {/* Lollapalooza's credits render up beside the hero instead. */}
        {project.credits && project.credits.length > 0 && !isLollapalooza && (
          <RevealBlock className="md:col-span-4" delay={0.1}>
            <ul className="space-y-3">
              {project.credits.filter((c: Credit) => !c.hidden).map((c: Credit) => (
                <CreditRow key={c.role} slug={project.slug} credit={c} />
              ))}
            </ul>
          </RevealBlock>
        )}
      </section>
      )}

      {/* Pull quote */}
      {project.pullQuote && (
        <section
          className={`px-6 md:px-12 lg:px-16 ${
            /* True West runs this straight into the image trio below it, so
               the quote reads as their caption rather than a stranded line
               with a screen of black under it. */
            isTrueWest ? "pt-8 md:pt-10 pb-2 md:pb-3" : "py-8 md:py-10"
          }`}
        >
          <RevealBlock>
            <blockquote
              data-design-id={designId.projectPullQuote(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-2xl md:text-4xl leading-snug text-balance max-w-4xl"
            >
              {project.pullQuote}
            </blockquote>
          </RevealBlock>
        </section>
      )}

      {/* Special: True West — dual-world comparison + plan diagrams */}
      {isTrueWest && (
        <>
          <section className="px-6 md:px-12 lg:px-16 pt-3 md:pt-4 pb-6 md:pb-8">
            <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] gap-3 md:gap-4">
              <figure className="group h-full animate-slide-from-left">
                <button
                  type="button"
                  onClick={() => setLightbox(1)}
                  className="block h-full w-full overflow-hidden rounded-md bg-secondary"
                  aria-label={project.media[1].caption ?? "True West — second act"}
                >
                  <img
                    data-design-id={designId.projectMedia(project.slug, project.media[1].id ?? "1")}
                    data-design-kind="image"
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
                      data-design-id={designId.projectMedia(project.slug, project.media[2].id ?? "2")}
                      data-design-kind="image"
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
                      data-design-id={designId.projectMedia(project.slug, project.media[3].id ?? "3")}
                      data-design-kind="image"
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
              /* Second pull quote — same weight and size as the one above the
                 image trio, sitting just under it and before the final
                 diagram. */
              <blockquote className="mt-10 md:mt-12 max-w-4xl space-y-2 font-display font-light text-2xl md:text-4xl leading-snug text-balance">
                <span className="block">{project.dualityLines[0]}</span>
                <span className="block">{project.dualityLines[1]}</span>
              </blockquote>
            )}
          </section>

          <section className="px-6 md:px-12 lg:px-16 pt-4 md:pt-6 pb-8 md:pb-10">
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
            <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
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
            <section className="px-6 md:px-12 lg:px-16 py-20 md:py-28">
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
          above, which would otherwise repeat the whole set — and, for the
          default (non-bespoke) branch, where there's simply nothing left in
          `galleryMedia` to show, so the section doesn't sit there as an
          empty band of padding. */}
      {!isTrueWest && !isReshuffling && (isAnneFrank || isYctiwy || isTownhouse || galleryMedia.length > 0) && (
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
                      data-design-id={designId.projectMedia(project.slug, project.media[1].id ?? "1")}
                      data-design-kind="image"
                      src={project.media[1].src}
                      alt={project.media[1].caption ?? project.title}
                      loading="lazy"
                      className="w-full h-auto object-contain animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                    />
                  </button>
                </figure>

                <RevealBlock>
                  <p
                    data-design-id={designId.projectDescription(project.slug)}
                    data-design-kind="text"
                    className="mt-6 md:mt-8 font-display font-light text-base md:text-lg leading-relaxed text-balance text-foreground/85 md:max-w-sm md:ml-auto md:text-right"
                  >
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
                    data-design-id={designId.projectMedia(project.slug, project.media[2].id ?? "2")}
                    data-design-kind="image"
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
                      data-design-id={designId.projectMedia(project.slug, project.media[idx].id ?? String(idx))}
                      data-design-kind="image"
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
            {!project.media[1]?.hidden && (
            <figure className="group">
              <button
                type="button"
                onClick={() => setLightbox(1)}
                className="block w-full overflow-hidden rounded-md bg-secondary"
                aria-label={project.media[1].caption ?? "Closeup"}
              >
                <img
                  data-design-id={designId.projectMedia(project.slug, project.media[1].id ?? "1")}
                  data-design-kind="image"
                  src={project.media[1].src}
                  alt={project.media[1].caption ?? project.title}
                  loading="lazy"
                  className="w-full h-auto object-cover animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                />
              </button>
              <figcaption
                data-design-id={designId.projectMediaCaption(project.slug, project.media[1].id ?? "1")}
                data-design-kind="text"
                className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide leading-relaxed"
              >
                {project.media[1].caption}
              </figcaption>
            </figure>
            )}

            {/* Sketch + drawing stacked, right column */}
            <div className="flex flex-col gap-3 md:gap-4">
              {!project.media[2]?.hidden && (
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(2)}
                  className="block w-full overflow-hidden rounded-md bg-black p-6 md:p-8"
                  aria-label={project.media[2].caption ?? "Sketch"}
                >
                  <img
                    data-design-id={designId.projectMedia(project.slug, project.media[2].id ?? "2")}
                    data-design-kind="image"
                    src={project.media[2].src}
                    alt={project.media[2].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto object-contain animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
              )}
              {!project.media[3]?.hidden && (
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(3)}
                  className="block w-full overflow-hidden rounded-md bg-black p-6 md:p-8"
                  aria-label={project.media[3].caption ?? "Drawing"}
                >
                  <img
                    data-design-id={designId.projectMedia(project.slug, project.media[3].id ?? "3")}
                    data-design-kind="image"
                    src={project.media[3].src}
                    alt={project.media[3].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto object-contain animate-image-fade group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
              )}
            </div>
          </div>
        ) : isTownhouse ? (
          // Custom Townhouse layout: the axonometric upright (its own
          // natural proportions, not rotated) on the left, and the three
          // renders stacked as a centered column on the right — nothing
          // else follows it. The wrapper's aspect-ratio matches the axon's
          // real dimensions exactly, so it's never cropped and never grows
          // taller than the picture itself. Portrait now — the previous
          // export of this same view was sideways (1865/1143, landscape);
          // this one is the identical image rotated upright (1143/1865).
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 md:gap-10 md:items-center">
            {!project.media[0]?.hidden && (
              <figure className="group overflow-hidden rounded-md" style={{ aspectRatio: "1143 / 1865" }}>
                <button
                  type="button"
                  onClick={() => setLightbox(0)}
                  className="block w-full h-full"
                  aria-label={project.media[0].caption ?? "Axonometric"}
                >
                  <img
                    data-design-id={designId.projectMedia(project.slug, project.media[0].id ?? "0")}
                    data-design-kind="image"
                    src={project.media[0].src}
                    alt={project.media[0].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
            )}

            {/* Squares fill their column's own width exactly (no inner
                max-width) so there's no blank margin between the two
                columns beyond the grid gap itself. */}
            <div className="flex flex-col gap-4 md:gap-6">
              {[1, 2, 3].map(
                (idx) =>
                  !project.media[idx]?.hidden && (
                    <figure key={idx} className="group">
                      <button
                        type="button"
                        onClick={() => setLightbox(idx)}
                        className="block w-full aspect-square overflow-hidden rounded-md bg-secondary"
                        aria-label={project.media[idx].caption ?? `Render ${idx}`}
                      >
                        <img
                          data-design-id={designId.projectMedia(project.slug, project.media[idx].id ?? String(idx))}
                          data-design-kind="image"
                          src={project.media[idx].src}
                          alt={project.media[idx].caption ?? project.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                        />
                      </button>
                    </figure>
                  ),
              )}
            </div>
          </div>
        ) : galleryMedia.length === 0 ? null : (
          // grid-cols-2 lets a "half" item's md:col-span-1 sit next to
          // another half item automatically (standard grid auto-flow) while
          // a "full" item's md:col-span-2 takes the whole row — no manual
          // pairing logic needed, and every hand-authored item (no `layout`
          // set, treated as full) renders exactly as before.
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {galleryMedia.map(({ item: m, index: i }) => {
              const mediaId = designId.projectMedia(project.slug, m.id!);
              const isHalf = m.layout === "half";
              const role = m.addedByDesignMode ? (isHalf ? "half-width image" : "full-width image") : "gallery image";
              const mediaEl =
                m.type === "video" ? (
                  <video
                    data-design-id={mediaId}
                    data-design-kind="image"
                    data-design-role={role}
                    data-design-project={project.slug}
                    data-design-layout={m.layout ?? "full"}
                    data-design-added={m.addedByDesignMode ? "1" : undefined}
                    data-design-link={m.link}
                    data-design-media-id={m.addedByDesignMode ? m.id : undefined}
                    data-design-caption={m.caption}
                    src={m.src}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="w-full h-auto object-cover"
                  />
                ) : (
                  <img
                    data-design-id={mediaId}
                    data-design-kind="image"
                    data-design-role={role}
                    data-design-project={project.slug}
                    data-design-layout={m.layout ?? "full"}
                    data-design-added={m.addedByDesignMode ? "1" : undefined}
                    data-design-link={m.link}
                    data-design-media-id={m.addedByDesignMode ? m.id : undefined}
                    data-design-caption={m.caption}
                    data-design-decorative={m.decorative ? "1" : undefined}
                    src={m.src}
                    alt={m.decorative ? "" : (m.alt ?? m.caption ?? project.title)}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                );
              return (
                <figure
                  key={m.id}
                  className={`group ${isHalf ? "md:col-span-1" : "md:col-span-2"} ${
                    isStaging ? `transform ${i % 2 === 0 ? "-rotate-1" : "rotate-1"}` : ""
                  }`}
                >
                  {/* A link makes the media clickable to navigate instead of
                      opening the lightbox — never both, since an anchor
                      can't legally wrap another interactive control. Design
                      Mode's own click handling still takes over during
                      Content/Arrange, so a link never fights selection while
                      editing. */}
                  {m.link ? (
                    <a href={m.link} className="block w-full overflow-hidden rounded-md bg-secondary">
                      {mediaEl}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLightbox(i)}
                      className="block w-full overflow-hidden rounded-md bg-secondary"
                      aria-label={m.caption ?? `Media ${i + 1}`}
                    >
                      {mediaEl}
                    </button>
                  )}
                  {m.caption && (
                    <figcaption className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide">
                      {!m.addedByDesignMode && `${String(i + 1).padStart(2, "0")} — `}
                      <span
                        data-design-id={designId.projectMediaCaption(project.slug, m.id!)}
                        data-design-kind="text"
                      >
                        {m.caption}
                      </span>
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}
      </section>
      )}


      {/* Lollapalooza — Technical Drafting Package. CAA's construction
          drawings for the build, directly above the event-photo row below.

          One sheet at a time on every screen — the drawings carry too much
          fine detail to survive being shown six-across. Desktop gets a
          spring-slide carousel with arrows + progress pills; mobile a plain
          swipe carousel. Both put each sheet whole on a white card
          (`object-contain`, fixed frame height) so nothing crops a dimension
          string or title block, and tapping a sheet opens the shared
          lightbox. */}
      {isLollapalooza && lollapaloozaDraftingMedia.length > 0 && (
        <section className="px-6 md:px-12 lg:px-16 pt-12">
          <h2 className="font-display font-light text-2xl md:text-4xl mb-6">
            Technical Drafting Package
          </h2>

          <div className="md:hidden">
            <SwipeGallery
              slug={project.slug}
              items={lollapaloozaDraftingMedia}
              onOpen={setLightbox}
              slideClassName="rounded-xl bg-white p-2"
            />
          </div>

          <div className="hidden md:block">
            <FramerCarousel
              className="mx-auto max-w-[1200px]"
              count={lollapaloozaDraftingMedia.length}
              thumbnails={lollapaloozaDraftingMedia.map(({ item }) => item.src)}
              renderSlide={(i, ctrl) => {
                const { item: m } = lollapaloozaDraftingMedia[i];
                return (
                  /* The white sheet wraps only the drawing (plus a thin
                     mount) and sits centred, so the page's black shows down
                     both sides. Not clickable — these read fine at this size
                     and there's no isolated view to open. Arrows sit just off
                     the card's edges and only render for the active slide. */
                  <div className="flex w-full justify-center py-8">
                    <div className="relative">
                      <div className="block rounded-xl bg-white p-3 shadow-lg">
                        <img
                          data-design-id={designId.projectMedia(project.slug, m.id!)}
                          data-design-kind="image"
                          src={m.src}
                          alt={m.caption ?? project.title}
                          loading="lazy"
                          className="block max-h-[74vh] w-auto max-w-[min(1000px,84vw)] object-contain"
                        />
                      </div>
                      {ctrl.isActive && (
                        <>
                          <button
                            type="button"
                            onClick={ctrl.goPrev}
                            disabled={ctrl.isFirst}
                            aria-label="Previous drafting sheet"
                            className="nav-arrow absolute right-full top-1/2 mr-3 h-10 w-10 -translate-y-1/2 disabled:pointer-events-none disabled:opacity-30"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={ctrl.goNext}
                            disabled={ctrl.isLast}
                            aria-label="Next drafting sheet"
                            className="nav-arrow absolute left-full top-1/2 ml-3 h-10 w-10 -translate-y-1/2 disabled:pointer-events-none disabled:opacity-30"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </section>
      )}

      {/* Lollapalooza — closing beat. Real event photography from Club
          Magenta, shown one at a time: the spring-slide carousel on desktop,
          the plain swipe carousel on mobile. Mixed portrait/landscape, each
          at its own aspect ratio and centred so the page's black frames it.
          Tapping a photo opens the shared lightbox; the drafting sheets above
          don't, since there's nothing extra to see. */}
      {isLollapalooza && lollapaloozaGalleryMedia.length > 0 && (
        <section className="px-6 md:px-12 lg:px-16 pb-12">
          <div className="md:hidden">
            <SwipeGallery
              slug={project.slug}
              items={lollapaloozaGalleryMedia}
              onOpen={setLightbox}
              slideClassName="rounded-lg overflow-hidden bg-secondary"
            />
          </div>

          <div className="hidden md:block">
            <FramerCarousel
              className="mx-auto max-w-[1200px]"
              count={lollapaloozaGalleryMedia.length}
              thumbnails={lollapaloozaGalleryMedia.map(({ item }) => item.src)}
              renderSlide={(i, ctrl) => {
                const { item: m, index } = lollapaloozaGalleryMedia[i];
                return (
                  <div className="flex w-full justify-center py-8">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setLightbox(index)}
                        aria-label={m.caption ?? "Open photo"}
                        className="block overflow-hidden rounded-lg bg-secondary shadow-lg transition-transform duration-300 hover:scale-[1.01]"
                      >
                        <img
                          data-design-id={designId.projectMedia(project.slug, m.id!)}
                          data-design-kind="image"
                          src={m.src}
                          alt={m.caption ?? project.title}
                          loading="lazy"
                          className="block max-h-[74vh] w-auto max-w-[min(1000px,84vw)] object-contain"
                        />
                      </button>
                      {ctrl.isActive && (
                        <>
                          <button
                            type="button"
                            onClick={ctrl.goPrev}
                            disabled={ctrl.isFirst}
                            aria-label="Previous photo"
                            className="nav-arrow absolute right-full top-1/2 mr-3 h-10 w-10 -translate-y-1/2 disabled:pointer-events-none disabled:opacity-30"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={ctrl.goNext}
                            disabled={ctrl.isLast}
                            aria-label="Next photo"
                            className="nav-arrow absolute left-full top-1/2 ml-3 h-10 w-10 -translate-y-1/2 disabled:pointer-events-none disabled:opacity-30"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </section>
      )}

      {/* Back to feed + next. Suppressed in the panel: the feed is already
          sitting right behind it, so onward navigation belongs to that page,
          not to a window floating over it. In the panel the project simply
          ends with its last section. */}
      {!panel && (
      <section className="px-6 md:px-12 lg:px-16 py-20 grid grid-cols-1 md:grid-cols-2 gap-8">
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
      )}

      {/* Footer likewise — the wordmark, the statement line and the contact
          details belong to the site, and the site is the page behind. */}
      {!panel && (
        <div data-design-protected="Protected navigation">
          <SiteFooter />
        </div>
      )}

      </div>{/* end light-zone */}

      {/* Lightbox — deliberately outside the light region so it stays dark.
          `--accent-color` drives the Prev/Next arrows' hover tint (see
          `.nav-arrow`) — this project's own accent, same as the panel view's
          gradient, so stepping through photos here and shuffling projects in
          the panel read as the same control everywhere it appears. */}
      {lightbox != null && (
        <div
          /* Fully opaque. At bg-black/60 the page behind — a project's
             description, its other images — bled through the blur and read as
             ghost text and shapes over the enlarged photo. An image opened
             full-screen should show nothing but that image. */
          className="fixed inset-0 z-[100] bg-black flex flex-col cursor-zoom-out animate-fade-in-fast"
          style={project.accentColor ? ({ "--accent-color": project.accentColor } as React.CSSProperties) : undefined}
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
              onMouseMove={trackSheen}
              className={`lightbox-close ${glassButton({ touch: true, sheen: true })}`}
              aria-label="Close"
            >
              <CloseMark />
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
              /* Enlarged video: gains a minimal, auto-hiding play/pause +
                 scrub bar here — the one place a project video is a player
                 rather than a moving image. Clicking it toggles play/pause,
                 so closing is via the ✕ or the dark margin. */
              <LightboxVideo
                src={project.media[lightbox].src}
                zoom={zoom}
                animateZoom={!pinchStart.current}
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
              className="nav-arrow absolute left-4 md:left-8 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 opacity-0 group-hover/lb:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
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
              className="nav-arrow absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 opacity-0 group-hover/lb:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100"
            >
              ›
            </button>
          </div>

          {SHOW_LIGHTBOX_CAPTIONS && project.media[lightbox].caption && (
            <p
              className="text-xs md:text-sm text-foreground/80 text-center px-6 pb-6"
              onClick={(e) => e.stopPropagation()}
              data-design-id={designId.projectMediaCaption(
                project.slug,
                project.media[lightbox].id ?? String(lightbox),
              )}
              data-design-kind="text"
            >
              {project.media[lightbox].caption}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
