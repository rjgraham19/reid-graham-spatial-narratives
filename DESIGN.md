# Portfolio design rules

Reid is an experiential/scenic designer with an architecture background. Preserve project imagery and deliberate themed treatments.

## Type

- General Sans: titles, body reading, annotations and captions.
- Antonio: project subtitles and credits.
- Captions follow Townhouse: Regular 400, uppercase, 0.12em tracking, 11px below 768px / 12px above. Use `asset-caption`; contrast must meet 4.5:1 on both black and white.
- Dividers use `asset-label` (General Sans 400, 18px, uppercase, approved by Reid on October 17, 2026); interaction instructions use `asset-hint`, in sentence case at 13px. Instructions are not captions.
- Avoid new one-off font sizes/weights. Existing exceptions are inventoried in the audit.

## Optical layout and spacing

Use an 8px scale: title → subtitle 14px (unchanged); subject → caption 8px; within-group gap 24px; group → divider 96px desktop / 64px phone; divider → image 16px.

Spacing is measured from the visible subject, not the file rectangle. Run `bun run media:generate` (or `npm run media:generate`) after adding/replacing assets. `media-insets.ts` and `responsive-media.ts` are generated.

Use `SubjectImage` for naturally sized project images. Matching black-on-black and white-in-light-zone borders can bleed inside an overflow-clipped parent. Opposite-color cards retain the file edge. Never crop or paint the original file to fix layout. Negative space compensation belongs in proportional layout, not per-viewport transforms.

Align within each actual column. Split heroes and centered viewers have deliberate separate axes; do not force every element on a page onto one left edge. Fixed-ratio cover stages require an explicit composition decision.

## Motion and loading

- Entrance motion stays as it was before the audit: description blocks fade up, scroll images fade and rise 16px, the home payphone tiles in, True West swatches rise. Reid rejected removing it on October 17, 2026.
- Project title left-to-right entrances and credit fades also stay (approved by Reid on October 14, 2026).
- Images below the fold wait hidden until scrolled into view, then fade in. Respect reduced motion, including changes while a page is open.
- Reserve intrinsic dimensions/aspect ratio. Eager/high-priority heroes; lazy below-fold media. Models show a poster only after failure; the record player starts loading on page load (Reid’s choice).

## Controls and navigation

Five roles: primary navigation (`glass-button text-button`), secondary/back (same surface), tag/filter (`hub-tag-pill`), icon-only (`glass-button--icon` / `nav-arrow`), in-content (`asset-control`). Only in-content `asset-control` buttons (3D view presets) use the outlined box with a pressed state, approved by Reid on October 17, 2026. Other buttons keep their existing styling. Every control gets a visible keyboard focus ring. Lollapalooza's retro button is a deliberate themed exception.

Overlays must close on Escape, contain keyboard focus and restore it. Touch users must keep vertical page scrolling over models. Hover-scrub video controls stay hover-only (Reid rejected always-visible controls).

## Verification

Run `bun run check:layout` / `npm run check:layout` for the 22 routes × 12 viewport matrix. Reports are in `playwright-report/`; screenshots and traces accompany failures. Use `check:layout:update` only after reviewing intended changes; generated snapshots are candidates until Reid approves the visual treatment. Never silently bless diffs to make CI green.

Do not delete unused assets or fonts without Reid's approval. Do not rewrite published history; keep commits small and the Lovable-synced branch buildable.
