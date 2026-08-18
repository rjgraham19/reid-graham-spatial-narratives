/**
 * New media blocks added through Design Mode. Kept as a small file separate
 * from `design-overrides.json` (which edits *existing* elements) because
 * this represents structural additions to a project's `media` array rather
 * than a property override on a known element — a different kind of change
 * with its own shape, not a variant of ElementOverride.
 */
export type MediaLayout = "full" | "half";

export type AddedMediaEntry = {
  /** Stable — assigned once at add time, independent of array position. */
  id: string;
  type: "image" | "video";
  /** Public URL path — `/design-media/<slug>/<file>` once approved, or
      `/__design-mode/staged/<token>` while still a draft. */
  src: string;
  caption?: string;
  alt?: string;
  decorative?: boolean;
  layout: MediaLayout;
  /** Existing media id (or another added entry's id) this was inserted after; omitted = end of section. */
  insertAfterId?: string;
  link?: string;
  /** Original uploaded filename, kept for display in the inspector. */
  filename?: string;
};

export type MediaAdditionsFile = Record<string /* project slug */, AddedMediaEntry[]>;

export const ALLOWED_MEDIA_EXTENSIONS = [".png", ".jpg", ".jpeg", ".mp4"] as const;
export const ALLOWED_MEDIA_MIME_TYPES = ["image/png", "image/jpeg", "video/mp4"] as const;

export function extensionFor(filename: string): string {
  const m = /\.[a-z0-9]+$/i.exec(filename);
  return m ? m[0].toLowerCase() : "";
}

export function isAllowedMediaFile(filename: string, mime: string): boolean {
  const ext = extensionFor(filename);
  return (
    (ALLOWED_MEDIA_EXTENSIONS as readonly string[]).includes(ext) &&
    (ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(mime) &&
    // .jpg/.jpeg <-> image/jpeg, .png <-> image/png, .mp4 <-> video/mp4
    ((ext === ".png" && mime === "image/png") ||
      ((ext === ".jpg" || ext === ".jpeg") && mime === "image/jpeg") ||
      (ext === ".mp4" && mime === "video/mp4"))
  );
}

/** Strips path separators and traversal sequences; keeps the result to safe filename characters. */
export function sanitizeFilename(name: string): string {
  const base = name.replace(/^.*[/\\]/, "");
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-{2,}/g, "-");
  return cleaned.slice(0, 120) || "file";
}
