import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useFitText } from "@/hooks/use-fit-text";
import { AnimatePresence, motion } from "motion/react";
import { SiteNav } from "@/components/site-nav";
import { RecordPlayerViewer } from "@/components/record-player-viewer";
import { AnimatedHeading, RevealBlock } from "@/components/animated-text";
import { BackChevron, CloseMark, glassButton, trackSheen } from "@/components/glass-button";
import { formatTag } from "@/components/discipline-filter-pills";
import { LightboxVideo } from "@/components/lightbox-video";
import { SwipeGallery } from "@/components/swipe-gallery";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import { FramerCarousel } from "@/components/ui/framer-carousel";
import { ExchangeViewer } from "@/components/exchange-viewer";
import { LollaViewer } from "@/components/lolla-viewer";
import { LollaRenderCarousel } from "@/components/lolla-render-carousel";
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
  // "Collaborator" doesn't fit an academic advisor — on pages where every
  // remaining credit is some flavor of advisor, drop the label and just
  // list the role(s) plainly instead.
  const allAdvisors = collaborators.length > 0 && collaborators.every((c) => /advisor/i.test(c.role));
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
          {!allAdvisors && <span className="text-foreground/50">COLLABORATORS: </span>}
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

/* ── Standard project intro (trial, localhost mockups only) ──
   One fixed order for every project's opening info:
   tags → title → subtitle → description → my role → collaborators.

   Two arrangements of the same content:
   - "center": the hero photo runs full-bleed across the top and the
     intro sits below it in one centered column (Garden of Earthly
     Delights, You Can't Take It With You).
   - "split": for tall portrait heroes (Reshuffling the Deck; later
     Townhouse / Staging Aesthetics). The photo holds the left of the
     screen, bleeding off the left and top edges, and the intro sits
     beside it, left-aligned and vertically centered. Below `md` it
     collapses to the same stacked, centered layout as "center".

   Keeps the site's type rules: all-caps title, caps subtitle and credits,
   the standard glass tag pills. Typeface is General Sans (self-hosted, see
   styles.css), applied page-wide by the server-rendered `.intro-font` class,
   which also sets the per-element weight variables. The `.intro-trial` wrapper cancels any old visual-editor
   nudges on these elements (see styles.css) — they were tuned for the
   previous layout. */
const INTRO_TRIAL_SLUGS = new Set(["tab-renaissance", "you-cant-take-it-with-you", "reshuffling-the-deck"]);

type IntroAlign = "center" | "split";

/* Subtitle and description share a size and weight (16/20/24px, Regular).
   The subtitle is all caps and grey; the description is in sentence case,
   white, with more open leading since lowercase needs more room between
   lines than caps. Both trimmed to cap height and baseline so the margins
   between blocks are the visible gaps. */
const introStatementBase =
  "text-base md:text-xl lg:text-2xl text-balance [text-box:trim-both_cap_alphabetic]";
const introSubtitleType = `${introStatementBase} uppercase leading-[1.3] tracking-[0.02em]`;
const introDescriptionType = `${introStatementBase} leading-[1.45]`;

/* The breathing room above and below the description (subtitle →
   description, description → credits): 48 / 64 / 128px. */
const introDescriptionGap = "mt-12 md:mt-16 lg:mt-32";

const introColumn = (align: IntroAlign) =>
  align === "center" ? "mx-auto max-w-6xl text-center" : "text-center md:text-left";

/* General Sans Semibold advance widths (em, uppercase + digits + common
   punctuation), measured from the self-hosted font. Lets the server work out
   how wide a title will set, so a one-line title can be sized in CSS before
   anything loads. */
const GENERAL_SANS_600_ADVANCE: Record<string, number> = {
  A: 0.73, B: 0.647, C: 0.786, D: 0.727, E: 0.601, F: 0.568, G: 0.796, H: 0.763, I: 0.299,
  J: 0.624, K: 0.68, L: 0.568, M: 0.928, N: 0.765, O: 0.799, P: 0.652, Q: 0.799, R: 0.685,
  S: 0.663, T: 0.639, U: 0.734, V: 0.7, W: 0.97, X: 0.716, Y: 0.674, Z: 0.644,
  "0": 0.614, "1": 0.359, "2": 0.558, "3": 0.577, "4": 0.595, "5": 0.571, "6": 0.577,
  "7": 0.514, "8": 0.592, "9": 0.577,
  " ": 0.209, "!": 0.287, "?": 0.518, "&": 0.693, "'": 0.256, "’": 0.27, ".": 0.263,
  ",": 0.263, ":": 0.263, ";": 0.263, "-": 0.36, "–": 0.5, "—": 0.75, "/": 0.505,
  "+": 0.66, "@": 0.975, "(": 0.318, ")": 0.318,
};

