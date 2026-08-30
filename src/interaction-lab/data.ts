/**
 * Lab data — everything the experiments pull from.
 *
 * The images are the REAL portfolio assets, imported the same way the site
 * imports them (through @/lib/projects and the asset pipeline). No placeholders.
 * `LAB_IMAGES` is a hand-ordered reel chosen for entrance sequences: strong
 * full-bleed frames first, a mix of scenic / architectural / rendered work,
 * landscape-dominant so they tile cleanly full-screen.
 */
import { PROJECTS, HERO_URL, type Project } from "@/lib/projects";

export type LabImage = {
  src: string;
  /** Owning project title, shown as a caption in some experiments. */
  project: string;
  /** That project's accent hex, or the site accent when it has none. */
  accent: string;
  /** Rough shape, so experiments can pick portrait vs landscape deliberately. */
  shape: "landscape" | "portrait" | "square";
};

const SITE_ACCENT = "#3ad6d6"; // hsl(180 82% 55%) — the site accent, as hex

function bySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
function accentOf(slug: string): string {
  return bySlug(slug)?.accentColor ?? SITE_ACCENT;
}

/**
 * Curated entrance reel. Uses `cover` / `highlight` / first-media of real
 * projects. Order is deliberate — it is the sequence INTRO-01 plays.
 */
export const LAB_IMAGES: LabImage[] = [
  // Renderings' page cover is a Lovable-hosted asset (`/__l5e/...`) that only
  // resolves on their infra; its square highlight is a real bundled file and
  // shows the same payphone rendering, so the reel uses that instead.
  {
    src: bySlug("renderings")!.highlight as string,
    project: "Renderings",
    accent: accentOf("renderings"),
    shape: "landscape",
  },
  {
    src: bySlug("true-west")!.cover,
    project: "True West",
    accent: accentOf("true-west"),
    shape: "landscape",
  },
  {
    src: bySlug("field-house")!.cover,
    project: "Field House",
    accent: accentOf("field-house"),
    shape: "landscape",
  },
  {
    src: bySlug("the-diary-of-anne-frank")!.cover,
    project: "The Diary of Anne Frank",
    accent: accentOf("the-diary-of-anne-frank"),
    shape: "landscape",
  },
  {
    src: bySlug("lollapalooza")!.cover,
    project: "Lollapalooza",
    accent: accentOf("lollapalooza"),
    shape: "landscape",
  },
  {
    src: bySlug("you-cant-take-it-with-you")!.cover,
    project: "You Can't Take It With You!",
    accent: accentOf("you-cant-take-it-with-you"),
    shape: "landscape",
  },
  {
    src: bySlug("townhouse")!.cover,
    project: "Townhouse",
    accent: accentOf("townhouse"),
    shape: "portrait",
  },
  {
    src: bySlug("reshuffling-the-deck")!.cover,
    project: "Reshuffling the Deck",
    accent: accentOf("reshuffling-the-deck"),
    shape: "portrait",
  },
  {
    src: bySlug("the-exchange-facility")!.cover,
    project: "The Exchange Facility",
    accent: accentOf("the-exchange-facility"),
    shape: "landscape",
  },
  {
    src: bySlug("tab-renaissance")!.cover,
    project: "TaB: Renaissance",
    accent: accentOf("tab-renaissance"),
    shape: "landscape",
  },
  {
    src: bySlug("staging-aesthetics")!.cover,
    project: "Staging Aesthetics",
    accent: accentOf("staging-aesthetics"),
    shape: "portrait",
  },
];

/** Square highlight thumbnails — for grid / tile / stacked-card experiments. */
export const LAB_HIGHLIGHTS: LabImage[] = PROJECTS.filter((p) => p.highlight).map((p) => ({
  src: p.highlight as string,
  project: p.title,
  accent: p.accentColor ?? SITE_ACCENT,
  shape: "square" as const,
}));

/** A few known-portrait and known-landscape picks for proportion testing. */
export const LAB_PORTRAIT = LAB_IMAGES.filter((i) => i.shape === "portrait");
export const LAB_LANDSCAPE = LAB_IMAGES.filter((i) => i.shape === "landscape");

export const LAB_HERO = HERO_URL;
export const LAB_WORDMARK = "REID GRAHAM DESIGN";
export const LAB_SITE_ACCENT = SITE_ACCENT;

/** Every src the lab touches — used by the preloader so no experiment ever
 *  shows a blank frame. */
