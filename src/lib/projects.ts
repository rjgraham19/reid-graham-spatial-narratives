import hero from "@/assets/rg/hero.jpg.asset.json";
import heroPayphone from "@/assets/rg/hero-payphone.jpg";
import ycttiwy from "@/assets/rg/p2_2.jpg.asset.json";
import ycttiwyDet from "@/assets/rg/p2_3.jpg.asset.json";
import yctFull from "@/assets/rg/yctiwy-fullview.jpg";
import yctClose from "@/assets/rg/yctiwy-closeup.jpg";
import yctSketch from "@/assets/rg/yctiwy-sketch.png";
import yctDrawing from "@/assets/rg/yctiwy-drawing.png";
import trueWest from "@/assets/rg/true-west-full.jpg";
import trueWestDet from "@/assets/rg/true-west-detail.jpg";
import trueWestRender1 from "@/assets/rg/true-west-render1.jpg";
import trueWestRender2 from "@/assets/rg/true-west-render2.jpg";
import trueWestDiagram from "@/assets/rg/true-west-diagram.png";
import anne from "@/assets/rg/anne-frank-full.jpg";
import anneDet from "@/assets/rg/anne-frank-detail.jpg";
import anneSketch from "@/assets/rg/anne-frank-sketch.webp";
import anneDrawingLeft from "@/assets/rg/anne-frank-drawing-left.webp";
import anneDrawingRight from "@/assets/rg/anne-frank-drawing-right.webp";
import reshuf from "@/assets/rg/reshuffling-full.jpg";
import reshufView1 from "@/assets/rg/reshuffling-view1.jpg";
import reshufView2 from "@/assets/rg/reshuffling-view2.jpg";
import tab from "@/assets/rg/tab-full.jpg";
// Two halves of one 8000px-wide technical drawing, exported separately so each
// can be enlarged on its own. Both are scaled by the same factor, so placing
// them side by side reconstructs the original at a single consistent scale.
import tabDrawingLeft from "@/assets/rg/tab-drawing-left.jpg";
import tabDrawingRight from "@/assets/rg/tab-drawing-right.jpg";
import lollaClubMagenta from "@/assets/rg/lollapalooza-clubmagenta.jpg";

// Square-thumbnail highlight images (full/uncropped; framed via CSS).
import hlTrueWest from "@/assets/rg/highlight-true-west.jpg";
import hlFieldHouse from "@/assets/rg/highlight-field-house.jpg";
import hlTownhouse from "@/assets/rg/highlight-townhouse.jpg";
import hlExchange from "@/assets/rg/highlight-exchange.jpg";
import hlStaging from "@/assets/rg/highlight-staging.jpg";
import hlRenderings from "@/assets/rg/highlight-renderings.jpg";
import hlDrafting from "@/assets/rg/highlight-drafting.jpg";
import hlIllustration from "@/assets/rg/highlight-illustration.jpg";
import hlPhysicalModels from "@/assets/rg/highlight-physical-models.jpg";

// Full uncropped versions of the above, used as the wide hero on their project pages.
import fieldHouseFull from "@/assets/rg/field-house-full.jpg";
import townhouseFull from "@/assets/rg/townhouse-full.jpg";
import stagingFull from "@/assets/rg/staging-full.jpg";
import fieldHouse from "@/assets/rg/p3_2.jpg.asset.json";
import fieldHouseDet from "@/assets/rg/p3_3.jpg.asset.json";
import townHouse from "@/assets/rg/p3_4.jpg.asset.json";
import townHouseDet from "@/assets/rg/p3_5.jpg.asset.json";
import exchange from "@/assets/rg/exchange-render.jpg";
import staging from "@/assets/rg/p3_7.jpg.asset.json";
import drafting from "@/assets/rg/p4_2.jpg.asset.json";
import illustration from "@/assets/rg/p4_3.jpg.asset.json";
import models from "@/assets/rg/p4_4.jpg.asset.json";
import renderings from "@/assets/rg/p4_5.jpg.asset.json";