/** Width of an all-caps title in General Sans Semibold at the title's
 *  -0.03em tracking, in ems — with 2% headroom for kerning and rounding. */
function titleEms(text: string) {
  let ems = 0;
  for (const ch of text.toUpperCase()) ems += (GENERAL_SANS_600_ADVANCE[ch] ?? 0.7) - 0.03;
  return ems * 1.02;
}

function IntroHeader({ project, panel, align }: { project: Project; panel: boolean; align: IntroAlign }) {
  return (
    <div className={`intro-trial ${align === "center" ? "mx-auto text-center" : introColumn(align)}`}>
      {project.tags && project.tags.length > 0 && (
        /* The site's standard glass pills, minus the `quiet` dimming so the
           label sits at full white. */
        <div
          className={`mb-4 lg:mb-5 flex flex-wrap gap-2 justify-center animate-intro-tags motion-reduce:animate-none ${align === "split" ? "md:justify-start" : ""}`}
        >
          {project.tags.map((t: ProjectTag) => (
            <Link
              key={t}
              to="/work"
              search={{ tag: t }}
              target={panel ? "_top" : undefined}
              onMouseMove={trackSheen}
              className={`pointer-events-auto hub-tag-pill text-[10px] lg:text-[13px] leading-none py-[0.7em] pl-[1.15em] pr-[1.01em] border-white/25 hover:border-white/40 ${glassButton({
                sheen: true,
              })}`}
              style={{ fontWeight: "var(--intro-tags-w, 200)", borderWidth: "1px" }}
            >
              {formatTag(t)}
            </Link>
          ))}
        </div>
      )}

      {/* Centered layout: on a wide screen the title holds to one line and is
          sized in CSS to fill the column (see .intro-title-center), so
          nothing re-measures it after load. The wrapper is the size
          container its `cqi` units read, and carries the title's width in
          ems. Phones and tablets still wrap at full size. The split
          layout's column is too narrow for one line, so it keeps wrapping. */}
      <div
        data-design-id={designId.projectTitle(project.slug)}
        data-design-kind="heading"
        className="[container-type:inline-size]"
        style={
          {
            "--title-ems": titleEms(project.title).toFixed(3),
            "--word-ems": Math.max(...project.title.split(" ").map(titleEms)).toFixed(3),
          } as CSSProperties
        }
      >
        <AnimatedHeading
          text={project.title}
          fit
          playOnLoad
          className={`intro-title ${
            align === "center" ? "intro-title-center lg:whitespace-nowrap" : "intro-title-split"
          } [font-weight:var(--intro-title-w,700)] [text-box:trim-both_cap_alphabetic] uppercase leading-[0.95] lg:leading-[0.9] tracking-[-0.03em] text-balance`}
        />
      </div>
      <p
        data-design-id={designId.projectSubtitle(project.slug)}
        data-design-kind="text"
        className={`mt-[14px] ${align === "center" ? "mx-auto max-w-6xl" : ""} ${introSubtitleType} text-foreground/55 animate-intro-subtitle motion-reduce:animate-none`}
        style={{ fontWeight: "var(--intro-description-w, 400)" }}
      >
        {project.subtitle}
      </p>
    </div>
  );
}

/* Credits: MY ROLE and COLLABORATORS, each a small grey label over its
   credit, left-aligned. Side by side on a wide "center" layout so the two
   read as peers and the block stays short; stacked (tight gap) on narrow
   screens and in the narrow "split" column. MY ROLE leads (first, white, a
   touch heavier); collaborators sit at nearly the same size, just softer. */
const creditLabel = "text-[10px] lg:text-[13px] tracking-[0.18em] text-foreground/50 [text-box:trim-start_cap_alphabetic]";
const creditRole = "text-[10px] lg:text-[13px] tracking-[0.12em] text-foreground font-medium";
const creditCollab = "text-[10px] lg:text-[13px] leading-relaxed tracking-[0.12em] text-foreground/70";