export const LAB_ALL_SRCS: string[] = Array.from(
  new Set([LAB_HERO, ...LAB_IMAGES.map((i) => i.src), ...LAB_HIGHLIGHTS.map((i) => i.src)]),
);

/* ─────────────────────────────────────────────────────────────────────
   EXPERIMENT REGISTRY

   One entry per experiment. `id` is permanent. The registry is the single
   source of truth for the Shortlist page and the copy-list button, so a
   shortlisted id can always be resolved back to a name + category even from
   a section the user never opened.
   ───────────────────────────────────────────────────────────────────── */

export type CategoryId =
  | "entrance"
  | "navigation"
  | "glass"
  | "transitions"
  | "type"
  | "image"
  | "carousels"
  | "wildcards";

export type Platform = "desktop" | "mobile" | "both";

export type ExperimentMeta = {
  id: string;
  category: CategoryId;
  name: string;
  blurb: string;
  platform: Platform;
  reference?: string;
  perf?: string;
};

export const CATEGORIES: {
  id: CategoryId | "shortlist" | "findings";
  index: string;
  label: string;
  lede: string;
}[] = [
  {
    id: "entrance",
    index: "01",
    label: "Entrance",
    lede: "Five full-screen first-entry sequences. Each takes over the viewport, plays with real project images and the REID GRAHAM DESIGN wordmark, and resolves into a working preview of the homepage.",
  },
  {
    id: "navigation",
    index: "02",
    label: "Navigation",
    lede: "Treatments for PROJECTS · VISUALIZATIONS · CONNECT and the controls around them — hover behaviour, magnetism, spatial expansion, a fuller mobile menu.",
  },
  {
    id: "glass",
    index: "03",
    label: "Glass Buttons",
    lede: "Tinted-glass capsules and bubbles for opening pages, stepping through images, and closing panels — from very restrained to more experimental refraction.",
  },
  {
    id: "transitions",
    index: "04",
    label: "Page Transitions",
    lede: "Ways of moving between the homepage, a project, a modal, and lab sections — image expansion, glass lensing, spatial push, colour wash.",
  },
  {
    id: "type",
    index: "05",
    label: "Type Motion",
    lede: "Typographic motion in the site's own fonts — for nav, project titles, headings, descriptions, captions and buttons. Readability held throughout.",
  },
  {
    id: "image",
    index: "06",
    label: "Image Motion",
    lede: "How images enter, respond and move — mask reveals, apertures, parallax, cursor previews, trails, stack separation. Tested on landscape, portrait and square.",
  },
  {
    id: "carousels",
    index: "07",
    label: "Carousels",
    lede: "Gallery and mobile image-browsing proposals. Mobile usability is the priority — the current project-image behaviour is weak on phones.",
  },
  {
    id: "wildcards",
    index: "08",
    label: "Wildcards",
    lede: "Unrequested ideas that could make a portfolio spanning architecture, scenic and experiential design feel unusually immersive — still realistic and maintainable.",
  },
  {
    id: "shortlist",
    index: "09",
    label: "Shortlist",
    lede: "Everything you have starred, gathered with its identifiers. Copy the list to hand back the exact set to transfer.",
  },
  {
    id: "findings",
    index: "10",
    label: "Findings",
    lede: "What the explorations taught, and the recommended next steps for the real portfolio.",
  },
];

