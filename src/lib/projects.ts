import hero from "@/assets/rg/hero.jpg.asset.json";
import ycttiwy from "@/assets/rg/p2_2.jpg.asset.json";
import ycttiwyDet from "@/assets/rg/p2_3.jpg.asset.json";
import trueWest from "@/assets/rg/p2_4.jpg.asset.json";
import trueWestDet from "@/assets/rg/p2_5.jpg.asset.json";
import anne from "@/assets/rg/p2_6.jpg.asset.json";
import anneDet from "@/assets/rg/p2_7.jpg.asset.json";
import reshuf from "@/assets/rg/p2_8.jpg.asset.json";
import tab from "@/assets/rg/p2_9.jpg.asset.json";
import fieldHouse from "@/assets/rg/p3_2.jpg.asset.json";
import fieldHouseDet from "@/assets/rg/p3_3.jpg.asset.json";
import townHouse from "@/assets/rg/p3_4.jpg.asset.json";
import townHouseDet from "@/assets/rg/p3_5.jpg.asset.json";
import exchange from "@/assets/rg/p3_6.jpg.asset.json";
import staging from "@/assets/rg/p3_7.jpg.asset.json";
import drafting from "@/assets/rg/p4_2.jpg.asset.json";
import illustration from "@/assets/rg/p4_3.jpg.asset.json";
import models from "@/assets/rg/p4_4.jpg.asset.json";
import renderings from "@/assets/rg/p4_5.jpg.asset.json";

export const HERO_URL = hero.url;

export type Hub = "production-scenic" | "architecture" | "visualizations";

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
  type: "image" | "video";
  src: string;
  poster?: string;
  caption?: string;
};

