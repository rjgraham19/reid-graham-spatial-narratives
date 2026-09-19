import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { RecordPlayerViewer } from "@/components/record-player-viewer";
import { AnimatedHeading, RevealBlock } from "@/components/animated-text";
import { BackChevron, CloseMark, glassButton, trackSheen } from "@/components/glass-button";
import { LightboxVideo } from "@/components/lightbox-video";
import { SwipeGallery } from "@/components/swipe-gallery";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import { FramerCarousel } from "@/components/ui/framer-carousel";
import { ExchangeViewer } from "@/components/exchange-viewer";
import { LollaViewer } from "@/components/lolla-viewer";
import { TownhouseViewer } from "@/components/townhouse-viewer";

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
  type Project,
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

/** Wraps one phrase (e.g. a work's title) in <em> wherever it appears in a
 *  plain-text field, so a single italicized run inside otherwise-plain body
 *  copy doesn't need its own hardcoded JSX every time it comes up. */
function italicizePhrase(text: string, phrase: string) {
  const i = text.indexOf(phrase);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <em>{phrase}</em>
      {text.slice(i + phrase.length)}
    </>
  );
}

// Exchange Facility: the description reads as two paragraphs but only one
// of them belongs up top — the second sits below the model, directly
// before the static renderings, so it doesn't pile onto the page's opening
// before the model has a chance to show. Splitting on the sentence that
// starts the second half rather than duplicating both halves as separate
// strings keeps `project.description` the single source of truth.
function splitAt(text: string, marker: string): [string, string] {
  const i = text.indexOf(marker);
  if (i === -1) return [text, ""];
  return [text.slice(0, i).trim(), text.slice(i).trim()];
}

/**
 * Show the caption under an enlarged image in the lightbox.
 *
 * Off for now — the per-image caption copy still needs a pass and the site is
 * going public before there's time for it. The caption markup below is left
 * intact (and Design Mode still targets it), so flipping this back to `true`
 * brings the captions back with no other change.
 */
const SHOW_LIGHTBOX_CAPTIONS = false as boolean;

/**
 * The photo carousel at the foot of the Lollapalooza page.
 *
 * Off — the scrolling photo band up near the title now shows the same event
 * photos, so this repeated them. The section markup is left intact; flip to
 * `true` to bring the bottom carousel back.
 */
const SHOW_LOLLAPALOOZA_PHOTO_CAROUSEL = false as boolean;

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

/**
 * Inline "MY ROLE: ..." / "COLLABORATORS: role: name" pair — a compact
 * alternative to CreditRow's stacked label/name block, used on the three
 * pages (Reshuffling, Townhouse, Staging Aesthetics) whose credits sit in a
 * single info block with the description rather than a bulleted list beside
 * the hero. Label and value stay on one line with natural wrapping — no
 * dividers between multiple collaborators, just a plain space.
 */
