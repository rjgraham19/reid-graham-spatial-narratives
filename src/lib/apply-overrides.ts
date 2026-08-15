import type { Project, MediaItem, Credit } from "@/lib/projects";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import { designId } from "@/lib/design-ids";

/**
 * The site's own "desktop" breakpoint (Tailwind's `md:`). Design Mode's
 * "mobile"/"desktop" scopes map onto this exact value so scoped overrides
 * apply through the same media query the rest of the site already uses —
 * no separate responsive system, no JS viewport branching, no hydration
 * mismatch.
 */
export const DESKTOP_BREAKPOINT_PX = 768;

function mergeBase(overridesFile: DesignOverridesFile, elementId: string): ElementOverride {
  return overridesFile[elementId]?.base ?? {};
}

/** Live (unsaved) overrides win over saved ones when both are present for a scope. */
export function mergeOverridesFiles(
  saved: DesignOverridesFile,
  live: DesignOverridesFile,
): DesignOverridesFile {
  const out: DesignOverridesFile = { ...saved };
  for (const [id, scoped] of Object.entries(live)) {
    out[id] = { ...out[id], ...scoped };
    for (const scope of Object.keys(scoped) as Scope[]) {
      out[id][scope] = { ...saved[id]?.[scope], ...scoped[scope] };
    }
  }
  return out;
}

/**
 * Applies "base"-scope overrides (content, hidden, font choice, color, align —
 * anything not breakpoint-sensitive) onto a project's data using IDs computed
 * from its slug and each field's semantic role, and flags hidden media items.
 * Layout-affecting responsive properties are left for `designModeStyleTag` to
 * express as real CSS media queries instead.
 */
export function applyOverrides(project: Project, overridesFile: DesignOverridesFile): Project {
  const slug = project.slug;
  const titleOverride = mergeBase(overridesFile, designId.projectTitle(slug));
  const subtitleOverride = mergeBase(overridesFile, designId.projectSubtitle(slug));
  const descriptionOverride = mergeBase(overridesFile, designId.projectDescription(slug));
  const pullQuoteOverride = mergeBase(overridesFile, designId.projectPullQuote(slug));

  // Items are never removed from the array — several pages address media by
  // fixed index (project.media[1], [2]...), so splicing would silently shift
  // those references onto the wrong image. Hiding is a flag the rendering
  // code checks per-item instead.
  const media: MediaItem[] = project.media.map((item, index) => {
    const key = item.id ?? String(index);
    const o = mergeBase(overridesFile, designId.projectMedia(slug, key));
    const captionOverride = mergeBase(overridesFile, designId.projectMediaCaption(slug, key));
    return {
      ...item,
      caption: captionOverride.caption ?? captionOverride.text ?? o.caption ?? item.caption,
      hidden: o.hidden ?? item.hidden,
    };
  });

  const credits: Credit[] | undefined = project.credits?.map((c) => {
    const o = mergeBase(overridesFile, designId.projectCredit(slug, c.role));
    return { ...c, name: o.text ?? c.name, hidden: o.hidden ?? c.hidden };
  });

  const notes: string[] | undefined = project.notes?.map(
    (n, i) => mergeBase(overridesFile, `project.${slug}.note.${i}`).text ?? n,
  );

  return {
    ...project,
    title: titleOverride.text ?? project.title,
    subtitle: subtitleOverride.text ?? project.subtitle,
    description: descriptionOverride.text ?? project.description,
    pullQuote: pullQuoteOverride.text ?? project.pullQuote,
    media,
    credits,
    notes,
  };
}

/**
 * Renders the responsive (breakpoint-sensitive) subset of overrides as plain
 * CSS, scoped to `[data-design-id]` attribute selectors — works for any page,
 * not just project pages. "mobile" applies below the desktop breakpoint,
 * "desktop" at or above it, matching the site's own `md:` breakpoint.
 * Returns an empty string when there's nothing to say.
 */
export function designModeStyleTag(overridesFile: DesignOverridesFile): string {
  const rules: { scope: Scope; selector: string; decls: string }[] = [];

  for (const [elementId, scoped] of Object.entries(overridesFile)) {
    for (const scope of ["base", "mobile", "desktop"] as Scope[]) {
      const o = scoped[scope];
      if (!o) continue;
      const decls = cssDeclsFor(o);
      if (decls) rules.push({ scope, selector: `[data-design-id="${cssEscape(elementId)}"]`, decls });

      // Move with Layout targets the nearest `<figure>` ancestor rather than
      // the image itself: the image sits inside an `overflow-hidden` button
      // (used for its hover/scale effect), so a margin applied there would
      // just create dead space inside that clipped box instead of actually
      // reflowing the page. `:has()` reaches the right ancestor without any
      // extra markup or a second data attribute.
      if (o.layoutShiftY != null) {
        rules.push({
          scope,
          selector: `figure:has([data-design-id="${cssEscape(elementId)}"])`,
          decls: `margin-top:${o.layoutShiftY}px`,
        });
      }
    }
  }

  if (rules.length === 0) return "";

  const base = rules.filter((r) => r.scope === "base").map((r) => `${r.selector}{${r.decls}}`).join("");
  const mobile = rules.filter((r) => r.scope === "mobile").map((r) => `${r.selector}{${r.decls}}`).join("");
  const desktop = rules.filter((r) => r.scope === "desktop").map((r) => `${r.selector}{${r.decls}}`).join("");

  let css = base;
  if (mobile) css += `@media (max-width:${DESKTOP_BREAKPOINT_PX - 1}px){${mobile}}`;
  if (desktop) css += `@media (min-width:${DESKTOP_BREAKPOINT_PX}px){${desktop}}`;
  return css;
}

function cssDeclsFor(o: ElementOverride): string {
  const decls: string[] = [];
  if (o.offsetX != null || o.offsetY != null) {
    decls.push(`transform:translate(${o.offsetX ?? 0}px,${o.offsetY ?? 0}px)`);
  }
  if (o.fontSize != null) decls.push(`font-size:${o.fontSize}px`);
  if (o.textWidth != null) decls.push(`max-width:${o.textWidth}px`);
  if (o.widthPct != null) decls.push(`width:${o.widthPct}%`);
  if (o.maxWidth != null) decls.push(`max-width:${o.maxWidth}px`);
  if (o.objectPositionX != null || o.objectPositionY != null) {
    decls.push(`object-position:${o.objectPositionX ?? 50}% ${o.objectPositionY ?? 50}%`);
  }
  if (o.fontWeight != null) decls.push(`font-weight:${o.fontWeight}`);
  if (o.lineHeight != null) decls.push(`line-height:${o.lineHeight}`);
  if (o.letterSpacing != null) decls.push(`letter-spacing:${o.letterSpacing}px`);
  if (o.color != null) decls.push(`color:${o.color}`);
  if (o.align != null) decls.push(`text-align:${o.align}`);
  if (o.fontFamily != null) decls.push(`font-family:${o.fontFamily},inherit`);
  if (o.objectFit != null) decls.push(`object-fit:${o.objectFit}`);
  return decls.join(";");
}

function cssEscape(id: string): string {
  return id.replace(/["\\]/g, "\\$&");
}

/** Reads a single text-ish role directly by ID — used by non-project pages (Connect, hubs). */
export function resolveText(overridesFile: DesignOverridesFile, id: string, fallback: string): string {
  return overridesFile[id]?.base?.text ?? fallback;
}

export function resolveHidden(overridesFile: DesignOverridesFile, id: string): boolean {
  return overridesFile[id]?.base?.hidden ?? false;
}
