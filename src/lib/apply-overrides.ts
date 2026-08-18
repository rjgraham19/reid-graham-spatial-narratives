import type { Project, MediaItem, Credit } from "@/lib/projects";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import { designId } from "@/lib/design-ids";
import type { AddedMediaEntry, MediaAdditionsFile } from "@/lib/media-additions.types";

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
      // Always concrete after this point — `applyMediaAdditions` and the
      // route's rendering both need a real id to anchor inserts and build
      // design IDs from, and index-based fallback keys stop being stable
      // the moment media additions splice new items into the array.
      id: key,
      caption: captionOverride.caption ?? captionOverride.text ?? o.caption ?? item.caption,
      alt: o.alt ?? item.alt,
      link: o.link ?? item.link,
      src: o.src ?? item.src,
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
      const id = cssEscape(elementId);
      const { structural, typography } = cssDeclsFor(o);

      if (structural) {
        // Structural properties (position, size, crop) apply to the tagged
        // element itself only — never to a nested heading, or a positioning
        // transform meant for the wrapper would visually double up on the
        // text inside it too.
        rules.push({ scope, selector: `[data-design-id="${id}"]`, decls: structural });
      }
      if (typography) {
        // Typography applies to the tagged element *and* any nested h1/h2 —
        // AnimatedHeading (the site's title component) puts its own
        // font-size/family classes directly on an inner <h1>, and a
        // property declared directly on an element always wins over one
        // merely inherited from an ancestor, regardless of specificity. The
        // `!important` covers the remaining case: a plain text element
        // (e.g. the subtitle <p>) where this rule and the site's own
        // Tailwind utility class target the exact same element with equal
        // specificity, and injection order alone would otherwise decide.
        rules.push({
          scope,
          selector: `[data-design-id="${id}"], [data-design-id="${id}"] h1, [data-design-id="${id}"] h2`,
          decls: typography,
        });
      }

      // Move with Layout targets the nearest `<figure>` ancestor rather than
      // the image itself: the image sits inside an `overflow-hidden` button
      // (used for its hover/scale effect), so a margin applied there would
      // just create dead space inside that clipped box instead of actually
      // reflowing the page. `:has()` reaches the right ancestor without any
      // extra markup or a second data attribute.
      if (o.layoutShiftY != null) {
        rules.push({
          scope,
          selector: `figure:has([data-design-id="${id}"])`,
          decls: `margin-top:${o.layoutShiftY}px !important`,
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

function cssDeclsFor(o: ElementOverride): { structural: string; typography: string } {
  const structural: string[] = [];
  const typography: string[] = [];

  if (o.offsetX != null || o.offsetY != null) {
    structural.push(`transform:translate(${o.offsetX ?? 0}px,${o.offsetY ?? 0}px) !important`);
  }
  if (o.widthPct != null) structural.push(`width:${o.widthPct}% !important`);
  if (o.maxWidth != null) structural.push(`max-width:${o.maxWidth}px !important`);
  if (o.objectFit != null) structural.push(`object-fit:${o.objectFit} !important`);
  if (o.objectPositionX != null || o.objectPositionY != null) {
    structural.push(`object-position:${o.objectPositionX ?? 50}% ${o.objectPositionY ?? 50}% !important`);
  }

  if (o.fontSize != null) typography.push(`font-size:${o.fontSize}px !important`);
  if (o.textWidth != null) typography.push(`max-width:${o.textWidth}px !important`);
  if (o.fontWeight != null) typography.push(`font-weight:${o.fontWeight} !important`);
  if (o.lineHeight != null) typography.push(`line-height:${o.lineHeight} !important`);
  if (o.letterSpacing != null) typography.push(`letter-spacing:${o.letterSpacing}px !important`);
  if (o.color != null) typography.push(`color:${o.color} !important`);
  if (o.align != null) typography.push(`text-align:${o.align} !important`);
  if (o.fontFamily != null) typography.push(`font-family:${o.fontFamily},inherit !important`);

  return { structural: structural.join(";"), typography: typography.join(";") };
}

function cssEscape(id: string): string {
  return id.replace(/["\\]/g, "\\$&");
}

/** Live (unsaved) per-project media-addition lists win wholesale over saved ones. */
export function mergeMediaAdditions(saved: MediaAdditionsFile, live: MediaAdditionsFile): MediaAdditionsFile {
  return { ...saved, ...live };
}

/**
 * Splices Design-Mode-added media blocks into a project's media list at
 * render time, honoring each entry's `insertAfterId` (an existing media id,
 * or another added entry's id — omitted means end of the list). Runs after
 * `applyOverrides` so it can insert after an id that only exists once
 * hidden/replaced items have already been resolved.
 */
export function applyMediaAdditions(
  project: Project,
  additionsFile: MediaAdditionsFile,
  overridesFile: DesignOverridesFile = {},
): Project {
  const additions = additionsFile[project.slug];
  if (!additions || additions.length === 0) return project;

  // Property-panel edits to an added item (caption, alt, link, a
  // Replace-Media src swap, Hide) land as ordinary overrides keyed the same
  // way as any other media item's — the panel doesn't need to know an item
  // was added rather than hand-authored.
  const toItem = (a: AddedMediaEntry): MediaItem | null => {
    const o = mergeBase(overridesFile, designId.projectMedia(project.slug, a.id));
    const captionOverride = mergeBase(overridesFile, designId.projectMediaCaption(project.slug, a.id));
    if (o.hidden) return null;
    return {
      id: a.id,
      type: a.type,
      src: o.src ?? a.src,
      caption: captionOverride.caption ?? captionOverride.text ?? o.caption ?? a.caption,
      alt: o.alt ?? a.alt,
      decorative: a.decorative,
      link: o.link ?? a.link,
      layout: a.layout,
      addedByDesignMode: true,
    };
  };

  // Multiple entries anchored to the same existing id stay in add-order.
  const byAnchor = new Map<string, AddedMediaEntry[]>();
  const endEntries: AddedMediaEntry[] = [];
  for (const a of additions) {
    if (a.insertAfterId) {
      const list = byAnchor.get(a.insertAfterId) ?? [];
      list.push(a);
      byAnchor.set(a.insertAfterId, list);
    } else {
      endEntries.push(a);
    }
  }

  // Requires `applyOverrides` to have run first — it guarantees every item
  // has a concrete `.id`, so anchors here are never index-derived and stay
  // correct regardless of how many items get spliced in.
  const result: MediaItem[] = [];
  const placedAnchors = new Set<string>();
  for (const item of project.media) {
    result.push(item);
    const key = item.id;
    const after = key ? byAnchor.get(key) : undefined;
    if (after) {
      placedAnchors.add(key!);
      for (const a of after) {
        const rendered = toItem(a);
        if (rendered) result.push(rendered);
      }
    }
  }
  // An anchor that no longer matches any existing item (e.g. the item it
  // pointed at was itself since removed) falls back to the end rather than
  // silently dropping the block.
  for (const [anchor, list] of byAnchor) {
    if (!placedAnchors.has(anchor)) endEntries.push(...list);
  }
  for (const a of endEntries) {
    const rendered = toItem(a);
    if (rendered) result.push(rendered);
  }

  return { ...project, media: result };
}

/** Reads a single text-ish role directly by ID — used by non-project pages (Connect, hubs). */
export function resolveText(overridesFile: DesignOverridesFile, id: string, fallback: string): string {
  return overridesFile[id]?.base?.text ?? fallback;
}

export function resolveHidden(overridesFile: DesignOverridesFile, id: string): boolean {
  return overridesFile[id]?.base?.hidden ?? false;
}