export const EXPERIMENTS: ExperimentMeta[] = [
  // 01 ENTRANCE
  {
    id: "INTRO-01",
    category: "entrance",
    name: "Rapid Reel",
    blurb:
      "Studio K95-style — full-screen project images cut in fast rhythm while REID GRAHAM DESIGN wipes on line by line, landing on the homepage split.",
    platform: "both",
    reference: "Studio K95 (k95.it) loading + hero",
    perf: "Cheap: opacity/transform crossfades on 5 preloaded <img>. ~2.8s.",
  },
  {
    id: "INTRO-02",
    category: "entrance",
    name: "Layered Handoff",
    blurb:
      "Scheme Engine-style — a tinted field resolves through stacked translucent planes; images settle in depth, then the frontmost plane lifts to reveal the live homepage already behind it.",
    platform: "both",
    reference: "Scheme Engine (schemeengine.com) entrance layering",
    perf: "Moderate: 3 blurred layers + backdrop-filter. Drops blur under reduced-motion. ~3.4s.",
  },
  {
    id: "INTRO-03",
    category: "entrance",
    name: "Aperture Sequence",
    blurb:
      "Project images arrive through shifting architectural apertures — a slot, a portal, a cropped window — each opening handing to the next, closing onto the wordmark.",
    platform: "both",
    reference: "Original; clip-path apertures",
    perf: "Cheap: animated clip-path inset on preloaded images. ~3.2s.",
  },
  {
    id: "INTRO-04",
    category: "entrance",
    name: "Tile Collapse",
    blurb:
      "A full-screen mosaic of highlight images assembles, holds for a beat, then the tiles slide and collapse into the real homepage grid position.",
    platform: "both",
    reference: "Original; FLIP-style grid reflow",
    perf: "Moderate: 9 tiles transform together; transform/opacity only. ~3.0s.",
  },
  {
    id: "INTRO-05",
    category: "entrance",
    name: "Spatial Filmstrip",
    blurb:
      "Images travel toward the viewer along a perspective rail like a filmstrip pulled through a projector, decelerating onto the hero frame as the title assembles.",
    platform: "desktop",
    reference: "21st.dev image-trail / marquee patterns, adapted",
    perf: "Moderate: CSS 3D transforms on 8 planes. Mobile falls back to INTRO-01. ~3.6s.",
  },

  // 02 NAVIGATION
  {
    id: "NAV-01",
    category: "navigation",
    name: "Letter Wave",
    blurb:
      "Hover a nav item and a low-amplitude wave travels left→right through its letters, then settles.",
    platform: "desktop",
    reference: "21st.dev split-text hover",
    perf: "Cheap: per-letter transform, 6 spans.",
  },
  {
    id: "NAV-02",
    category: "navigation",
    name: "Rolling Labels",
    blurb:
      "Each label is two stacked copies; on hover the stack rolls up so the second copy takes its place.",
    platform: "desktop",
    reference: "Common editorial nav pattern",
    perf: "Cheap: single translateY on a clipped stack.",
  },
  {
    id: "NAV-03",
    category: "navigation",
    name: "Magnetic Pull",
    blurb:
      "A restrained magnetic response — the label eases a few pixels toward the cursor and releases on leave.",
    platform: "desktop",
    reference: "21st.dev magnetic button",
    perf: "Cheap: pointer math + spring; disabled on coarse pointers.",
  },
  {
    id: "NAV-04",
    category: "navigation",
    name: "Full-Bleed Menu",
    blurb:
      "A mobile menu that takes the whole screen, titles at headline scale wiping in staggered, each carrying a sliver of its section's image.",
    platform: "mobile",
    reference: "Studio K95 menu; site's existing phone menu",
    perf: "Cheap: staggered clip-path wipes.",
  },

  // 03 GLASS
  {
    id: "GLASS-01",
    category: "glass",
    name: "Smoked Capsule",
    blurb:
      "The most restrained option — the site's existing glass, tuned to a capsule, with a barely-there pressure dip on press.",
    platform: "both",
    reference: "Site .glass-button, refined",
    perf: "Cheap: backdrop-filter blur(8px).",
  },
  {
    id: "GLASS-02",
    category: "glass",
    name: "Cursor Sheen",
    blurb:
      "A soft specular highlight tracks the cursor across the glass surface, like light moving over a real pane.",
    platform: "desktop",
    reference: "21st.dev spotlight/hover-glow",
    perf: "Cheap: radial-gradient driven by two CSS vars.",
  },
  {
    id: "GLASS-03",
    category: "glass",
    name: "Tint on Approach",
    blurb:
      "Colourless at rest; as the cursor nears, the pane takes on the tint of the project it belongs to.",
    platform: "desktop",
    reference: "Site overlay accent system",
    perf: "Cheap: proximity → --accent mix.",
  },
  {
    id: "GLASS-04",
    category: "glass",
    name: "Lens Distortion",
    blurb:
      "An SVG displacement filter gives the glass a gentle lens-like refraction that intensifies on hover.",
    platform: "desktop",
    reference: "21st.dev liquid-glass / feDisplacementMap",
    perf: "Heavier: SVG filter. Static fallback on mobile + reduced-motion.",
  },
  {
    id: "GLASS-05",
    category: "glass",
    name: "Merge & Split",
    blurb:
      "A back/next pair rendered as two bubbles that draw together and fuse (SVG gooey) when the group is hovered.",
    platform: "desktop",
    reference: "Classic gooey-blur metaball effect",
    perf: "Moderate: one feGaussianBlur+feColorMatrix over 2 nodes.",
  },
  {
    id: "GLASS-06",
    category: "glass",
    name: "Portal Expand",
    blurb:
      "A glass circle that, on click, scales up past the viewport to become the next page's ground — the button IS the transition.",
    platform: "both",
    reference: "21st.dev page-transition / masked reveal",
    perf: "Cheap: single scale transform + fade.",
  },

  // 04 TRANSITIONS
  {
    id: "TRANSITION-01",
    category: "transitions",
    name: "Image Expand",
    blurb:
      "The clicked project's cover grows from its card rectangle to fill the page as the project view builds on top.",
    platform: "both",
    reference: "Shared-element transition",
    perf: "Cheap: FLIP rect → full, transform only.",
  },
  {
    id: "TRANSITION-02",
    category: "transitions",
    name: "Glass Lens Wipe",
    blurb:
      "A tinted glass layer sweeps across, and the new page is already resolved behind it when it clears.",
    platform: "both",
    reference: "Site glass + Scheme Engine handoff",
    perf: "Cheap: one translating blurred layer.",
  },
  {
    id: "TRANSITION-03",
    category: "transitions",
    name: "Spatial Push",
    blurb:
      "The outgoing page slides back and dims a touch on its own plane while the incoming page pushes in from the side.",
    platform: "both",
    reference: "iOS-style push, restrained",
    perf: "Cheap: two transforms.",
  },
  {
    id: "TRANSITION-04",
    category: "transitions",
    name: "Accent Wash",
    blurb:
      "The destination project's accent colour washes across the viewport as a fast diagonal, carrying the title with it.",
    platform: "both",
    reference: "Project accent system",
    perf: "Cheap: gradient sweep + clip text.",
  },

  // 05 TYPE
  {
    id: "TYPE-01",
    category: "type",
    name: "Wordmark Kinetic",
    blurb:
      "A restrained kinetic treatment of REID GRAHAM DESIGN — the three lines wipe on with the thin DESIGN settling a beat late.",
    platform: "both",
    reference: "Site animate-title-lr",
    perf: "Cheap: clip-path per line.",
  },
  {
    id: "TYPE-02",
    category: "type",
    name: "Split Reveal",
    blurb:
      "Headings split on the baseline — top and bottom halves slide from opposite sides and meet.",
    platform: "both",
    reference: "21st.dev split-text reveal",
    perf: "Cheap: two clipped copies.",
  },
  {
    id: "TYPE-03",
    category: "type",
    name: "Tracking Breathe",
    blurb:
      "On entrance, letter-spacing opens from tight to set value; on hover of a title it compresses a hair.",
    platform: "both",
    reference: "Editorial kinetic type",
    perf: "Cheap: letter-spacing transition.",
  },
  {
    id: "TYPE-04",
    category: "type",
    name: "Mask Rise",
    blurb:
      "Project titles rise through a hard mask edge, line by line, as if lifted from behind a horizon.",
    platform: "both",
    reference: "Masked reveal",
    perf: "Cheap: translateY inside overflow-hidden.",
  },
  {
    id: "TYPE-05",
    category: "type",
    name: "Word Swap Roll",
    blurb:
      "A caption where one word rolls over into its replacement — for rotating descriptors under a title.",
    platform: "both",
    reference: "21st.dev rotating text",
    perf: "Cheap: vertical roll on a clipped list.",
  },
  {
    id: "TYPE-06",
    category: "type",
    name: "Proximity Weight",
    blurb:
      "A heading whose letters lean and thicken slightly toward the cursor, easing back as it passes.",
    platform: "desktop",
    reference: "Variable-font proximity (weight via transform here)",
    perf: "Cheap: per-letter scaleY/skew from pointer distance.",
  },

  // 06 IMAGE
  {
    id: "IMAGE-01",
    category: "image",
    name: "Staggered Fade-Up",
    blurb:
      "The controlled baseline — images fade and rise on a short stagger as they enter the viewport.",
    platform: "both",
    reference: "Site RevealBlock",
    perf: "Cheap: IntersectionObserver + transform.",
  },
  {
    id: "IMAGE-02",
    category: "image",
    name: "Directional Mask",
    blurb:
      "Images wipe in from a chosen edge behind a moving mask, the picture held still so drawings stay legible.",
    platform: "both",
    reference: "Masked image reveal",
    perf: "Cheap: clip-path inset.",
  },
  {
    id: "IMAGE-03",
    category: "image",
    name: "Aperture Open",
    blurb: "An image unfolds from a small centered crop to full frame — a window opening onto it.",
    platform: "both",
    reference: "Architectural aperture",
    perf: "Cheap: clip-path inset from 50%.",
  },
  {
    id: "IMAGE-04",
    category: "image",
    name: "Depth Parallax",
    blurb:
      "Subtle multi-layer parallax on scroll — foreground, image, caption move at different rates within a bounded range.",
    platform: "both",
    reference: "Bounded parallax",
    perf: "Cheap if transform-only + rAF-throttled.",
  },
  {
    id: "IMAGE-05",
    category: "image",
    name: "Cursor Preview Trail",
    blurb:
      "Moving the cursor across a project list spawns a short trail of that project's images that fade as they fall behind.",
    platform: "desktop",
    reference: "21st.dev image trail",
    perf: "Moderate: pooled nodes, capped at 6; off on coarse pointers.",
  },
  {
    id: "IMAGE-06",
    category: "image",
    name: "Stack Separation",
    blurb: "A stacked deck of a project's images fans apart on hover / drag, then restacks.",
    platform: "both",
    reference: "21st.dev stacked cards",
    perf: "Cheap: transform per card from one index var.",
  },

  // 07 CAROUSELS
  {
    id: "CAROUSEL-01",
    category: "carousels",
    name: "Snap + Progress",
    blurb:
      "Minimal full-width swipe carousel, native scroll-snap, a thin progress bar and a count rather than dots.",
    platform: "both",
    reference: "Site SwipeGallery, extended",
    perf: "Cheap: native scroll-snap.",
  },
  {
    id: "CAROUSEL-02",
    category: "carousels",
    name: "Full-Bleed Sequence",
    blurb:
      "One image at a time edge to edge, caption fixed lower-left, tap zones left/right, drag anywhere.",
    platform: "mobile",
    reference: "Studio K95 full-bleed",
    perf: "Cheap: transform track + pointer drag.",
  },
  {
    id: "CAROUSEL-03",
    category: "carousels",
    name: "Draggable Filmstrip",
    blurb:
      "A horizontal filmstrip of thumbnails you throw with momentum; the centered frame is the active one.",
    platform: "both",
    reference: "21st.dev draggable gallery",
    perf: "Moderate: inertia via rAF; respects drag threshold.",
  },
  {
    id: "CAROUSEL-04",
    category: "carousels",
    name: "Stacked Cards",
    blurb:
      "A gallery as a stack — the top card swipes away to reveal the next, with the rest peeking beneath.",
    platform: "mobile",
    reference: "21st.dev stacked-card swiper",
    perf: "Cheap: 3 visible transforms.",
  },
  {
    id: "CAROUSEL-05",
    category: "carousels",
    name: "Thumb Index + Caption",
    blurb:
      "A thumbnail rail below the main image; the caption cross-fades as the active image changes.",
    platform: "both",
    reference: "Lightbox thumb nav",
    perf: "Cheap: index state, one crossfade.",
  },

  // 08 WILDCARDS
  {
    id: "WILD-01",
    category: "wildcards",
    name: "Sitewide Time-of-Day",
    blurb:
      "A near-invisible ambient grade over the whole site keyed to the visitor's local hour — the portfolio feels lit by the room it's opened in.",
    platform: "both",
    reference: "Original",
    perf: "Cheap: one fixed gradient layer, no per-frame work.",
  },
  {
    id: "WILD-02",
    category: "wildcards",
    name: "Model-Light Cursor",
    blurb:
      "On project pages the cursor becomes a soft raking light; images pick up a faint directional sheen as it passes, like a maquette under a work lamp.",
    platform: "desktop",
    reference: "Original; scenic/model lighting",
    perf: "Moderate: one mask-image following pointer, rAF-throttled.",
  },
  {
    id: "WILD-03",
    category: "wildcards",
    name: "Plan-to-Perspective Toggle",
    blurb:
      "A single control on architecture projects that tips the hero from a flat plan/elevation into its perspective render — drawing to building in one move.",
    platform: "both",
    reference: "Original; architectural representation",
    perf: "Cheap: crossfade + 3D tilt between two supplied images.",
  },
];

export function experimentsByCategory(cat: CategoryId): ExperimentMeta[] {
  return EXPERIMENTS.filter((e) => e.category === cat);
}
export function experimentById(id: string): ExperimentMeta | undefined {
  return EXPERIMENTS.find((e) => e.id === id);
}
