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

export type MediaItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
  caption?: string;
};

export type Credit = { role: string; name: string };

export type Project = {
  slug: string;
  hub: Hub;
  title: string;
  subtitle: string;
  year?: string;
  credits?: Credit[];
  description: string;
  notes?: string[];
  cover: string;
  media: MediaItem[];
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
    tagline: "Studio projects from Taubman College of Architecture & Urban Planning.",
    description:
      "Speculative and academic architecture — field houses, town houses, and speculative infrastructure that stages politics, ecology, and inhabitation.",
    cover: fieldHouse.url,
  },
  {
    slug: "visualizations",
    chapter: "III",
    title: "Visualizations",
    tagline: "Construction drafting, illustration, physical models, and rendered atmospheres.",
    description:
      "The technical and visual craft behind the built work — orthographic drawings, hand illustration, chipboard models, and cinematic renderings.",
    cover: renderings.url,
  },
];

export const PROJECTS: Project[] = [
  // ─── Production / Scenic ─────────────────────────────────────────
  {
    slug: "you-cant-take-it-with-you",
    hub: "production-scenic",
    title: "You Can't Take It With You!",
    subtitle: "Deerfield Studio Theatre",
    year: "Scenic Designer",
    credits: [
      { role: "Director", name: "Helen Cowley" },
      { role: "Scenic Designer", name: "Reid Graham" },
      { role: "Technical Director", name: "Michael Clack" },
    ],
    description:
      "A living-room set for Kaufman & Hart's screwball classic. Slanted walls, adorned with tortoise shells and quirky clocks, transform the space into its own character — mirroring the playful heart of the Sycamore family.",
    notes: [
      "Warm interior lighting on a black-box floor.",
      "Elevations, wall studies, and a conceptual sketch by Reid Graham developed the scattered gallery-wall composition.",
    ],
    cover: ycttiwy.url,
    media: [
      { type: "image", src: ycttiwy.url, caption: "Full stage — Sycamore family living room" },
      { type: "image", src: ycttiwyDet.url, caption: "Dining nook + conceptual sketch and wall elevations" },
    ],
  },
  {
    slug: "true-west",
    hub: "production-scenic",
    title: "True West",
    subtitle: "Newman Studio @ The University of Michigan",
    credits: [
      { role: "Director", name: "Nick Alexander" },
      { role: "Scenic Designer", name: "Reid Graham" },
      { role: "Technical Director", name: "Elliot Reid" },
    ],
    description:
      "A suburban kitchen unravels as the wild west comes pouring in. The set stages Shepard's collision between the honesty of the untamed and the artificial lushness suburbia builds on top of it.",
    notes: [
      "Astroturf floor, brick half-wall, and cool desert cyclorama.",
      "SketchUp model rendered on Enscape to prove sightlines and material palette.",
    ],
    cover: trueWest.url,
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
    credits: [
      { role: "Director", name: "Helen Cowley" },
      { role: "Scenic Designer", name: "Reid Graham" },
      { role: "Technical Director", name: "Michael Clack" },
    ],
    description:
      "The rawness of the space is conveyed through skeletal framing and deteriorating wood slatting. Reflecting historical reference to the original annex, the design pays tribute to Anne and her diary's enduring legacy.",
    cover: anne.url,
    media: [
      { type: "image", src: anne.url, caption: "Full attic set — skeletal framing over the annex" },
      { type: "image", src: anneDet.url, caption: "Kitchen detail with conceptual sketch, elevations and ground plan" },
    ],
  },
  {
    slug: "reshuffling-the-deck",
    hub: "production-scenic",
    title: "Reshuffling the Deck",
    subtitle: "Duderstadt Video Studio @ The University of Michigan",
    credits: [
      { role: "Thesis Director", name: "Rose Albayat" },
      { role: "Production Designer & Scenic Painter", name: "Reid Graham" },
    ],
    description:
      "A short film reimagining of Georges Méliès' The Living Playing Cards, brought to life through virtual production technology — hand-painted flats and sculptural props filmed against LED walls.",
    cover: reshuf.url,
    media: [
      { type: "image", src: reshuf.url, caption: "On-set: virtual production stage with painted flats and camera rig" },
    ],
  },
  {
    slug: "tab-renaissance",
    hub: "production-scenic",
    title: "TaB: Renaissance",
    subtitle: "The Garden of Earthly Delights",
    credits: [
      { role: "Creative Director", name: "Reid Graham" },
      { role: "Event Coordinator", name: "Irem Hatipoglu" },
      { role: "Technical Coordinator", name: "Erin Hobbs" },
      { role: "Installation Team", name: "Keeran Cross, Chloe Erickson, Maggie Laakso, Elliot Reid" },
    ],
    description:
      "An immersive, experiential design for Taubman College's annual Beaux-Arts Ball, reimagining the Renaissance as a timeless expression of creative transformation and continual innovation. Inspired by Hieronymus Bosch's Garden of Earthly Delights.",
    notes: [
      "Full creative direction: installation, branding, graphics, and a pop-up TaB Soda activation.",
      "Modular seating, pink-foam fountain, and inflatable orbs staged around a central dance floor.",
    ],
    cover: tab.url,
    media: [
      { type: "image", src: tab.url, caption: "Full spread — installation, branding, PINK FOUNTAIN diagram, and TaB Soda pop-up" },
    ],
  },

  // ─── Architecture ────────────────────────────────────────────────
  {
    slug: "field-house",
    hub: "architecture",
    title: "Field House",
    subtitle: "Architecture Studio II (UG2) · Taubman College · Prof. Adam Fure",
    description:
      "Guided by accessibility and inclusive play for individuals of all ages and physical abilities, this Community Tennis and Recreational Building incorporates ramps to facilitate activity and motion around the courts — watching the game becomes as dynamic as playing it.",
    cover: fieldHouse.url,
    media: [
      { type: "image", src: fieldHouse.url, caption: "Perspective — long ramp folding through the courts" },
      { type: "image", src: fieldHouseDet.url, caption: "Site section, axonometric and orthographic plans" },
    ],
  },
  {
    slug: "town-house",
    hub: "architecture",
    title: "Town House",
    subtitle: "Architecture Studio I (UG1) · Taubman College · Prof. Colin Bonet",
    description:
      "A narrow town house inspired by W.G. Clark's Coffland House — split by a shifted floor plate, a library at grade, and a dining room that overhangs the street. Blue-cast interiors reference the reference precedent while framing everyday domestic ritual.",
    cover: townHouse.url,
    media: [
      { type: "image", src: townHouse.url, caption: "Front exterior, section, plan and inspiration precedent" },
      { type: "image", src: townHouseDet.url, caption: "Axonometrics and three interior conditions: entry, library, dining" },
    ],
  },
  {
    slug: "the-exchange-facility",
    hub: "architecture",
    title: "The Exchange Facility",
    subtitle: "Architecture Studio III (UG3) · World Building · Prof. Dawn Gilpin",
    description:
      "A speculative future, 2114. Amid a climate crisis, the scarcity of clean water revives human reverence for its powers, facilitating interconnection between living bodies — that of the human and that of the water. The Exchange Facility enables the systemic circulation of bodies through a network of infrastructural vessels.",
    cover: exchange.url,
    media: [
      { type: "image", src: exchange.url, caption: "Full brief — river-status map, Algae Purification Station, section and interior vessels (RIBI Oasis, Wavescapes, Steam Sanctuary)" },
    ],
  },
  {
    slug: "staging-aesthetics",
    hub: "architecture",
    title: "Staging Aesthetics",
    subtitle: "Wallenberg Studio (UG4) · Winter 2025 · Prof. Peter Halquist",
    description:
      "Projecting the politics of time + space. The John F. Kennedy Center for the Performing Arts serves as a contentious stage onto which competing visions of cultural identity are cast. This interactive installation uses animation software, projection mapping, and spatialized audio to explore alternative facades — immersing viewers in the political stakes of architectural aesthetics.",
    notes: ["Honorable Mention, Wallenberg Foundation Awards"],
    cover: staging.url,
    media: [
      { type: "image", src: staging.url, caption: "Physical model — day condition and night projection-mapped facade" },
    ],
  },

  // ─── Visualizations ──────────────────────────────────────────────
  {
    slug: "construction-drafting",
    hub: "visualizations",
    title: "Construction Drafting",
    subtitle: "ARCH 317 · THREMUS 463: CAD for the Entertainment World",
    credits: [
      { role: "Professors", name: "Craig Borum · Kevin Judge" },
    ],
    description:
      "Building enclosures and scenic construction documents. 2D wall sections from foundation to roof, 3D axonometric drawings, scenic elevations, ground plans, and furniture fabrication specifications — the orthographic language that lets a design get built.",
    cover: drafting.url,
    media: [
      { type: "image", src: drafting.url, caption: "Wall section + axon · scenic elevations, ground plan and furniture spec" },
    ],
  },
  {
    slug: "illustration",
    hub: "visualizations",
    title: "Illustration",
    subtitle: "Editorial Graphics · Drawing + Painting Samples",
    description:
      "Editorial graphics for the Michigan Daily Newspaper alongside a portfolio of drawing and painting work — from a 4' × 8' acrylic scenic painting to Copic-marker street studies, graphite material studies, and hand-painted architectural medallions.",
    cover: illustration.url,
    media: [
      { type: "image", src: illustration.url, caption: "Editorial graphics + scenic painting, alley study, wood-block drawing and medallion" },
    ],
  },
  {
    slug: "physical-models",
    hub: "visualizations",
    title: "Physical Models",
    subtitle: "Form Study (UG1) · THREMUS 460: Scenic Design II",
    credits: [
      { role: "Professor (Stage Model)", name: "Jungah Han" },
    ],
    description:
      "From museum-board form studies exploring pure mass, to a 1/4\"=1'-0\" stage model of the Grand Hall at Misselthwaite Manor for The Secret Garden — a Jacobean interior staged for the Power Center for the Performing Arts, Ann Arbor.",
    cover: models.url,
    media: [
      { type: "image", src: models.url, caption: "Form-study chipboard series + The Secret Garden stage model" },
    ],
  },
  {
    slug: "renderings",
    hub: "visualizations",
    title: "Renderings",
    subtitle: "ARCH 256: Immersion · Prof. Thomas Moran",
    description:
      "A rendered atmospheric environment — payphone booth in overgrown neon-lit terrain — designed as a VR experience. Cinematic light, foliage, and infrastructure staged for a first-person walk-through.",
    cover: renderings.url,
    media: [
      { type: "image", src: renderings.url, caption: "Immersive VR environment — payphone booth in neon-lit overgrowth" },
    ],
  },
];

export function projectsByHub(hub: Hub) {
  return PROJECTS.filter((p) => p.hub === hub);
}

export function projectBySlug(slug: string) {
  return PROJECTS.find((p) => p.slug === slug);
}