export const HERO_URL = heroPayphone;
export const LEGACY_HERO_URL = hero.url;
// silence unused
void ycttiwy; void ycttiwyDet;

export type Hub = "production-scenic" | "architecture" | "visualizations";

export type ProjectTag = "Production/Scenic" | "Architecture" | "Experiential";

export const PROJECT_TAGS: ProjectTag[] = [
  "Production/Scenic",
  "Architecture",
  "Experiential",
];

export function tagToSlug(tag: ProjectTag): string {
  return tag.toLowerCase().replace(/\//g, "-");
}

export function slugToTag(slug: string): ProjectTag | undefined {
  return PROJECT_TAGS.find((t) => tagToSlug(t) === slug);
}

/** Per-project mood tokens drive palette + entrance animation. */
export type Mood =
  | "noir" // dark, moody, fade-from-black (Anne Frank)
  | "warm" // playful warm (You Can't Take It With You)
  | "desert" // dry, cool cyc (True West)
  | "cinema" // virtual production, cool teal (Reshuffling)
  | "pop" // saturated Bosch palette (TaB)
  | "concrete" // architectural neutral
  | "aqua" // water/speculative (Exchange)
  | "theatrical"; // staging aesthetics

export type MediaItem = {
  /** Stable ID for Design Mode overrides. Only populated on the V1 pilot project so far. */
  id?: string;
  type: "image" | "video";
  src: string;
  poster?: string;
  caption?: string;
  alt?: string;
  /** Explicitly no meaningful alt text needed — set by Design Mode only. */
  decorative?: boolean;
  /** Optional click-through destination, set by Design Mode only. */
  link?: string;
  /**
   * Set by Design Mode overrides only. Never remove hidden items from the
   * `media` array itself — several project pages address media by fixed
   * index, so splicing would silently corrupt unrelated images.
   */
  hidden?: boolean;
  /**
   * Layout width in the generic gallery grid. Only meaningful there — the
   * hand-composed per-project layouts (True West, Anne Frank, ...) ignore
   * it. Absent on every hand-authored item, which keeps their existing
   * full-width rendering exactly as it was; only Design-Mode-added items
   * set this explicitly.
   */
  layout?: "full" | "half";
  /** True when Design Mode added this item — never true for hand-authored media. */
  addedByDesignMode?: boolean;
};

export type Credit = { id?: string; role: string; name: string; hidden?: boolean };

export type PhilosophyCard = {
  title: string;
  time: string;
  space: string;
};

export type Project = {
  slug: string;
  hub: Hub;
  title: string;
  subtitle: string;
  year?: string;
  credits?: Credit[];
  description: string;
  pullQuote?: string;
  notes?: string[];
  cover: string;
  media: MediaItem[];
  /** Extra images used for the hover-collage preview on hub landing pages. */
  collage?: string[];
  mood?: Mood;
  /** Optional native HTML5 video (used on Staging Aesthetics). */
  video?: { src: string; poster?: string; caption?: string };
  /** Optional callout cards (used on Staging Aesthetics). */
  philosophyCards?: PhilosophyCard[];
  /** Direction the hero image "weighs" — drives entrance animation. */
  weight?: "left" | "right";
  /** Discipline tags — a project can span multiple. */
  tags?: ProjectTag[];
  /** Two-line thematic duality statement (used on True West). */
  dualityLines?: [string, string];
  /**
   * Full, uncropped image used for the square grid thumbnail. Framing is
   * done in CSS via object-fit: cover + highlightPosition — the source
   * file is never cropped.
   */
  highlight?: string;
  /** CSS object-position for the square thumbnail crop. Defaults to center. */
  highlightPosition?: string;
  /**
   * Hero image is taller than it is wide. At full width such a hero becomes
   * enormously tall, so these pages use a narrower hero column with the
   * description set beside it instead of below.
   */
  heroPortrait?: boolean;
  /**
   * Title block sits directly above the hero image rather than overlaying
   * it. For compositions where the top of the photo carries subject matter
   * that shouldn't be covered. Sticky behaviour is unchanged either way.
   */
  heroTitleAbove?: boolean;
  /**
   * The project's accent, as a hex colour. One value drives everything that
   * carries this project's colour:
   *
   *   · the tinted glass surrounding it when it opens as an inset panel —
   *     the wash against the panel, the side highlights, the deepening tone
   *     out to the window edges, and the glow off the panel itself
   *   · its title's hover colour on the projects grid
   *
   * The tones are derived in CSS with color-mix, so changing this hex changes
   * both places and nothing else needs editing.
   *
   * Omit it and the project keeps the neutral fallback: grey smoked glass in
   * the overlay, and the site accent on the title.
   */
  accentColor?: string;
};

/**
 * The accent as a title-hover colour.
 *
 * Normally the accent exactly as given. The exception is a colour too dark to
 * read as a hover against the tile's darkened lower edge: below 42% lightness
 * it's lifted to 58% with its hue and saturation intact, so it stays that
 * project's colour rather than becoming a different one.
 *
 * No current accent trips it — the darkest in use is #9c00e1 at 44%. It's kept
 * as a guard on future ones, and applied uniformly from the stored value
 * rather than as a per-project override. The overlay always uses the stored
 * colour exactly; only this hover reading is ever lifted.
 */
const MIN_HOVER_LIGHTNESS = 0.42;

export function accentTitleColor(hex?: string): string | undefined {
  if (!hex) return undefined;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (l >= MIN_HOVER_LIGHTNESS) return hex;

  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return `hsl(${h.toFixed(1)} ${(s * 100).toFixed(1)}% 58%)`;
}

export const HUBS: {
  slug: Hub;
  chapter: string;
  title: string;
  tagline: string;
  description: string;
  cover: string;
}[] = [
  {
    slug: "production-scenic",
    chapter: "I",
    title: "Production / Scenic",
    tagline: "Sets, staging, and world-building for theatre, film, and immersive events.",
    description:
      "Scenic environments where architecture becomes performance — walls that lean, floors that hold weather, spaces engineered for the story that will happen inside them.",
    cover: yctFull,
  },
  {
    slug: "architecture",
    chapter: "II",
    title: "Architecture",
    tagline: "Field houses, town houses, and speculative infrastructure.",
    description:
      "Speculative and built architectural work — field houses, town houses, and speculative infrastructure that stages politics, ecology, and inhabitation.",
    cover: fieldHouseFull,
  },
  {
    slug: "visualizations",
    chapter: "III",
    title: "Visualizations",
    tagline: "Renderings, construction drafting, illustration, and physical models.",
    description:
      "The technical and visual craft behind the built work — rendered atmospheres, orthographic drawings, hand illustration, and chipboard models.",
    cover: renderings.url,
  },
];

export const PROJECTS: Project[] = [
  // ─── Experiential highlight (appears first under the Experiential tag) ──
  {
    slug: "lollapalooza",
    heroTitleAbove: true,
    /* Y2K magenta. Drives the overlay and the title hover from this one value. */
    accentColor: "#E20074",
    hub: "production-scenic",
    title: "Lollapalooza",
    subtitle: "PLACEHOLDER — venue/context line pending",
    mood: "pop",
    weight: "right",
    tags: ["Experiential"],
    // PLACEHOLDER copy — replace once real project copy is provided.
    description:
      "PLACEHOLDER description — Y2K/futurism-themed experiential work. Replace with real project copy.",
    cover: lollaClubMagenta,
    media: [
      { type: "image", src: lollaClubMagenta, caption: "Club Magenta — night view, full front elevation" },
    ],
  },

  // ─── Production / Scenic (order per spec) ────────────────────────
  {
    slug: "you-cant-take-it-with-you",
    hub: "production-scenic",
    title: "You Can't Take It With You!",
    subtitle: "Deerfield Studio Theatre",
    mood: "warm",
    weight: "right",
    credits: [
      { id: "director", role: "Director", name: "Helen Crowley" },
      { id: "scenic-designer", role: "Scenic Designer", name: "Reid Graham" },
      { id: "technical-director", role: "Technical Director", name: "Michael Clack" },
    ],
    description:
      "A living-room set for the Sycamore household. Slanted walls, adorned with tortoise shells and quirky clocks, transform the space into its own character — mirroring the playful heart of the family who lives inside it.",
    pullQuote:
      "Slanted walls, adorned with tortoise shells and quirky clocks, transform the space into its own character, mirroring the playful heart of the Sycamore family.",
    cover: yctFull,
    collage: [yctSketch, yctDrawing],
    media: [
      { id: "full", type: "image", src: yctFull, caption: "Full stage — Sycamore family living room" },
      { id: "closeup", type: "image", src: yctClose, caption: "Slanted walls, adorned with tortoise shells and quirky clocks, transform the space into its own character, mirroring the playful heart of the Sycamore family." },
      { id: "sketch", type: "image", src: yctSketch, caption: "Conceptual sketch — slanted architecture and furniture layout" },
      { id: "drawing", type: "image", src: yctDrawing, caption: "Wall elevations F / G / H — technical drafting" },
    ],
  },
  {
    slug: "true-west",
    accentColor: "#c28127",
    highlight: hlTrueWest,
    highlightPosition: "50% 50%",
    hub: "production-scenic",
    title: "True West",
    subtitle: "Newman Studio @ the University of Michigan",
    mood: "desert",
    weight: "left",
    credits: [
      { role: "Director", name: "Nick Alexander" },
      { role: "Scenic Designer", name: "Reid Graham" },
      { role: "Technical Director", name: "Elliot Reid" },
    ],
    description:
      "The Wild West is honest — untamed and uncivilized. Suburbia shelters us in its artificial lushness, built on astroturf and synthetic greenery. A suburban kitchen unravels as the wild west comes pouring in.",
    pullQuote:
      "A suburban kitchen unravels as the wild west comes pouring in.",
    dualityLines: [
      "The Wild West is honest — untamed and uncivilized.",
      "Suburbia shelters us in its artificial lushness, built on astroturf and synthetic greenery.",
    ],
    cover: trueWest,
    collage: [trueWestDet],
    media: [
      { type: "image", src: trueWest, caption: "Full set — the suburban kitchen at rest" },
      { type: "image", src: trueWestDet, caption: "Second act — the wild west pours in" },
      { type: "image", src: trueWestRender1, caption: "Rendered model study — axonometric view" },
      { type: "image", src: trueWestRender2, caption: "Rendered model study — second axonometric view" },
      { type: "image", src: trueWestDiagram, caption: "Suburbia — Artificial Lushness / Wild West — Natural: plan comparison" },
    ],
  },
  {
    slug: "the-diary-of-anne-frank",
    accentColor: "#d7d9e6",
    hub: "production-scenic",
    title: "The Diary of Anne Frank",
    subtitle: "Deerfield Studio Theatre",
    mood: "noir",
    weight: "right",
    credits: [
      { role: "Director", name: "Helen Crowley" },
      { role: "Scenic Designer", name: "Reid Graham" },
      { role: "Technical Director", name: "Michael Clack" },
    ],
    description:
      "The rawness of the space is conveyed through skeletal framing and deteriorating wood slatting. Reflecting historical reference to the original annex, the design pays tribute to Anne and her diary's enduring legacy.",
    pullQuote:
      "Skeletal framing and deteriorating wood slatting — a tribute to Anne and her diary's enduring legacy.",
    cover: anne,
    collage: [anneDet],
    // Order matters: the custom layout on this page addresses these by index.
    media: [
      { type: "image", src: anne, caption: "Full attic set — skeletal framing over the annex" },
      { type: "image", src: anneSketch, caption: "Conceptual sketch by Reid Graham" },
      { type: "image", src: anneDet, caption: "Kitchen detail — stove, sink and stacked slatting" },
      { type: "image", src: anneDrawingLeft, caption: "Section — skeletal framing and stair" },
      { type: "image", src: anneDrawingRight, caption: "Ground plan" },
    ],
  },
  {
    slug: "reshuffling-the-deck",
    accentColor: "#A79E95",
    heroPortrait: true,
    hub: "production-scenic",
    title: "Reshuffling the Deck",
    subtitle: "Duderstadt Video Studio @ the University of Michigan",
    mood: "cinema",
    weight: "left",
    credits: [
      { role: "Thesis Director", name: "Rose Albayat" },
      { role: "Production Designer & Scenic Painter", name: "Reid Graham" },
    ],
    description:
      "A short film reimagining of Georges Méliès' The Living Playing Cards, brought to life through Virtual Production Technology.",
    cover: reshuf,
    tags: ["Production/Scenic", "Experiential"],
    media: [
      { type: "image", src: reshuf, caption: "On-set: virtual production stage with painted flats and camera rig" },
      { type: "image", src: reshufView1, caption: "Painted backdrop — colonnade receding to a vanishing point" },
      { type: "image", src: reshufView2, caption: "Painted backdrop — river landscape" },
    ],
  },
  {
    slug: "tab-renaissance",
    accentColor: "#9c00e1",
    heroTitleAbove: true,
    hub: "production-scenic",
    title: "TaB: Renaissance",
    subtitle: "The Garden of Earthly Delights — Taubman Architecture Ball",
    mood: "pop",
    weight: "right",
    credits: [
      { role: "Creative Director", name: "Reid Graham" },
      { role: "Event Coordinator", name: "Irem Hatipoglu" },
      { role: "Technical Coordinator", name: "Erin Hobbs" },
      { role: "Installation Design Team", name: "Keeran Cross, Chloe Erickson, Maggie Laakso, Elliot Reid" },
    ],
    description:
      "An immersive, experiential design for Taubman College's annual Beaux-Arts Ball, reimagining the Renaissance as a timeless expression of creative transformation and continual innovation. Inspired by The Garden of Earthly Delights by Hieronymus Bosch, the creative and marketing team drew upon the painting's color scheme and whimsicality for the event's branding, graphics, and promotional materials. A pop-up installation, playfully nodding to our event's shared name with TaB soda, became an engaging experiential marketing moment that built anticipation for the event.",
    cover: tab,
    tags: ["Production/Scenic", "Experiential"],
    media: [
      { type: "image", src: tab, caption: "Installation, branding, PINK FOUNTAIN diagram, and TaB Soda pop-up" },
      { type: "video", src: "/tab-closeup-animation.mp4" },
      { type: "image", src: tabDrawingLeft, caption: "PINK FOUNTAIN — components and modular seating types" },
      { type: "image", src: tabDrawingRight, caption: "PINK FOUNTAIN — exploded assembly and installation plan" },
    ],
  },

  // ─── Architecture (order per spec) ───────────────────────────────
  {
    slug: "field-house",
    accentColor: "#98A633",
    highlight: hlFieldHouse,
    highlightPosition: "70% 50%",
    hub: "architecture",
    title: "Field House",
    subtitle: "Community Tennis & Recreational Building",
    mood: "concrete",
    weight: "left",
    description:
      "Guided by accessibility and inclusive play for individuals of all ages and physical abilities, the Community Tennis and Recreational Building incorporates ramps to facilitate activity and motion around the courts — watching the game becomes as dynamic as playing it.",
    cover: fieldHouseFull,
    collage: [fieldHouseDet.url],
    media: [
      { type: "image", src: fieldHouseFull, caption: "Perspective — long ramp folding through the courts" },
      { type: "image", src: fieldHouseDet.url, caption: "Site section, axonometric and orthographic plans" },
    ],
  },
  {
    slug: "townhouse",
    accentColor: "#3c9aab",
    heroPortrait: true,
    highlight: hlTownhouse,
    highlightPosition: "50% 50%",
    hub: "architecture",
    title: "Townhouse",
    subtitle: "Inspired by the Croffead House by W.G. Clark",
    mood: "concrete",
    weight: "right",
    description:
      "A narrow town house inspired by the Croffead House by W.G. Clark. A shifted floor plate divides interior life: a library at grade, a dining room that overhangs the street, and blue-cast interiors that echo the precedent while framing everyday domestic ritual.",
    cover: townhouseFull,
    collage: [townHouseDet.url],
    media: [
      { type: "image", src: townhouseFull, caption: "Front Exterior Entry · Section · Plan · Inspiration precedent" },
      { type: "image", src: townHouseDet.url, caption: "First Floor Interior (Library) · Exterior View of Dining Room · Rhino model views rendered in Enscape" },
    ],
  },
  {
    slug: "the-exchange-facility",
    accentColor: "#b89bec",
    heroTitleAbove: true,
    highlight: hlExchange,
    highlightPosition: "33% 50%",
    hub: "architecture",
    title: "The Exchange Facility",
    subtitle: "A Speculative Future: World Building",
    mood: "aqua",
    weight: "left",
    description:
      "Amid a climate crisis in 2114, the scarcity of clean water revives human reverence for its powers, facilitating interconnection between living bodies: that of the human and that of the water. The Exchange facility enables the systemic circulation of bodies through a network of infrastructural vessels. Facilitating the flow of water and staging its communicative and transformational properties, these vessels shape space for the exchange of vitality, rejuvenation and power.",
    cover: exchange,
    media: [
      { type: "image", src: exchange, caption: "River-status map, Algae Purification Station, section and interior vessels (RIBI Oasis, Wavescapes, Steam Sanctuary)" },
    ],
  },
  {
    slug: "staging-aesthetics",
    accentColor: "#b89bec",
    heroTitleAbove: true,
    heroPortrait: true,
    highlight: hlStaging,
    highlightPosition: "50% 55%",
    hub: "architecture",
    title: "Staging Aesthetics",
    subtitle: "Projecting the Politics of Time + Space",
    mood: "theatrical",
    weight: "right",
    notes: ["Honorable Mention, Wallenberg Foundation Awards"],
    description:
      "Projecting National Culture, The John F. Kennedy Center for the Performing Arts in Washington, D.C., serves as a contentious stage onto which competing visions of cultural identity are cast. This interactive installation utilizes animation software, projection mapping technology, and spatialized audio design to explore various alternative facades for the building, immersing viewers in the political stakes of architectural aesthetics.",
    cover: stagingFull,
    media: [
      { type: "image", src: stagingFull, caption: "Physical model — day condition and night projection-mapped facade" },
    ],
    philosophyCards: [
      {
        title: "Modernism",
        time: "Early–mid 20th century. Forward-looking; embracing technological progress and new materials.",
        space: "Functional, simple, devoid of ornamentation.",
      },
      {
        title: "Neoclassicism",
        time: "18th–19th century. Backward-looking; seeks revival of Classical Greek and Ancient Roman antiquity as a model for enduring order.",
        space: "Symmetrical, balanced, hierarchical, monumental.",
      },
      {
        title: "Constructivism",
        time: "1915–1930. Agency in the present, active revolution and societal transformation.",
        space: "Kinetic, utilitarian, collectively engaged.",
      },
      {
        title: "Futurism",
        time: "1909–1914. Future-oriented; glorifies speed, dynamism, technological advancement; rejects harping on the past.",
        space: "Expanding, dynamic, constantly evolving.",
      },
      {
        title: "Dadaism",
        time: "1916–1924. Rejects traditional notions of time; embraces spontaneity and absurdity over fixed history.",
        space: "Fragmented, chaotic, deconstructed.",
      },
    ],
  },

  // ─── Visualizations (order per spec: Renderings first) ───────────
  {
    slug: "renderings",
    highlight: hlRenderings,
    highlightPosition: "55% 50%",
    hub: "visualizations",
    title: "Renderings",
    subtitle: "Immersion",
    mood: "cinema",
    weight: "left",
    description:
      "A rendered atmospheric environment — a payphone booth in overgrown, neon-lit terrain — designed as a VR experience. Cinematic light, foliage, and infrastructure staged for a first-person walk-through.",
    notes: ["Scan the QR code to experience an immersive virtual reality environment."],
    cover: renderings.url,
    media: [
      { type: "image", src: renderings.url, caption: "Immersive VR environment — payphone booth in neon-lit overgrowth. Scan the QR code to experience an immersive virtual reality environment." },
    ],
  },
  {
    slug: "construction-drafting",
    highlight: hlDrafting,
    highlightPosition: "50% 30%",
    hub: "visualizations",
    title: "Construction Drafting",
    subtitle: "Building Enclosures + Drafting for the Entertainment World",
    weight: "right",
    description:
      "Two bodies of technical drawing. Building Enclosure: a 2D wall section from foundation to roof, paired with 3D axonometric drawings. Drafting for the Entertainment World: furniture fabrication specifications, scenic groundplan samples, and scenic elevation samples — the orthographic language that lets a design get built.",
    cover: drafting.url,
    media: [
      { type: "image", src: drafting.url, caption: "Wall section + axonometric · scenic elevations, ground plan, furniture fabrication spec" },
    ],
  },
  {
    slug: "illustration",
    highlight: hlIllustration,
    highlightPosition: "50% 50%",
    hub: "visualizations",
    title: "Illustration",
    subtitle: "Editorial Graphics · Drawing + Painting Samples",
    weight: "left",
    description:
      "Editorial graphics for the Michigan Daily Newspaper alongside a portfolio of drawing and painting samples: a 4'×8' scenic painting final composition in acrylics, An Alley in Puerto Rico (11\"×17\", Copic markers), a Wood Block Materiality Drawing (11\"×17\", graphite), and a Medallion Painting (2'×2', acrylics).",
    cover: illustration.url,
    media: [
      { type: "image", src: illustration.url, caption: "Editorial graphics + scenic painting, alley study, wood-block drawing and medallion" },
    ],
  },
  {
    slug: "physical-models",
    highlight: hlPhysicalModels,
    highlightPosition: "50% 50%",
    hub: "visualizations",
    title: "Physical Models",
    subtitle: "Form Study · Stage Model for The Secret Garden",
    weight: "right",
    description:
      "From museum-board, foam-core, and chipboard form studies exploring pure mass, to a 1/4\"=1'-0\" stage model for The Secret Garden by Frances Hodgson Burnett. Venue: Power Center for the Performing Arts, Ann Arbor, MI. Scene: Interior of Misselthwaite Manor Grand Hall. Location: North Yorkshire Moors, England. Architectural Period: Jacobean (1603–1625).",
    cover: models.url,
    media: [
      { type: "image", src: models.url, caption: "Form-study chipboard series + The Secret Garden stage model" },
    ],
  },
];

// Seed each project's tags from its current hub. Multi-tagging is refined
// manually per project later.
const HUB_TAG: Partial<Record<Hub, ProjectTag>> = {
  "production-scenic": "Production/Scenic",
  architecture: "Architecture",
};
for (const p of PROJECTS) {
  if (!p.tags || p.tags.length === 0) {
    const seed = HUB_TAG[p.hub];
    p.tags = seed ? [seed] : [];
  }
}

export function projectsByHub(hub: Hub) {
  return PROJECTS.filter((p) => p.hub === hub);
}

export function projectBySlug(slug: string) {
  return PROJECTS.find((p) => p.slug === slug);
}

/** Projects displayed on the unified /work feed (everything that carries a tag). */
export function taggedProjects(): Project[] {
  return PROJECTS.filter((p) => (p.tags?.length ?? 0) > 0);
}

export function projectsByTag(tag: ProjectTag): Project[] {
  return PROJECTS.filter((p) => p.tags?.includes(tag));
}