function IntroCredits({ project, align }: { project: Project; align: IntroAlign }) {
  const credits = (project.credits ?? []).filter((c) => !c.hidden);
  const myRole = credits.find((c) => c.name === "Reid Graham");
  const collaborators = credits.filter((c) => c.name !== "Reid Graham");
  if (!myRole && collaborators.length === 0) return null;
  // A lone advisor/director reads better as their own label than under
  // "COLLABORATORS" — same rule the old credits block used for advisors.
  const collabLabel = collaborators.length === 1 ? collaborators[0].role : "Collaborators";

  return (
    <div
      className={`text-left uppercase grid gap-y-3 ${
        align === "center" ? "mx-auto max-w-6xl md:grid-cols-[auto_1fr] md:gap-x-14" : ""
      }`}
    >
      {myRole && (
        <div>
          <p className={creditLabel}>My role</p>
          <p className={`mt-1 ${creditRole}`}>{myRole.role}</p>
        </div>
      )}
      {collaborators.length > 0 && (
        <div>
          <p className={creditLabel}>{collabLabel}</p>
          <p className={`mt-1 ${creditCollab}`}>
            {collaborators.length === 1 ? (
              <span className="text-foreground/90">{collaborators[0].name}</span>
            ) : (
              collaborators.map((c, i) => (
                <span key={c.role}>
                  {i > 0 && <span className="mx-2 text-foreground/30">·</span>}
                  <span className="text-foreground/90">{c.name}</span>, {c.role}
                </span>
              ))
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/* Everything after the header: the description, then the credits. */
function IntroBody({ project, align }: { project: Project; align: IntroAlign }) {
  return (
    <RevealBlock className="intro-trial">
      <div className={introColumn(align)}>
        <p
          data-design-id={designId.projectDescription(project.slug)}
          data-design-kind="text"
          className={introDescriptionType}
          style={{ fontWeight: "var(--intro-description-w, 400)" }}
        >
          {project.description}
        </p>
      </div>
      <div className={introDescriptionGap}>
        <IntroCredits project={project} align={align} />
      </div>
    </RevealBlock>
  );
}

/* Localhost-only tab strip for flipping between the intro mockups. Plain
   links (not router Links) so each page loads fresh; keeps `?panel=1` when
   browsing inside the project panel's frame. */
const INTRO_MOCKUPS: [string, string][] = [
  ["tab-renaissance", "Garden of Earthly Delights"],
  ["you-cant-take-it-with-you", "You Can't Take It With You!"],
  ["reshuffling-the-deck", "Reshuffling the Deck"],
];

const trialPill = "fixed left-4 z-[200] flex flex-wrap items-center gap-1 rounded-full border border-white/20 bg-black/85 p-1 text-[11px] text-white backdrop-blur";
const trialOption = (active: boolean) =>
  `rounded-full px-3 py-1 ${active ? "bg-white text-black" : "hover:bg-white/15"}`;

function IntroMockupTabs({ current, hub, panel }: { current: string; hub: string; panel: boolean }) {
  if (!import.meta.env.DEV) return null;
  return (
    <>
      <div className={`${trialPill} bottom-4`}>
        <span className="px-2 uppercase tracking-[0.15em] text-white/50">Mockup</span>
        {INTRO_MOCKUPS.map(([slug, label]) => (
          <a
            key={slug}
            href={`/work/${hub}/${slug}${panel ? "?panel=1" : ""}`}
            className={trialOption(current === slug)}
          >
            {label}
          </a>
        ))}
      </div>
    </>
  );
}

/** The hover cue on a silent inline video — tells a visitor this is where
 *  to click for the real, full-sound experience in the lightbox. Drawn
 *  rather than a glyph, to match BackChevron / CloseMark. */
function ExpandIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4" />
    </svg>
  );
}

function ProjectPage() {
  /* TanStack Router reuses this same component instance across a slug
     change (Lollapalooza -> True West, say) rather than remounting it —
     only props/loader data update. CSS entrances that only play "on mount"
     (animate-slide-from-left/right, the True West dual-image grid) don't
     replay, and for a page whose structure differs a lot from whatever was
     open a moment ago, the previous page's DOM briefly sits there in the
     new page's place before React finishes reconciling it — the "wrong
     layout for an instant" flash. Keying on the slug forces a real
     unmount/remount on every project change, so each page always starts
     from a clean first paint. */
  const { slug } = Route.useParams();
  return <ProjectPageInner key={slug} />;
}

function ProjectPageInner() {
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

  /* The hero photo (`project.cover`) is a separate field from `project.media`
     — most projects never put it in the array at all, so it never showed up
     in the lightbox's arrow navigation, and clicking the hero itself opened
     whatever real `media[0]` happened to be instead of the hero. Appending
     it here (once, only if it isn't already `media[0]` the way tab-renaissance
     deliberately does it) gives it a real slot in the count and the arrows
     without duplicating it in the on-page gallery grid — that grid already
     skips anything `hidden`. Every other hardcoded `media[N]` reference on
     this page is untouched: appending at the end never shifts an existing
     index. */
  const lightboxMedia =
    project.media.some((m) => m.src === project.cover)
      ? project.media
      : [...project.media, { type: "image" as const, src: project.cover, caption: project.title, hidden: true }];
  const heroLightboxIndex = lightboxMedia.findIndex((m) => m.src === project.cover);

  const [lightbox, setLightbox] = useState<number | null>(null);
  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) => {
      setLightbox((cur) => {
        if (cur == null) return cur;
        const n = lightboxMedia.length;
        return (cur + delta + n) % n;
      });
    },
    [lightboxMedia.length],
  );

  /* Which way the cross-fade slides — derived from whichever index the
     lightbox last held, not just from the arrows. A straight thumbnail
     click to a different photo while one is already open slides the same
     sensible direction (toward wherever that photo sits in the sequence)
     without every one of the many setLightbox(N) call sites needing to
     know or report a direction themselves. */
  const prevLightboxRef = useRef<number | null>(null);
  const [lightboxDirection, setLightboxDirection] = useState(1);
  useEffect(() => {
    const prev = prevLightboxRef.current;
    if (lightbox != null && prev != null && prev !== lightbox) {
      setLightboxDirection(lightbox > prev ? 1 : -1);
    }
    prevLightboxRef.current = lightbox;
  }, [lightbox]);

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
  // Intro trial (localhost mockups): hero first, standard intro, General Sans.
  const introTrial = INTRO_TRIAL_SLUGS.has(project.slug);
  const introSplit = introTrial && project.heroPortrait === true;
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
      }${introTrial ? " intro-font" : ""}`}
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

      {/* Intro trial: fetch General Sans with the page HTML rather than
          when the stylesheet first asks for it, so the title's first paint
          is already in the right face. React hoists this into <head>. */}
      {introTrial && (
        <link
          rel="preload"
          href="/fonts/general-sans-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      )}
      {!panel && (
        <div data-design-protected="Protected navigation">
          <SiteNav variant={(isLollapalooza && scrubInView) || introTrial ? "top-transparent" : "top"} />
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
          <div
            className={
              /* Image-first trial: floats over the full-bleed hero instead
                 of pushing it down. */
              introTrial
                ? "hidden md:block absolute left-0 top-0 z-20 px-12 lg:px-16 pt-24"
                : "hidden md:block px-12 lg:px-16 pt-32"
            }
          >
            {backLink}
          </div>
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
          image + description grid below is unaffected either way.

          Garden of Earthly Delights is trialling an image-first template:
          hero on top, then title/subtitle, then the description block. A
          flex column with order-first on the hero grid swaps the two without
          duplicating either block. */}
      <div className={introTrial ? "flex flex-col" : undefined}>
      {introTrial && !introSplit && (
        <>
          <div className="relative z-10 order-2 px-6 md:px-12 lg:px-16 pt-4 lg:pt-5">
            <IntroHeader project={project} panel={!!panel} align="center" />
          </div>
          <div className="order-3 px-6 md:px-12 lg:px-16 pt-12 md:pt-16 lg:pt-32 pb-14 md:pb-20">
            <IntroBody project={project} align="center" />
          </div>
        </>
      )}
      {introTrial && (
        <IntroMockupTabs
          current={project.slug}
          hub={project.hub}
          panel={!!panel}
        />
      )}
      {!introTrial && (
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
                    {formatTag(t)}
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
      )}

      {/* Hero image (+ description, for portrait heroes) — the grid this
          used to share with the title. Now it only holds the image itself
          (and, for the portrait layout, the description beside it), so its
          8fr/5fr split no longer constrains how wide the title above it can
          run. */}
      <div
        className={`${
          introSplit
            ? "relative md:grid md:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] md:items-start md:gap-10 lg:gap-16 md:pr-12 lg:pr-16"
            : isPortraitHero
            ? "relative md:grid md:grid-cols-[8fr_5fr] md:gap-8 lg:gap-12 md:px-12 lg:px-16"
            : "relative"
        }${
          /* Field House: the light theme used for the rest of its body (see
             the light-zone wrapper further down) starts here instead, right
             at the hero, so the page's black only reads as a band behind the
             nav/title and doesn't run down behind the photo too.

             bg-background + a real padding-top (not the figure's own margin
             below) is what actually paints that transition white: a margin
             on the figure collapses through this wrapper since nothing else
             separates them, so the gap it made was rendering as the page's
             plain black, not the light zone's white — which is why the hero
             read as pressed straight against the black title block instead
             of eased into it. */
          isFieldHouse ? " light-zone bg-background pt-6 md:pt-8" : ""
        }${
          /* Image-first trial (Garden of Earthly Delights): move the hero
             above the title, flush to the top edge of the window/panel. */
          introTrial ? " order-1" : ""
        }`}
      >
      <div
        className="relative"
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
            introTrial
              ? "px-0" /* intro trial: edge to edge (split: bleeds off the left) */
              : isPortraitHero ? "px-6 md:px-0" : "px-6 md:px-12 lg:px-16"
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

               YCTIWY, Anne Frank and True West are non-portrait heroes, so
               their height is capped (max-h-[70svh]/[75svh], below) on a
               wide-but-short screen — width keeps growing there while
               rendered height stays flat, so a plain width-based percentage
               overshoots once that cap is active and starts eating into
               real photo content, not just the dead space above it. min()
               caps the pull at a share of the viewport's height too, so it
               backs off to whichever is smaller once the image stops
               growing with the viewport width. Reshuffling and Staging are
               portrait heroes (no height cap at any width), so a plain
               width percentage is safe for them. */
            introTrial
              ? "mt-0" /* intro trial: the hero starts flush at the top */
              : isYctiwy
              ? "mt-[calc(-1*min(18%,10svh))]"
              : isReshuffling
                ? "-mt-[14%]"
                : isStaging
                  ? "-mt-[8%]"
                  : isAnneFrank
                    ? "mt-[calc(-1*min(5%,3svh))]"
                    : isTrueWest
                      ? /* True West's photo has the same kind of stage-
                           rigging headroom at the top of the frame as the
                           other Deerfield/Newman/Duderstadt stage photos
                           above — it just hadn't been given the same
                           compensation, so the title-to-photo gap read as
                           much bigger than every sibling page. */
                        "mt-[calc(-1*min(7%,8svh))]"
                      : /* Field House's black-to-white transition breathing
                           room now lives as real padding on the light-zone
                           wrapper above (so it actually paints white) —
                           nothing extra needed here. */
                        "mt-0"
          }`}
        >
          {isLollapalooza ? <LollaRenderCarousel /> : <button
            type="button"
            onClick={() => setLightbox(heroLightboxIndex)}
            className={`block w-full h-auto overflow-hidden group ${
              /* The current render is framed tighter around the house than
                 the render it replaced (less sky above, less street below),
                 so at the same width it reads as more zoomed in even though
                 nothing is actually being cropped. Padding the image inside
                 its own box, on the page's own background, gives it back
                 that breathing room without touching the source file. */
              isTownhouse ? "bg-background p-4 md:p-8" : "bg-secondary"
            } ${
              /* On a wide screen the 8fr grid column stretches this well
                 past 900px, reading as oversized against the rest of the
                 page — the title above it, at its own capped size, only
                 ever runs to about 620px. 720px keeps the hero a bit larger
                 than that (its own presence, not identical to the title)
                 without ballooning further just because a wide monitor has
                 the room. Only kicks in at lg — narrower than that the
                 column is already this size or smaller on its own. */
              isTownhouse ? "lg:max-w-[720px]" : ""
            }`}
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
                /* Field House's render is mostly sky (the building sits in
                   the bottom third of the frame) — center object-position,
                   the default, cropped a window that landed entirely in the
                   sky at the capped hero height below, so the building never
                   showed at all. Anchoring the crop to the bottom keeps the
                   building in frame first, cropping away from the sky
                   instead of through the subject. */
                isFieldHouse ? "object-bottom" : ""
              } ${
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
          </button>}
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
      {introSplit && (
        /* Intro trial, split: the standard intro beside the portrait hero.
           Stacks below it (centered) under md, like the "center" layout. */
        <aside className="px-6 md:px-0 pt-4 lg:pt-5 md:py-16 pb-14 md:self-center">
          <IntroHeader project={project} panel={!!panel} align="split" />
          <div className={introDescriptionGap}>
            <IntroBody project={project} align="split" />
          </div>
        </aside>
      )}
      {isPortraitHero && !introSplit && (
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
      </div>

      {/* YCTIWY, True West, Anne Frank — description + MY ROLE /
          COLLABORATORS below the hero, same compact centered info block as
          the other redesigned pages. Each project's existing atmospheric
          line (pullQuote, plus True West's dualityLines) is untouched and
          keeps rendering in its own existing spot farther down the page —
          only the top-of-page description slot changes here. */}
      {(isYctiwy || isTrueWest || isAnneFrank) && !introTrial && (
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
                className="block w-full overflow-hidden bg-secondary md:max-w-[95%]"
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
              className="font-display font-light text-xl md:text-3xl leading-snug text-balance text-center"
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
            {/* The blurb, pinned inside the sticky frame so it holds its spot
                for the whole scrub; opacity is driven by scroll progress (see
                recordCaptionRef above) so it fades in just after the
                animation starts and then stays.

                Desktop (lg+) keeps the original side placement, in the black
                space beside the model's narrow column. Below that the model
                widens to fill the frame (see `.record-player-stage`'s mobile/
                tablet-portrait rules) to avoid leaving empty bands above and
                below it, which no longer leaves room beside it for text — so
                there the model's column is shortened instead to leave a
                dedicated band at the bottom of the frame, and the caption
                moves there with a scrim behind it for legibility over the
                model. */}
            <p
              ref={recordCaptionRef}
              style={{ opacity: 0 }}
              className="record-player-caption absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-8 pt-16 font-display font-light text-sm leading-snug tracking-tight text-white lg:inset-x-auto lg:left-[60%] lg:top-[46%] lg:bottom-auto lg:max-w-[30rem] lg:-translate-y-1/2 lg:bg-none lg:px-0 lg:pb-0 lg:pt-0 lg:text-xl xl:text-2xl"
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
          directly under the hero. Only top padding on this and the next two
          sections — each pair used to carry both a bottom and a top padding,
          which stacked additively into a much looser rhythm than the rest
          of the page (48-64px at every boundary, three times in a row).
          md:items-center (not the default md:items-start) so the caption
          sits centered against the photo's height rather than pinned to
          its top edge. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 pt-6 md:pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 md:items-center">
            <RevealBlock>
              <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
                A photo op that nods to Nashville's honky-tonk culture,
                complete with an Opry-style ribbon microphone.
              </p>
            </RevealBlock>
            <RevealBlock delay={0.1}>
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(1)}
                  className="block w-full overflow-hidden bg-secondary"
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

      {/* Rags to Riches — Cash Cow (the smaller image) paired with the
          "luck and money" blurb beside it, ahead of the wide carnival photo
          now closing the page — Cash Cow used to sit after that closing
          image with this blurb stranded on its own between them. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 pt-6 md:pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 md:items-center">
            <RevealBlock>
              <figure className="group">
                <button
                  type="button"
                  onClick={() => setLightbox(2)}
                  className="block w-full overflow-hidden bg-secondary"
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
            <RevealBlock delay={0.1}>
              <p className="font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance">
                At the "Rags to Riches" country carnival, every game revolves
                around luck and money. The main attraction: a blinged-out,
                Zoltar-inspired "Cash Cow" dispenses your financial fortunes.
              </p>
            </RevealBlock>
          </div>
        </section>
      )}

      {/* Rags to Riches — full-width closing image, now last on the page. */}
      {isRagsToRiches && (
        <section className="px-6 md:px-20 lg:px-28 pt-6 md:pt-8 pb-6 md:pb-8">
          <RevealBlock>
            <figure className="group">
              <button
                type="button"
                onClick={() => setLightbox(3)}
                className="block w-full overflow-hidden bg-secondary"
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

      {/* Pull quote — skipped on Anne Frank, whose pullQuote instead sits
          under the sketch in its own bespoke gallery layout below. */}
      {project.pullQuote && !isAnneFrank && (
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
                  className="block h-full w-full overflow-hidden bg-secondary"
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
                className="block w-full overflow-hidden bg-secondary"
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
          {/* The physical-model video, then the Kennedy Center passage right
              after it — was rendering the other way around (`project.video`
              here was always undefined, a leftover from before this video
              lived in `project.media`; the real clip actually rendered much
              further down, inside the generic gallery, well after this
              description). Pulling the real video up into its own section
              here, ahead of the description, puts them in the intended
              order without duplicating the clip (it's `hidden` in
              `project.media` now, so the generic gallery below skips it). */}
          {(() => {
            const videoIndex = project.media.findIndex((m) => m.id === "staging-model-video");
            const video = videoIndex === -1 ? null : project.media[videoIndex];
            return video ? (
              /* Centered, and a bit bigger than the first pass at this —
                 that landed too small on a wide monitor. Still capped
                 rather than full-bleed (the hero photo above already reads
                 as too large edge-to-edge with a lot of negative space —
                 separate issue, image's own problem to fix later). The
                 description below is deliberately its own, wider max-width
                 rather than matching the video's: at the video's narrower
                 width the Kennedy Center passage was wrapping into a tall,
                 cramped column instead of reading as a normal paragraph.
                 Cut pt-16/24 down to pt-4/6: that was on top of the
                 description-block above already ending in its own padding,
                 which is what stacked into an oversized gap before the
                 video ever showed up. */
              <section className="px-6 md:px-12 lg:px-16 pt-4 md:pt-6 pb-16 md:pb-24">
                <div className="max-w-3xl mx-auto">
                  {/* Same treatment as any other clickable media on the
                      page: a silent, looping, autoplaying-on-scroll moving
                      image with no visible controls. Sound and the scrub
                      bar only exist in the lightbox this opens — the
                      "expand" cue on hover is what tells a visitor that's
                      where to get them, rather than the clip trying to be
                      a full player in both places at once. */}
                  <figure className="group relative">
                    <button
                      type="button"
                      onClick={() => setLightbox(videoIndex)}
                      /* The border itself is the hover cue now — brightening
                         it reads as "this whole pane is about to open"
                         rather than a floating control sitting on top of
                         the footage. The expand mark stays tucked in the
                         corner, small and quiet, just confirming what a
                         click here does rather than demanding attention. */
                      className="block w-full overflow-hidden border border-white/[0.07] bg-black transition-colors duration-200 hover:border-white/30"
                      aria-label={`Enlarge ${project.title} video`}
                    >
                      <InViewVideo src={video.src} className="w-full h-auto" />
                      <span className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white/60 opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                        <ExpandIcon />
                      </span>
                    </button>
                  </figure>
                  {video.caption && (
                    <p className="mt-1.5 font-display font-extralight uppercase tracking-[0.08em] text-xs md:text-sm text-foreground/50 leading-relaxed text-center">
                      {video.caption}
                    </p>
                  )}
                </div>
                {project.extendedDescription && (
                  <RevealBlock>
                    <p
                      data-design-kind="text"
                      className="mt-6 md:mt-8 max-w-4xl mx-auto font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance text-center"
                    >
                      {project.extendedDescription}
                    </p>
                  </RevealBlock>
                )}
              </section>
            ) : null;
          })()}

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
          empty band of padding. Reshuffling's two painted-backdrop stills
          flow through this default branch now that it's a portrait hero
          again (media[0], the same photo as the hero, is hidden so it
          doesn't repeat). */}
      {!isTrueWest && (isAnneFrank || isYctiwy || isTownhouse || galleryMedia.length > 0) && (
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
              {/* Left: sketch, then the pull-quote beneath it. Nudged down a
                  bit more than the old md:pt-4 — the description + MY ROLE /
                  COLLABORATORS block above it (in its own separate section)
                  was landing close enough to the sketch's top edge that a
                  two-line collaborators credit touched or overlapped the
                  drawing. Scoped to this column only, so the kitchen photo
                  and the technical drawings below keep their existing
                  spacing exactly as it was. */}
              <div className="pt-4 md:pt-14 lg:pt-16">
                <RevealBlock from="left">
                  <figure className="group">
                    <button
                      type="button"
                      onClick={() => setLightbox(1)}
                      className="block w-full overflow-hidden"
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
                {project.pullQuote && (
                  <RevealBlock>
                    <p
                      data-design-id={designId.projectPullQuote(project.slug)}
                      data-design-kind="text"
                      className="mt-6 md:mt-8 font-display font-light text-xl md:text-3xl leading-snug tracking-tight text-balance text-foreground/85 text-center"
                    >
                      {project.pullQuote}
                    </p>
                  </RevealBlock>
                )}
              </div>

              {/* Right: kitchen closeup, dropped lower than the sketch */}
              <RevealBlock from="right" className="md:mt-24 lg:mt-32">
                <figure className="group">
                  <button
                    type="button"
                    onClick={() => setLightbox(2)}
                    className="block w-full overflow-hidden bg-secondary"
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
                    className="block w-full overflow-hidden"
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
                className="block w-full overflow-hidden bg-secondary"
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
                className="mt-1.5 font-display font-extralight uppercase tracking-[0.08em] text-xs md:text-sm text-foreground/50 leading-relaxed"
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
                  className="block w-full overflow-hidden bg-black p-6 md:p-8"
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
                  className="block w-full overflow-hidden bg-black p-6 md:p-8"
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
              <figure className="group overflow-hidden lg:mt-[150px]">
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
                        className="block w-full aspect-square overflow-hidden bg-secondary"
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
                          className="mt-1.5 font-display font-extralight uppercase tracking-[0.08em] text-xs md:text-sm text-foreground/50 leading-relaxed text-right"
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
                    <a href={m.link} className="block w-full overflow-hidden bg-secondary">
                      {mediaEl}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setLightbox(i)}
                      className="block w-full overflow-hidden bg-secondary"
                      aria-label={m.caption ?? `Media ${i + 1}`}
                    >
                      {mediaEl}
                    </button>
                  )}
                  {m.caption && (
                    <figcaption
                      className={`mt-1.5 font-display font-extralight uppercase tracking-[0.08em] text-xs md:text-sm text-foreground/50 leading-relaxed ${
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
          {/* Same label treatment as the render carousel's "Renderings"
              header above — a real section title, not a caption. */}
          <div className="mx-auto max-w-[1200px]">
            <p className="mb-3 text-left font-display font-light uppercase text-xl md:text-3xl tracking-wide text-foreground">
              Technical drawings
            </p>
          </div>
          <div className="md:hidden">
            <SwipeGallery
              slug={project.slug}
              items={lollapaloozaDraftingMedia}
              slideClassName="bg-white p-2"
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
                      <div className="flex items-center justify-center bg-white p-3 shadow-lg">
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
              slideClassName="overflow-hidden bg-secondary"
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
                        className="block overflow-hidden bg-secondary shadow-lg transition-transform duration-300 hover:scale-[1.01]"
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

      </div>{/* end light-zone */}

      {/* The old "Return to All Projects" / "Next [project]" block used to
          sit right here, directly above the flowing all-projects list
          below — two different "browse everything else" navigations
          stacked back to back, which read as a mistake rather than two
          intentional features (worse on mobile, where they're close enough
          together to look like a duplicated section). The flowing list
          already opens with "All Projects" and includes every other
          project by name, so it alone covers what the removed block did;
          removed rather than kept as a redundant duplicate. */}

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
              {String(lightbox + 1).padStart(2, "0")} / {String(lightboxMedia.length).padStart(2, "0")}
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
            {/* Cross-fade + slide between photos on arrow/thumbnail
                navigation, instead of the old hard cut straight from one
                image to the next. mode="wait" lets the outgoing image
                finish its exit before the incoming one starts, so they
                never double up mid-transition; the direction (which side
                each slides from/to) comes from lightboxDirection above. */}
            <AnimatePresence mode="wait">
              {lightboxMedia[lightbox].type === "video" ? (
                /* Enlarged video: gains a minimal, auto-hiding play/pause +
                   scrub bar here — the one place a project video is a player
                   rather than a moving image. Clicking it toggles play/pause,
                   so closing is via the ✕ or the dark margin. */
                <motion.div
                  key={lightbox}
                  initial={{ opacity: 0, x: lightboxDirection * 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -lightboxDirection * 32 }}
                  transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                  className="contents"
                >
                  <LightboxVideo
                    src={lightboxMedia[lightbox].src}
                    zoom={zoom}
                    animateZoom={!pinchStart.current}
                  />
                </motion.div>
              ) : (
                <motion.img
                  key={lightbox}
                  src={lightboxMedia[lightbox].src}
                  alt={lightboxMedia[lightbox].caption ?? project.title}
                  onClick={close}
                  initial={{ opacity: 0, x: lightboxDirection * 32 }}
                  animate={{ opacity: 1, x: 0, scale: zoom }}
                  exit={{ opacity: 0, x: -lightboxDirection * 32 }}
                  transition={{
                    opacity: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                    x: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
                    scale: { duration: pinchStart.current ? 0 : 0.12, ease: "easeOut" },
                  }}
                  className="max-h-full max-w-full object-contain cursor-zoom-out select-none"
                  draggable={false}
                />
              )}
            </AnimatePresence>

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

          {SHOW_LIGHTBOX_CAPTIONS && lightboxMedia[lightbox].caption && (
            <p
              className="text-xs md:text-sm text-foreground/80 text-center px-6 pb-6"
              onClick={(e) => e.stopPropagation()}
              data-design-id={designId.projectMediaCaption(
                project.slug,
                lightboxMedia[lightbox].id ?? String(lightbox),
              )}
              data-design-kind="text"
            >
              {lightboxMedia[lightbox].caption}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