function RoleAndCollaborators({ project }: { project: Project }) {
  const credits = (project.credits ?? []).filter((c) => !c.hidden);
  const myRole = credits.find((c) => c.name === "Reid Graham");
  const collaborators = credits.filter((c) => c.name !== "Reid Graham");
  if (!myRole && collaborators.length === 0) return null;
  return (
    <div className="mt-8 md:mt-10 space-y-1 uppercase tracking-[0.15em] text-left">
      {myRole && (
        <p
          data-design-id={designId.projectCredit(project.slug, myRole.role)}
          data-design-kind="text"
          className="text-[0.65rem] md:text-lg"
        >
          <span className="text-foreground/50">MY ROLE: </span>
          <span className="text-foreground">{myRole.role}</span>
        </p>
      )}
      {collaborators.length > 0 && (
        <p className="text-[0.6rem] md:text-base max-w-2xl">
          <span className="text-foreground/50">COLLABORATORS: </span>
          {collaborators.map((c, i) => (
            <span
              key={c.role}
              data-design-id={designId.projectCredit(project.slug, c.role)}
              data-design-kind="text"
              className="text-foreground/50"
            >
              {i > 0 && " "}
              {c.role}: {c.name}
            </span>
          ))}
        </p>
      )}
    </div>
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
  const isExchange = project.slug === "the-exchange-facility";
  const isRagsToRiches = project.slug === "rags-to-riches";
  const isPortraitHero = project.heroPortrait === true;

  /* Shared between the two placements below — same link, same label, just
     rendered in two different spots depending on viewport. */
  const backLink =
    project.tags && project.tags.length > 0 ? (
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
    );

  // Lollapalooza's record animation renders on a near-black (~#0a0908), not
  // pure #000, so against a #000 page the scrub video reads as a separate
  // panel. Take the html/body (behind any overscroll, and the panel it can
  // open inside) to that same off-black; `.lolla-bg` handles the in-markup
  // page wrappers.
  useEffect(() => {
    if (!isLollapalooza) return;
    const prevBody = document.body.style.backgroundColor;
    const prevHtml = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#0a0908";
    document.documentElement.style.backgroundColor = "#0a0908";
    return () => {
      document.body.style.backgroundColor = prevBody;
      document.documentElement.style.backgroundColor = prevHtml;
    };
  }, [isLollapalooza]);

  /* What the standard gallery should list. TaB gives its closeup video and
     both halves of the PINK FOUNTAIN drawing their own sections higher up the
     page — the opening contact sheet is the same image as the hero, so it's
     excluded here too rather than repeating the hero at the foot of the page.
     The original index travels with each item, since that's what the
     lightbox counts by. */
  // The generic two-column gallery grid's own display order can additionally
  // be overridden by a Design Mode Reorder drag (`applyMediaOrder`) — the
  // several bespoke per-project layouts below address `project.media` by
  // fixed index and never read this, so they're unaffected.
  const galleryMedia = applyMediaOrder(
    project.media
      .map((item: MediaItem, index: number) => ({ item, index }))
      .filter(
        ({ item, index }: { item: MediaItem; index: number }) =>
          !isTab &&
          !isRagsToRiches &&
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
  // The blurb pinned beside the record player fades in a beat after the
  // scrub starts, then holds. Opacity is written straight to the node from
  // the scroll-progress callback so the page doesn't re-render every frame.
  const recordCaptionRef = useRef<HTMLParagraphElement>(null);
  const updateRecordCaption = (p: number) => {
    const el = recordCaptionRef.current;
    if (el) el.style.opacity = String(Math.min(1, Math.max(0, (p - 0.04) / 0.12)));
  };

  // The fixed nav's own translucent/blurred backdrop sits at the very top of
  // the viewport throughout the 400vh record-scrub, over ~66px the circular
  // record itself scrolls through — reading as the animation's top getting
  // clipped by an opaque bar. Dropping the backdrop only while this section
  // is actually on screen fixes that without touching nav elsewhere on the
  // page, where the drafting sheets below are white and need it back.
  const [scrubInView, setScrubInView] = useState(false);
  useEffect(() => {
    if (!isLollapalooza) return;
    const el = recordScrubWrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setScrubInView(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isLollapalooza]);

  return (
    /* `is-panel-frame` marks this document as the one rendered inside the
       panel. It's server-rendered from the panel=1 search param, so it's in
       the very first HTML the frame parses, which is what lets the stylesheet
       hide the frame's scrollbar before anything is painted. */
    <div
      className={`relative ${mood.wrap}${isLollapalooza ? " lolla-cursor lolla-bg" : ""}${
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
          <SiteNav variant={isLollapalooza && scrubInView ? "top-transparent" : "top"} />
        </div>
      )}

      {/* Back — to /work for tagged projects, to hub for visualizations.
          Dropped entirely in the panel: the panel puts its own back control in
          the chrome above the frame, where it stays put instead of scrolling
          away with the page. Outside the panel — every phone and tablet
          visit — this is the only back control, so it stays, but in two
          different spots depending on viewport:

          - Phone: fixed in the same top row as the MENU button (matching its
            own py-4), left-aligned where that row is otherwise empty (MENU
            sits right, justify-end). It used to sit below the nav in normal
            flow with a big top padding (pt-28) just to clear the fixed bar —
            that reserved a chunk of a short phone screen's height before any
            real content (the tags/title/hero) even started. Fixed instead of
            in-flow, it takes up none of that vertical space.
          - Tablet/desktop: unchanged, in normal flow below the nav — there's
            room to spare there and this keeps the wider layout as it was. */}
      {!panel && (
        <>
          <div className="md:hidden fixed top-0 left-0 z-[110] px-6 py-4 flex items-center">
            {backLink}
          </div>
          <div className="hidden md:block px-12 lg:px-16 pt-32">{backLink}</div>
        </>
      )}

      {/* Header + hero.

          Used to be two lg+ arrangements built on a sticky-pinned title: the
          title would pin over the photo for a fixed 300px "runway" while it
          scrolled underneath, then release. That scroll-linked pin-and-
          release was the actual problem — it read as glitchy rather than
          intentional, and it added a whole extra mechanism (the runway
          spacer, a negative margin pulling the image back up to cancel it,
          per-project tuning of both) just to get a title-then-image layout
          that stacking already gives you for free.

          So now every project just stacks, at every width: title in normal
          flow, image immediately after. The title's own entrance animation
          (the same left-to-right wipe/reveal already used for every heading
          on the site) is what carries the "arrival," the way it already did
          on the title-above projects (Staging Aesthetics, the Garden of
          Earthly Delights) — those never used the sticky mechanism, and are
          the model this generalizes to everyone. A title that runs to three
          lines simply pushes the image down by three lines; nothing here is
          a fixed offset a longer name could overrun.

          The title block itself now always renders full-width, above the
          portrait-hero grid rather than sharing its 8fr column — confined to
          ~60% of the page, a longer name ("The Exchange Facility",
          "Reshuffling the Deck") wrapped to two lines even with all the
          screen width a wide monitor has to spare. Full width, it has room
          to actually use that space and stay on one line, and the hero
          image + description grid below is unaffected either way. */}
      <div className="relative z-10">
          <div
            className={`bg-gradient-to-b from-black via-black/70 to-transparent ${
              panel
                ? "pt-9 md:pt-10"
                : /* Phone: the back link is now fixed in the nav row rather
                     than in normal flow (see above), so this is the only
                     thing clearing the fixed bar — needs real height, not
                     just a small gap. Tablet/desktop unchanged: the back
                     link still sits in flow above this with its own pt-32. */
                  "pt-24 md:pt-14"
            } ${
              /* Lollapalooza title lockup, desktop only. Tighter top
                 padding, pulling the black title area in by about 17%
                 without touching the title's own scale.

                 Still scoped to this one project rather than promoted to all
                 of them: it's an approved composition for Lollapalooza, and
                 applying it site-wide would restyle every other project's
                 title block, which is its own decision. lg-gated, so phone
                 and tablet are untouched either way. */
              isLollapalooza ? "lg:pt-8" : ""
            } pb-2 px-6 md:px-12 lg:px-16`}
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
                className="project-hero-title font-display font-black uppercase leading-[0.95] lg:leading-[0.9] tracking-[-0.03em] text-balance"
              />
            </div>

            {/* Lollapalooza desktop: pulled up under the title so the lockup
                closes, and lifted from 50% to 70% opacity — still clearly
                secondary to the display type, but no longer receding into
                the black at 10px. */}
            <p
              data-design-id={designId.projectSubtitle(project.slug)}
              data-design-kind="text"
              className={`mt-4 font-display font-light uppercase tracking-[0.15em] text-sm md:text-base ${
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
      </div>

      {/* Hero image (+ description, for portrait heroes) — the grid this
          used to share with the title. Now it only holds the image itself
          (and, for the portrait layout, the description beside it), so its
          8fr/5fr split no longer constrains how wide the title above it can
          run. */}
      <div
        className={`${
          isPortraitHero
            ? "relative md:grid md:grid-cols-[8fr_5fr] md:gap-8 lg:gap-12 md:px-12 lg:px-16"
            : "relative"
        }${
          /* Field House: the light theme used for the rest of its body (see
             the light-zone wrapper further down) starts here instead, right
             at the hero, so the page's black only reads as a band behind the
             nav/title and doesn't run down behind the photo too. */
          isFieldHouse ? " light-zone" : ""
        }`}
      >
      <div
        className={`relative ${isReshuffling ? "md:col-start-1 md:row-start-1" : ""}`}
      >
        {/* Lollapalooza — the gallery-* event photos as an endless, clickable
            band between the title and the hero. The same photos still sit in
            the carousel at the foot of the page (kept for now); this is the
            up-front showcase. Tapping one opens the shared lightbox by its
            real media index. */}
        {isLollapalooza && lollapaloozaGalleryMedia.length > 0 && (
          <div className="py-8 md:py-12">
            <ImageAutoSlider
              speedSeconds={22}
              paused={lightbox != null}
              images={lollapaloozaGalleryMedia.map(({ item }: { item: MediaItem }) => item.src)}
              imageAlts={lollapaloozaGalleryMedia.map(
                ({ item }: { item: MediaItem }) => item.caption ?? "",
              )}
              onImageClick={(i: number) => setLightbox(lollapaloozaGalleryMedia[i].index)}
            />
          </div>
        )}

        {/* Lollapalooza — description + MY ROLE / COLLABORATORS between the
            gallery carousel above and the hero photo below, rather than
            below either. Kept out of the shared description+credits section
            further down (see the `!isLollapalooza` guard there) so it
            doesn't repeat. The CD-player paragraph that used to live in
            this same description field now sits in `extendedDescription`,
            pinned beside the record-player scroll-scrub farther down
            instead of up here. */}
        {isLollapalooza && (
          <section className="px-6 md:px-12 lg:px-16 pb-6 md:pb-8 text-center">
            <RevealBlock>
              <p
                data-design-id={designId.projectDescription(project.slug)}
                data-design-kind="text"
                className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
              >
                {project.description}
              </p>
              <RoleAndCollaborators project={project} />
            </RevealBlock>
          </section>
        )}

        {/* Exchange Facility — no static hero photo. The live 3D model fills
            this slot instead (rendered further down, directly under the
            description), so nothing repeats a rendering the model already
            shows moving. */}
        {!isExchange && (
        <figure
          className={`z-0 relative ${
            /* Same margins as every other image/text block on the page, in
               the panel or out of it — the hero used to go edge-to-edge
               specifically inside the panel (to avoid a double-border look
               against that frame), but that just made it read as a
               different, cropped-in version of the same photo depending on
               how you got to the project. Consistent now. */
            isPortraitHero ? "px-6 md:px-0" : "px-6 md:px-12 lg:px-16"
          } ${
            /* Several of these header photos have their own dead space baked
               into the top of the file itself — stage rigging/headroom above
               the set, or a dark gallery backdrop around a model — which,
               now that the gap below the subtitle is tight, was pushing the
               actual photo content too far down the page. Pulling the image
               up by a share of its own rendered width (not a fixed px value,
               so it scales with viewport) tucks that dead space in behind
               the title/subtitle instead. figure is z-0 and the title block
               above it is z-10, so the overlap reads as the image sitting
               behind the text, not on top of it. Magnitudes are graduated by
               how much of each photo is genuinely empty at the top.

               YCTIWY, Anne Frank and Reshuffling are non-portrait heroes, so
               their height is capped (max-h-[70svh]/[75svh], below) on a
               wide-but-short screen — width keeps growing there while
               rendered height stays flat, so a plain width-based percentage
               overshoots once that cap is active and starts eating into real
               photo content, not just the dead space above it. min() caps
               the pull at a share of the viewport's height too, so it backs
               off to whichever is smaller once the image stops growing with
               the viewport width. Staging is still a portrait hero (no
               height cap at any width), so a plain width percentage is safe
               for it. */
            isYctiwy
              ? "mt-[calc(-1*min(18%,10svh))]"
              : isReshuffling
                ? "mt-[calc(-1*min(14%,9svh))]"
                : isStaging
                  ? "-mt-[8%]"
                  : isAnneFrank
                    ? "mt-[calc(-1*min(5%,3svh))]"
                    : isFieldHouse
                      ? /* Field House's background flips from black to white
                           right at this image (light-zone above) — the
                           universal tight subtitle-to-hero gap read as an
                           abrupt cut straight from the black title text into
                           the photo with no breathing room. A little extra
                           top space here lets that transition read as
                           deliberate. */
                        "mt-8 md:mt-10"
                      : "mt-0"
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
                /* Full-width heroes render at whatever height their natural
                   aspect ratio produces at the page's content width — fine
                   at ordinary desktop widths, but on a very wide monitor
                   that width alone can push the image past 900-1000px tall,
                   reading as oversized rather than "prominent." Capped to a
                   share of the viewport's own height so it scales down on
                   short viewports too, instead of just wide ones. Portrait
                   heroes are deliberately tall-and-narrow already (that's
                   the point of that layout) so this is scoped to everyone
                   else. */
                isPortraitHero ? "" : "max-h-[75svh] md:max-h-[70svh]"
              } ${isYctiwy ? "animate-image-drift-up" : mood.enter}`}
            />
          </button>
        </figure>
        )}

      </div>

      {/* Portrait heroes (Townhouse, Staging Aesthetics): description +
          MY ROLE / COLLABORATORS sits beside the image on a wide viewport,
          filling the space a tall hero leaves empty, and stacks below it on
          narrower ones — the grid this sits in (md:grid-cols-[8fr_5fr],
          above) collapses to a single column below md for free. Sized as a
          normal paragraph rather than stretched to match the hero's
          height — it reads as body copy, not a second headline. */}
      {isPortraitHero && (
        <aside className="px-6 md:px-0 pt-8 md:pt-14 pb-4 md:pb-0">
          <div>
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
            >
              {project.description}
            </p>
            <RoleAndCollaborators project={project} />
          </div>
        </aside>
      )}
      </div>

      {/* YCTIWY, True West, Anne Frank — description + MY ROLE /
          COLLABORATORS below the hero, same compact centered info block as
          the other redesigned pages. Each project's existing atmospheric
          line (pullQuote, plus True West's dualityLines) is untouched and
          keeps rendering in its own existing spot farther down the page —
          only the top-of-page description slot changes here. */}
      {(isYctiwy || isTrueWest || isAnneFrank) && (
        <section className="px-6 md:px-12 lg:px-16 pt-6 md:pt-8 pb-2 md:pb-4 text-center">
          <RevealBlock>
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
            >
              {project.description}
            </p>
            <RoleAndCollaborators project={project} />
          </RevealBlock>
        </section>
      )}

      {/* Reshuffling the Deck — description + MY ROLE / COLLABORATORS below
          the hero at every viewport size (it used to sit beside the hero in
          a narrow portrait column; the hero is a normal full-width, height-
          capped image now, see isPortraitHero above). The two painted-
          backdrop stills that used to sit inside that same column are kept,
          just as their own row below the info block instead of stacked
          inside it — preserved, not removed, per the redesign scope. */}
      {isReshuffling && (
        <section className="px-6 md:px-12 lg:px-16 pt-8 md:pt-10 pb-2 md:pb-4">
          <RevealBlock className="text-center">
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
            >
              {project.description}
            </p>
            <RoleAndCollaborators project={project} />
          </RevealBlock>

          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
        </section>
      )}

      {/* Garden of Earthly Delights (tab-renaissance) — description +
          MY ROLE / COLLABORATORS below the hero, same compact info block as
          the other redesigned pages. */}
      {isTab && (
        <section className="px-6 md:px-12 lg:px-16 pt-6 md:pt-8 pb-2 md:pb-4 text-center">
          <RevealBlock>
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
            >
              {project.description}
            </p>
            <RoleAndCollaborators project={project} />
          </RevealBlock>
        </section>
      )}

      {/* TaB: Renaissance — closeup animation, directly under the hero.
          Presented as a moving image rather than an embedded video: no
          controls, no play badge, no poster affordance. It runs once when
          scrolled into view and then holds on its last frame, so for most of
          the time on screen it simply reads as a still. Clicking opens it in
          the lightbox like any other media on the page. */}
      {isTab && (
        <section className="px-6 md:px-12 lg:px-16 pt-2 md:pt-4 pb-4 md:pb-6">
          {/* A straight half-and-half split: the closeup animation fills the
              left half (just under half the page), the longer Bosch/
              marketing passage holds the right half on its own — the text
              column is a fixed half, not sized off the video. That passage
              used to be the back half of the top-of-page description; it's
              its own field now (extendedDescription) so it can sit here,
              beside the imagery it actually explains, without also being
              duplicated in the short intro above. */}
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

            <div className="mt-6 md:mt-0">
              <RevealBlock>
                <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
                  {italicizePhrase(project.extendedDescription ?? "", "The Garden of Earthly Delights")}
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

      {/* Field House — the project blurb sits directly under the hero image,
          at the same size and weight as the descriptive lines on True West /
          YCTIWU. Its own media[0] caption (which repeated this text with an
          "01 — " index) was dropped, and it's skipped in the generic
          description section below, so it shows here once. */}
      {isFieldHouse && (
        <section className="px-6 md:px-12 lg:px-16 pt-8 md:pt-10 pb-2 md:pb-4">
          <RevealBlock>
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-xl md:text-3xl leading-snug text-balance max-w-4xl"
            >
              {project.description}
            </p>
            <RoleAndCollaborators project={project} />
          </RevealBlock>
        </section>
      )}

      {/* Exchange Facility — only the first half of the description sits
          under the title; the model (full-bleed, directly below) is meant
          to be visible right away rather than sitting under a tall block of
          text. The second half moves below the model, just before the
          static renderings — see the block right before the media gallery.
          Skipped in the generic description+credits band further down so
          it doesn't repeat. */}
      {isExchange && (
        <section className="px-6 md:px-12 lg:px-16 pt-6 md:pt-8 pb-2 md:pb-4">
          <RevealBlock>
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-base md:text-lg leading-snug tracking-tight text-balance max-w-2xl"
            >
              {splitAt(
                project.description,
                "The Exchange facility enables the systemic circulation",
              )[0]}
            </p>
            <RoleAndCollaborators project={project} />
          </RevealBlock>
        </section>
      )}
      {/* The closing half of the description now lives inside the model
          itself (the "Entire Facility" view's own bottom-left overlay)
          rather than a separate section here — removing that section
          brings the static renderings up sooner. */}
      {isExchange && (
        <ExchangeViewer
          description={
            splitAt(
              project.description,
              "The Exchange facility enables the systemic circulation",
            )[1]
          }
        />
      )}

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

      {/* Lollapalooza — record-player scroll-controlled 3D, full-bleed background
          with the project blurb pinned in the black space beside it (desktop). */}
      {isLollapalooza && (
        <div ref={recordScrubWrapperRef} className="relative w-full h-[400vh] lolla-bg" data-record-player-section>
          {/* svh, not vh: on a phone the sticky frame must fit the space that's
              actually visible with the address bar showing, or its bottom is cut
              off. vh measures the tall viewport the bar is hidden in. */}
          <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
            <RecordPlayerViewer wrapperRef={recordScrubWrapperRef} onProgress={updateRecordCaption} />
            {/* Desktop only: the blurb, pinned mid-height in the black space to
                the right of the record player. It's inside the sticky frame, so
                it holds its spot for the whole scrub; opacity is driven by
                scroll progress (see recordCaptionRef above) so it fades in just
                after the animation starts and then stays. */}
            <p
              ref={recordCaptionRef}
              style={{ opacity: 0 }}
              className="record-player-caption hidden md:block absolute left-[60%] top-[46%] max-w-[30rem] -translate-y-1/2 font-display font-light text-xl lg:text-2xl leading-snug tracking-tight text-white"
            >
              {project.extendedDescription}
            </p>
          </div>
        </div>
      )}

      {/* Description + credits — skipped on portrait-hero pages, where both
          already appear in the column beside the hero, and on TaB, where both
          now sit up beside the closeup animation. Field House renders its
          blurb directly under the hero (above) and has no credits, so the
          whole band is skipped for it rather than sitting empty. Lollapalooza
          likewise: its blurb is pinned on the record-player animation and its
          credits sit up by the hero, so nothing is left for this band.
          Reshuffling has its own info block directly below the hero (above)
          now that it's no longer a portrait hero — skipped here too, or it
          would render twice. YCTIWY, True West and Anne Frank each have
          their own info block below the hero too now — skipped here for
          the same reason. */}
      {!isPortraitHero && !isTab && !isFieldHouse && !isLollapalooza && !isExchange && !isRagsToRiches && !isReshuffling && !isYctiwy && !isTrueWest && !isAnneFrank && (
      <section className="px-6 md:px-12 lg:px-16 py-6 md:py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <RevealBlock>
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
            >
              {project.description}
            </p>
          </RevealBlock>
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

      {/* Rags to Riches — description + MY ROLE / COLLABORATORS below the
          hero, same compact info block as the other redesigned pages. The
          photo-op sentence that used to be the back half of this same
          description now moves to the blurb beside the honky-tonk photo
          directly below, where it's actually about the pictured image. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 pt-6 md:pt-8 pb-2 md:pb-4 text-center">
          <RevealBlock>
            <p
              data-design-id={designId.projectDescription(project.slug)}
              data-design-kind="text"
              className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance"
            >
              {project.description}
            </p>
            <RoleAndCollaborators project={project} />
          </RevealBlock>
        </section>
      )}

      {/* Rags to Riches — first blurb beside the honky-tonk photo op,
          directly under the hero. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 md:items-start">
            <RevealBlock>
              <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
                A country music photo op — complete with an Opry-style ribbon
                microphone — nods to the city's honky-tonk culture.
              </p>
            </RevealBlock>
            <RevealBlock delay={0.1}>
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(1)}
                  className="block w-full overflow-hidden rounded-md bg-secondary"
                  aria-label={project.media[1].caption ?? project.title}
                >
                  <img
                    data-design-id={designId.projectMedia(project.slug, project.media[1].id ?? "1")}
                    data-design-kind="image"
                    src={project.media[1].src}
                    alt={project.media[1].caption ?? project.title}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                  />
                </button>
              </figure>
            </RevealBlock>
          </div>
        </section>
      )}

      {/* Rags to Riches — second blurb, continuing the story, centered in
          the gap between the honky-tonk photo and the closing image. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 py-6 md:py-8">
          <RevealBlock>
            <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance text-center">
              At the "Rags to Riches" country carnival, every game revolves
              around luck and money. The main attraction: a blinged-out,
              Zoltar-inspired "Cash Cow" dispenses your financial fortunes.
            </p>
          </RevealBlock>
        </section>
      )}

      {/* Rags to Riches — full-width closing-transition image, below the
          second blurb. Same margins as the sections above/below it so its
          edges line up with the Country Close and Cash Cow images. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 py-6 md:py-8">
          <RevealBlock>
            <figure className="group">
              <button
                type="button"
                onClick={() => setLightbox(3)}
                className="block w-full overflow-hidden rounded-md bg-secondary"
                aria-label={project.media[3].caption ?? project.title}
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
          </RevealBlock>
        </section>
      )}

      {/* Rags to Riches — Cash Cow, left half of a two-photo row, now the
          closing section. The right half is reserved for a second image Reid
          plans to drop in later. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
            <RevealBlock>
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(2)}
                  className="block w-full overflow-hidden rounded-md bg-secondary"
                  aria-label={project.media[2].caption ?? project.title}
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
            </RevealBlock>
            {/* Reserved for the second image — currently empty. */}
            <div />
          </div>
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
              className="font-display font-light text-xl md:text-3xl leading-snug text-balance max-w-4xl"
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
              <blockquote className="mt-10 md:mt-12 max-w-4xl space-y-2 font-display font-light text-xl md:text-3xl leading-snug text-balance">
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
          {project.extendedDescription && (
            <section className="px-6 md:px-12 lg:px-16 pt-8 md:pt-10">
              <RevealBlock>
                <p
                  data-design-kind="text"
                  className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance max-w-3xl"
                >
                  {project.extendedDescription}
                </p>
              </RevealBlock>
            </section>
          )}

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
                <p className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide leading-relaxed">
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
      {isTownhouse && <TownhouseViewer />}
      {isLollapalooza && <LollaViewer />}
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
             closeup right (dropped lower). Lower band — the two technical
             drawings side by side, each independently clickable but sharing
             a row so they read as a matched pair. The caption that used to
             sit under the sketch (the same text as the old description) now
             lives in `pullQuote`, rendered once via the shared pull-quote
             section instead of duplicated here. */
          <div className="space-y-10 md:space-y-16">
            {/* Back to an even split — the wider 5fr/9fr run made the photo
                read too large against the sketch. Sketch and photo still
                fade in from opposite sides (RevealBlock's `from` prop) on
                scroll into view; only the column proportions changed. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 lg:gap-14 md:items-start">
              {/* Left: sketch, then the description beneath it */}
              <div className="md:pt-4">
                <RevealBlock from="left">
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
                        className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                      />
                    </button>
                  </figure>
                </RevealBlock>
              </div>

              {/* Right: kitchen closeup, dropped lower than the sketch */}
              <RevealBlock from="right" className="md:mt-24 lg:mt-32">
                <figure className="group">
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
                      className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                    />
                  </button>
                </figure>
              </RevealBlock>
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
          // Custom Townhouse layout: the longer passage (the top-of-page
          // description stays short) sits directly above this imagery, then
          // the axonometric upright on the left, the three renders stacked
          // as a column on the right — nothing else follows it. The axon is
          // shown at its own natural proportions (w-full h-auto, no
          // object-cover and no fixed aspect-ratio box), so it can never be
          // cropped whatever the file's real dimensions. The 19/10 column
          // split is tuned so the portrait axon renders about as tall as the
          // three stacked squares beside it — it fills the row rather than
          // ending short and leaving black beside the lower renders.
          // items-start keeps both columns starting on the same line.
          <>
          {project.extendedDescription && (
            <RevealBlock>
              <p
                data-design-kind="text"
                className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance max-w-3xl mb-8 md:mb-10"
              >
                {project.extendedDescription}
              </p>
            </RevealBlock>
          )}
          <div className="grid grid-cols-1 md:grid-cols-[19fr_10fr] gap-6 md:gap-10 md:items-start">
            {!project.media[0]?.hidden && (
              <figure className="group overflow-hidden rounded-md lg:mt-[150px]">
                <button
                  type="button"
                  onClick={() => setLightbox(0)}
                  className="block w-full"
                  aria-label={project.media[0].caption ?? "Axonometric"}
                >
                  <img
                    data-design-id={designId.projectMedia(project.slug, project.media[0].id ?? "0")}
                    data-design-kind="image"
                    src={project.media[0].src}
                    alt={project.media[0].caption ?? project.title}
                    loading="lazy"
                    /* Real desktop only (lg+): the axon runs narrower than its
                       column and nudged slightly, a composition tuned at wide
                       viewports. A Design Mode edit used to apply this from
                       768px up — the same threshold tablet shares with real
                       desktop — so the tablet-width column (much narrower
                       than what this was tuned against) got the same 150px
                       drop and 66% shrink and the axon read as missing,
                       stranded well below the renders beside it. lg-gating it
                       here, the way the TaB hero's stray offset was fixed,
                       keeps tablet at its natural full-width/no-shift layout. */
                    className="w-full h-auto lg:w-[66%] lg:translate-x-[2px] lg:-translate-y-[10px] group-hover:scale-[1.03] transition-transform duration-700 ease-cinematic"
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
                      {project.media[idx].caption && (
                        <figcaption
                          data-design-id={designId.projectMediaCaption(project.slug, project.media[idx].id ?? String(idx))}
                          data-design-kind="text"
                          className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide leading-relaxed text-right"
                        >
                          {project.media[idx].caption}
                        </figcaption>
                      )}
                    </figure>
                  ),
              )}
            </div>
          </div>
          </>
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
                    className="block w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
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
                    <figcaption
                      className={`mt-3 text-xs md:text-sm text-foreground/60 tracking-wide leading-relaxed ${
                        // Field House and Exchange match the plain, un-numbered,
                        // right-aligned caption style established on Townhouse —
                        // the numbered "01 — " prefix is this generic gallery's
                        // own default, not something every project should carry.
                        isFieldHouse || isExchange ? "text-right" : ""
                      }`}
                    >
                      {!m.addedByDesignMode && !isFieldHouse && !isExchange && `${String(i + 1).padStart(2, "0")} — `}
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
        <section className="px-6 md:px-12 lg:px-16 pt-10">
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
              accentColor={project.accentColor}
              thumbnails={lollapaloozaDraftingMedia.map(({ item }) => item.src)}
              renderSlide={(i, ctrl) => {
                const { item: m } = lollapaloozaDraftingMedia[i];
                return (
                  /* The white sheet wraps only the drawing (plus a thin
                     mount) and sits centred, so the page's black shows down
                     both sides. Not clickable — these read fine at this size
                     and there's no isolated view to open. Arrows sit just off
                     the card's edges and only render for the active slide.

                     Every sheet renders at one fixed height so the frame is
                     the same on every slide — the wider sheets used to hit the
                     max-width cap first and come out shorter, leaving a gap
                     above the thumbnail strip. The height is low enough that
                     even the widest sheet stays under the width cap, so
                     nothing crops; where a sheet is a touch narrower than the
                     box it just gets white margins, invisible on the white
                     card. */
                  <div className="flex w-full justify-center pt-4 pb-2">
                    <div className="relative">
                      <div className="flex items-center justify-center rounded-xl bg-white p-3 shadow-lg">
                        <img
                          data-design-id={designId.projectMedia(project.slug, m.id!)}
                          data-design-kind="image"
                          src={m.src}
                          alt={m.caption ?? project.title}
                          loading="lazy"
                          className="block h-[min(600px,64vh)] w-auto max-w-[min(1000px,84vw)] object-contain"
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
          don't, since there's nothing extra to see.

          Off (SHOW_LOLLAPALOOZA_PHOTO_CAROUSEL) — the scrolling band up by the
          title carries these same photos now. */}
      {SHOW_LOLLAPALOOZA_PHOTO_CAROUSEL && isLollapalooza && lollapaloozaGalleryMedia.length > 0 && (
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

      </div>{/* end light-zone */}

      {/* Every other project, as a flowing block of titles — the pattern on
          brycrasch.com/jack at the foot of each project page. The point is
          exactly what Reid asked for: someone who scrolls to the end of one
          project lands on more ways to keep browsing instead of a dead stop,
          so they keep moving through the site rather than leaving it. Gray
          by default, full white on hover (this site's --foreground, not
          Bry's own styling — only the behavior is borrowed), thin weight to
          match the "| creative designer" tagline rather than the bold
          headings elsewhere on the page. A "|" between each title (same
          mark as the tagline's) rather than a bare gap, so two adjacent
          titles don't visually run together into one phrase. "All Projects"
          leads the list — no separate discipline-filter pills here, just
          the names, in the same wording as the "← All Projects" link above.
          Kept outside the light-zone div above so it always reads on the
          dark theme.

          Unlike the Back/Next section above, this one is NOT suppressed in
          the panel — the panel is desktop-only, so this is the one place
          most visitors actually reach the end of a project, and hiding it
          there meant almost nobody ever saw it. `target="_top"` (same escape
          hatch the hub-tag pill above uses) breaks each link out of the
          iframe so it navigates the real window instead of nesting a page
          inside the panel already open one level up.

          From inside the panel, a project link goes to `/?project=<slug>` —
          the same search param the homepage grid uses to open the panel —
          rather than straight to `/work/$hub/$slug`. Landing on the bare
          full page there was the actual bug reported: it swapped the
          tinted, panel-framed view for a plain page with no accent gradient
          around it, so clicking a title through this list looked like a
          different, broken version of the project instead of the same
          panel simply switching which project it's showing. */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24 border-t border-border">
          <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-3 font-display font-thin uppercase tracking-tight text-xl md:text-3xl leading-tight text-center">
            {[
              { slug: "__home", title: "All Projects", to: "/" as const },
              ...PROJECTS.filter((p) => p.tags && p.tags.length > 0),
            ].map((p, i) => (
              <span key={p.slug} className="flex items-baseline gap-x-3">
                {i > 0 && <span className="text-foreground/25" aria-hidden>|</span>}
                {"to" in p ? (
                  <Link
                    to={p.to}
                    target={panel ? "_top" : undefined}
                    className="text-foreground/40 hover:text-foreground transition-colors"
                  >
                    {p.title}
                  </Link>
                ) : panel ? (
                  <Link
                    to="/"
                    search={{ project: p.slug }}
                    target="_top"
                    className="text-foreground/40 hover:text-foreground transition-colors"
                  >
                    {p.title}
                  </Link>
                ) : (
                  <Link
                    to="/work/$hub/$slug"
                    params={{ hub: p.hub, slug: p.slug }}
                    className="text-foreground/40 hover:text-foreground transition-colors"
                  >
                    {p.title}
                  </Link>
                )}
              </span>
            ))}
          </div>
      </section>

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
