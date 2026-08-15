/**
 * Curated V1 font catalog — ~20 free, open-source fonts loaded on demand from
 * Fontsource's public CDN (no API key, no bundled font files). Deliberately
 * small rather than the full Google Fonts catalog per V1 scope.
 */
export type FontCategory = "serif" | "sans-serif" | "display" | "monospace" | "handwriting";

export type FontDef = {
  id: string; // fontsource package slug
  label: string; // CSS font-family name
  category: FontCategory;
  weights: number[];
};

export const FONT_CATALOG: FontDef[] = [
  { id: "inter", label: "Inter", category: "sans-serif", weights: [400, 500, 600, 700] },
  { id: "work-sans", label: "Work Sans", category: "sans-serif", weights: [400, 500, 700] },
  { id: "dm-sans", label: "DM Sans", category: "sans-serif", weights: [400, 500, 700] },
  { id: "space-grotesk", label: "Space Grotesk", category: "sans-serif", weights: [400, 500, 700] },
  { id: "sora", label: "Sora", category: "sans-serif", weights: [400, 600, 700] },
  { id: "josefin-sans", label: "Josefin Sans", category: "sans-serif", weights: [400, 600] },
  { id: "syne", label: "Syne", category: "sans-serif", weights: [400, 700, 800] },
  { id: "ibm-plex-mono", label: "IBM Plex Mono", category: "monospace", weights: [400, 500, 600] },
  { id: "space-mono", label: "Space Mono", category: "monospace", weights: [400, 700] },
  { id: "playfair-display", label: "Playfair Display", category: "serif", weights: [400, 600, 700] },
  { id: "libre-baskerville", label: "Libre Baskerville", category: "serif", weights: [400, 700] },
  { id: "cormorant-garamond", label: "Cormorant Garamond", category: "serif", weights: [400, 600] },
  { id: "eb-garamond", label: "EB Garamond", category: "serif", weights: [400, 600] },
  { id: "spectral", label: "Spectral", category: "serif", weights: [400, 500, 600] },
  { id: "fraunces", label: "Fraunces", category: "serif", weights: [400, 600, 700] },
  { id: "crimson-pro", label: "Crimson Pro", category: "serif", weights: [400, 600] },
  { id: "vollkorn", label: "Vollkorn", category: "serif", weights: [400, 700] },
  { id: "bebas-neue", label: "Bebas Neue", category: "display", weights: [400] },
  { id: "archivo-black", label: "Archivo Black", category: "display", weights: [400] },
  { id: "abril-fatface", label: "Abril Fatface", category: "display", weights: [400] },
  { id: "caveat", label: "Caveat", category: "handwriting", weights: [400, 600, 700] },
];

const loadedPerDocument = new WeakMap<Document, Set<string>>();

/**
 * Injects the font's stylesheet into a given document the first time it's
 * needed there; no-ops after. Takes a `Document` explicitly rather than
 * always using the global one — the font has to load inside the canvas
 * iframe's own document for it to render there, not just in the editor
 * shell's document where the font picker preview lives.
 */
export function ensureFontLoaded(id: string, doc: Document = document) {
  let loaded = loadedPerDocument.get(doc);
  if (!loaded) {
    loaded = new Set();
    loadedPerDocument.set(doc, loaded);
  }
  if (loaded.has(id)) return;
  loaded.add(id);
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://cdn.jsdelivr.net/fontsource/fonts/${id}@latest/latin.css`;
  doc.head.appendChild(link);
}

/** Resolves a stored CSS font-family label (e.g. "Playfair Display") back to its Fontsource ID and loads it. */
export function ensureFontLoadedByLabel(doc: Document, label: string) {
  const def = FONT_CATALOG.find((f) => f.label === label);
  if (def) ensureFontLoaded(def.id, doc);
}
