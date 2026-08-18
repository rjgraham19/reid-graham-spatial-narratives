/**
 * Generates stable, self-describing Design Mode element IDs from a project's
 * slug and the text's semantic role — e.g. "project.true-west.subtitle" —
 * rather than a positional index. No per-project data changes are needed to
 * unlock a role: any project automatically gets these IDs at render time.
 */
export function slugifyRole(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const designId = {
  projectTitle: (slug: string) => `project.${slug}.title`,
  projectSubtitle: (slug: string) => `project.${slug}.subtitle`,
  projectDescription: (slug: string) => `project.${slug}.description`,
  projectPullQuote: (slug: string) => `project.${slug}.pull-quote`,
  projectCredit: (slug: string, role: string) => `project.${slug}.credit.${slugifyRole(role)}`,
  /** `mediaKey` is the item's own `id` when set, else its array index as a stable-enough fallback. */
  projectMedia: (slug: string, mediaKey: string) => `project.${slug}.media.${mediaKey}`,
  projectMediaCaption: (slug: string, mediaKey: string) => `project.${slug}.media.${mediaKey}.caption`,
  connect: (role: string) => `connect.${role}`,
  home: (role: string) => `home.${role}`,
};

/** IDs whose elements must never be reachable for edit/delete — no data-design-id is ever emitted for them. */
export const PROTECTED_LABEL = "Protected navigation";
