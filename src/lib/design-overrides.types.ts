/**
 * Design Mode override schema. Values here are validated and written by the
 * local `npm run design` save endpoint only — this module is imported by the
 * production app purely to type and merge the resulting data, never to edit it.
 */

export type TextOverride = {
  text?: string;
  fontFamily?: string;
  fontSize?: number; // px
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number; // px
  textWidth?: number; // px, max-width
  align?: "left" | "center" | "right";
  color?: string; // hex
  offsetX?: number; // px — Free Position (transform, doesn't reflow siblings)
  offsetY?: number; // px — Free Position (transform, doesn't reflow siblings)
  hidden?: boolean;
};

export type ImageOverride = {
  caption?: string;
  alt?: string;
  /** Replacement source — `/design-media/...` once approved, or
      `/__design-mode/staged/...` while still a draft. Only ever points at
      Design Mode's own upload area; validated server-side on save. */
  src?: string;
  link?: string;
  widthPct?: number; // 1-100, proportional width
  maxWidth?: number; // px
  offsetX?: number; // px — Free Position
  offsetY?: number; // px — Free Position
  /** Move with Layout: a real margin-top delta, so neighbouring content reflows. */
  layoutShiftY?: number; // px
  align?: "left" | "center" | "right";
  objectFit?: "cover" | "contain";
  objectPositionX?: number; // 0-100
  objectPositionY?: number; // 0-100
  hidden?: boolean;
};

export type ElementOverride = TextOverride & ImageOverride;

/** Per-breakpoint scope. "base" applies everywhere unless a scoped value overrides it. */
export type Scope = "base" | "mobile" | "desktop";

export type ScopedOverride = Partial<Record<Scope, ElementOverride>>;

/**
 * Flat map, keyed by the element's own fully-qualified, self-describing ID
 * (e.g. "project.true-west.subtitle", "connect.heading"). IDs already encode
 * which page/project/role they belong to, so there's no separate per-project
 * or per-route grouping layer to keep in sync.
 */
export type DesignOverridesFile = Record<string /* elementId */, ScopedOverride>;

export const WHITELISTED_TEXT_PROPS: (keyof TextOverride)[] = [
  "text",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "textWidth",
  "align",
  "color",
  "offsetX",
  "offsetY",
  "hidden",
];

export const WHITELISTED_IMAGE_PROPS: (keyof ImageOverride)[] = [
  "caption",
  "alt",
  "src",
  "link",
  "widthPct",
  "maxWidth",
  "offsetX",
  "offsetY",
  "layoutShiftY",
  "align",
  "objectFit",
  "objectPositionX",
  "objectPositionY",
  "hidden",
];

export const WHITELISTED_SCOPES: Scope[] = ["base", "mobile", "desktop"];