export type Credit = { role: string; name: string };

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
};

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
    cover: ycttiwy.url,
  },
  {
    slug: "architecture",
    chapter: "II",
    title: "Architecture",
    tagline: "Field houses, town houses, and speculative infrastructure.",
    description:
      "Speculative and built architectural work — field houses, town houses, and speculative infrastructure that stages politics, ecology, and inhabitation.",
    cover: fieldHouse.url,
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
  // ─── Production / Scenic (order per spec) ────────────────────────
  {
    slug: "you-cant-take-it-with-you",
    hub: "production-scenic",
    title: "You Can't Take It With You",
    subtitle: "Deerfield Studio Theatre",
    mood: "warm",
    weight: "right",
    credits: [
      { role: "Director", name: "Helen Crowley" },
      { role: "Scenic Designer", name: "Reid Graham" },
      { role: "Technical Director", name: "Michael Clack" },
    ],
    description:
      "A living-room set for the Sycamore household. Slanted walls, adorned with tortoise shells and quirky clocks, transform the space into its own character — mirroring the playful heart of the family who lives inside it.",
    pullQuote:
      "Slanted walls, adorned with tortoise shells and quirky clocks, transform the space into its own character, mirroring the playful heart of the Sycamore family.",
    notes: ["Conceptual sketch by Reid Graham."],
    cover: ycttiwy.url,
    collage: [ycttiwyDet.url],
    media: [
      { type: "image", src: ycttiwy.url, caption: "Full stage — Sycamore family living room" },
      { type: "image", src: ycttiwyDet.url, caption: "Dining nook + conceptual sketch and wall elevations" },
    ],
  },
  {
    slug: "true-west",
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
    cover: trueWest.url,
    collage: [trueWestDet.url],
    media: [
      { type: "image", src: trueWest.url, caption: "Full set — the suburban kitchen at rest" },
      { type: "image", src: trueWestDet.url, caption: "Second act + rendered model studies (Natural vs. Artificial Lushness)" },
    ],
  },
  {
    slug: "the-diary-of-anne-frank",
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
    notes: ["Conceptual sketch by Reid Graham."],
    cover: anne.url,
    collage: [anneDet.url],
    media: [
      { type: "image", src: anne.url, caption: "Full attic set — skeletal framing over the annex" },
      { type: "image", src: anneDet.url, caption: "Kitchen detail with conceptual sketch, elevations and ground plan" },
    ],
  },
  {
    slug: "reshuffling-the-deck",
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
    cover: reshuf.url,
    media: [
      { type: "image", src: reshuf.url, caption: "On-set: virtual production stage with painted flats and camera rig" },
    ],
  },
  {
    slug: "tab-renaissance",
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
    cover: tab.url,
    media: [
      { type: "image", src: tab.url, caption: "Installation, branding, PINK FOUNTAIN diagram, and TaB Soda pop-up" },
    ],
  },

  // ─── Architecture (order per spec) ───────────────────────────────
  {
    slug: "field-house",
    hub: "architecture",
    title: "Field House",
    subtitle: "Community Tennis & Recreational Building",
    mood: "concrete",
    weight: "left",
    description:
      "Guided by accessibility and inclusive play for individuals of all ages and physical abilities, the Community Tennis and Recreational Building incorporates ramps to facilitate activity and motion around the courts — watching the game becomes as dynamic as playing it.",
    cover: fieldHouse.url,
    collage: [fieldHouseDet.url],
    media: [
      { type: "image", src: fieldHouse.url, caption: "Perspective — long ramp folding through the courts" },
      { type: "image", src: fieldHouseDet.url, caption: "Site section, axonometric and orthographic plans" },
    ],
  },
  {
    slug: "townhouse",
    hub: "architecture",
    title: "Townhouse",
    subtitle: "Inspired by the Croffead House by W.G. Clark",
    mood: "concrete",
    weight: "right",
    description:
      "A narrow town house inspired by the Croffead House by W.G. Clark. A shifted floor plate divides interior life: a library at grade, a dining room that overhangs the street, and blue-cast interiors that echo the precedent while framing everyday domestic ritual.",
    cover: townHouse.url,
    collage: [townHouseDet.url],
    media: [
      { type: "image", src: townHouse.url, caption: "Front Exterior Entry · Section · Plan · Inspiration precedent" },
      { type: "image", src: townHouseDet.url, caption: "First Floor Interior (Library) · Exterior View of Dining Room · Rhino model views rendered in Enscape" },
    ],
  },
  {
    slug: "the-exchange-facility",
    hub: "architecture",
    title: "The Exchange Facility",
    subtitle: "A Speculative Future: World Building",
    mood: "aqua",
    weight: "left",
    description:
      "Amid a climate crisis in 2114, the scarcity of clean water revives human reverence for its powers, facilitating interconnection between living bodies: that of the human and that of the water. The Exchange facility enables the systemic circulation of bodies through a network of infrastructural vessels. Facilitating the flow of water and staging its communicative and transformational properties, these vessels shape space for the exchange of vitality, rejuvenation and power.",
    cover: exchange.url,
    media: [
      { type: "image", src: exchange.url, caption: "River-status map, Algae Purification Station, section and interior vessels (RIBI Oasis, Wavescapes, Steam Sanctuary)" },
    ],
  },
  {
    slug: "staging-aesthetics",
    hub: "architecture",
    title: "Staging Aesthetics",
    subtitle: "Projecting the Politics of Time + Space",
    mood: "theatrical",
    weight: "right",
    notes: ["Honorable Mention, Wallenberg Foundation Awards"],
    description:
      "Projecting National Culture, The John F. Kennedy Center for the Performing Arts in Washington, D.C., serves as a contentious stage onto which competing visions of cultural identity are cast. This interactive installation utilizes animation software, projection mapping technology, and spatialized audio design to explore various alternative facades for the building, immersing viewers in the political stakes of architectural aesthetics.",
    cover: staging.url,
    media: [
      { type: "image", src: staging.url, caption: "Physical model — day condition and night projection-mapped facade" },
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

export function projectsByHub(hub: Hub) {
  return PROJECTS.filter((p) => p.hub === hub);
}

export function projectBySlug(slug: string) {
  return PROJECTS.find((p) => p.slug === slug);
}
