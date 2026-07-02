import experientialImg from "@/assets/experiential.jpg";
import scenicImg from "@/assets/scenic.jpg";
import architectureImg from "@/assets/architecture.jpg";
import visualizationsImg from "@/assets/visualizations.jpg";
import chamberImg from "@/assets/project-chamber.jpg";
import pavilionImg from "@/assets/project-pavilion.jpg";

export type Hub = "experiential" | "scenic" | "architecture" | "visualizations";

export type Project = {
  slug: string;
  hub: Hub;
  title: string;
  year: string;
  location: string;
  client?: string;
  role: string;
  logline: string;
  themes: string[];
  cover: string;
  // Bespoke art direction hints for the detail page
  palette: {
    background: string;
    ink: string;
    accent: string;
  };
  chapter: string;
  narrative: string[];
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
    slug: "experiential",
    chapter: "Chapter I",
    title: "Experiential",
    tagline: "Sensory environments that react to the body inside them.",
    description:
      "Immersive rooms, brand activations, and temporary worlds engineered to be walked through, not looked at.",
    cover: experientialImg,
  },
  {
    slug: "scenic",
    chapter: "Chapter II",
    title: "Scenic",
    tagline: "Static architecture for dynamic performance.",
    description:
      "Stage sets for theatre, film, music, and fashion — geometry sculpted by fog, shadow, and rhythm.",
    cover: scenicImg,
  },
  {
    slug: "architecture",
    chapter: "Chapter III",
    title: "Architecture",
    tagline: "Permanent structures with the weight of memory.",
    description:
      "Concrete, timber, and light. Interventions and small buildings that hold their silence.",
    cover: architectureImg,
  },
  {
    slug: "visualizations",
    chapter: "Chapter IV",
    title: "Visualizations",
    tagline: "The unbuilt, made vivid.",
    description:
      "Cinematic 3D studies — the blueprint stage where atmosphere is prototyped before a single wall exists.",
    cover: visualizationsImg,
  },
];

export const PROJECTS: Project[] = [
  {
    slug: "the-liminal-chamber",
    hub: "experiential",
    title: "The Liminal Chamber",
    year: "2024",
    location: "Brooklyn, NY",
    client: "The Senses Institute",
    role: "Design & Direction",
    logline:
      "A narrowing corridor of light and mist that forces an intimate encounter with the self.",
    themes: ["Isolation as sanctuary", "Geometric compression", "Refracted introspection"],
    cover: chamberImg,
    palette: {
      background: "hsl(212 45% 6%)",
      ink: "hsl(200 40% 92%)",
      accent: "hsl(198 90% 60%)",
    },
    chapter: "01",
    narrative: [
      "Visitors enter a room measuring twelve metres. By the far wall it has narrowed to less than one.",
      "The compression is theatrical: fog banked to shoulder height, a single cool-white source at the terminus, and a floor of polished concrete that returns every footstep as a low bloom.",
      "The chamber is not a metaphor for anything. It is a place engineered so a person cannot ignore themselves for the ninety seconds it takes to cross it.",
    ],
  },
  {
    slug: "membrane-pavilion",
    hub: "experiential",
    title: "Membrane Pavilion",
    year: "2023",
    location: "Marfa, TX",
    client: "Kinetica Studios",
    role: "Design & Fabrication Lead",
    logline:
      "A translucent membrane structure lit from within — a lantern for a two-week desert festival.",
    themes: ["Skin & armature", "Nocturnal architecture", "Ephemeral warmth"],
    cover: pavilionImg,
    palette: {
      background: "hsl(28 40% 6%)",
      ink: "hsl(38 35% 92%)",
      accent: "hsl(28 92% 62%)",
    },
    chapter: "02",
    narrative: [
      "Ninety-six radial ribs of bent plywood, wrapped in a single continuous panel of ripstop nylon.",
      "By day it disappears into the sand. By night it hums — the entire audience becomes silhouette, the pavilion becomes the only source of colour for a hundred metres in any direction.",
      "Designed to be dismantled by six people in a single afternoon and shipped in two crates.",
    ],
  },
  {
    slug: "monolith-in-fog",
    hub: "scenic",
    title: "Monolith in Fog",
    year: "2024",
    location: "London",
    client: "Vantage Theatre Group",
    role: "Scenic Designer",
    logline:
      "A single seven-metre pillar and a fog floor — the entire set for a two-hour production.",
    themes: ["Absence as presence", "Vertical drama", "Sound-first staging"],
    cover: scenicImg,
    palette: {
      background: "hsl(0 0% 4%)",
      ink: "hsl(0 0% 96%)",
      accent: "hsl(0 84% 55%)",
    },
    chapter: "03",
    narrative: [
      "The director wanted the audience to forget the stage existed. The answer was to give them almost nothing to look at.",
      "One monolith, four spotlights, a low fog bed. The actors did the rest.",
    ],
  },
  {
    slug: "concrete-corner-house",
    hub: "architecture",
    title: "Corner House",
    year: "2022",
    location: "Upstate NY",
    client: "Private",
    role: "Architect of Record",
    logline: "A single-storey concrete residence traced by a warm horizontal seam of light.",
    themes: ["Weight & seam", "Interior weather", "Slow rooms"],
    cover: architectureImg,
    palette: {
      background: "hsl(220 15% 8%)",
      ink: "hsl(30 20% 92%)",
      accent: "hsl(24 85% 60%)",
    },
    chapter: "04",
    narrative: [
      "Board-formed concrete on three sides, glazing on the fourth. The seam of amber LED between roof and wall makes the whole structure appear to hover after dusk.",
      "Inside: three rooms, each with a different ceiling height, each with a different weather.",
    ],
  },
  {
    slug: "shard-study",
    hub: "visualizations",
    title: "Shard Study",
    year: "2024",
    location: "Studio",
    role: "Concept & Render",
    logline:
      "A speculative object study — fragmented refractive geometry, suspended in near-vacuum.",
    themes: ["Refraction", "Weightlessness", "Rendered light"],
    cover: visualizationsImg,
    palette: {
      background: "hsl(260 30% 6%)",
      ink: "hsl(280 30% 94%)",
      accent: "hsl(320 90% 65%)",
    },
    chapter: "05",
    narrative: [
      "Not a proposal for anything. A rendered exercise in how far a single hanging object can be pushed before it stops feeling like a form and starts feeling like a mood.",
    ],
  },
];

export function projectsByHub(hub: Hub) {
  return PROJECTS.filter((p) => p.hub === hub);
}

export function projectBySlug(slug: string) {
  return PROJECTS.find((p) => p.slug === slug);
}
