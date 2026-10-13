import type { CSSProperties, ReactNode } from "react";

/**
 * Shared frame for embedded project assets — the image galleries and the
 * "Explore in 3D" viewers — so they all sit on the page the same way:
 *
 *   LABEL                          compact, thin, uppercase, 12px above
 *   ┌───────────────────┐ ┌──┐
 *   │       stage       │ │  │     thumbnail rail (galleries) or the same
 *   └───────────────────┘ └──┘     empty column (3D), so stages line up
 *        controls row              quiet, beneath the stage — never over it
 *          hint line               interaction instruction, space reserved
 *
 * The stage is capped at ~60% of the viewport tall and 1000px wide; desktop
 * keeps the whole thing to 85% of the content column. On phones the stage
 * takes the full width and any thumbnails drop beneath it.
 */

/** The category label above a stage ("Renderings", "Explore in 3D"). */
export const ASSET_LABEL_CLASS =
  "mb-3 font-display text-[12px] font-extralight uppercase leading-none tracking-[0.14em] text-foreground/80 md:text-[14px]";

/** The interaction hint under the controls ("Drag the handle to…"). */
export const ASSET_HINT_CLASS =
  "min-h-[1.25rem] text-center font-display text-[12px] font-extralight uppercase leading-normal tracking-[0.12em] text-foreground/55 md:text-[13px]";

/** An image's caption (sits 6px under it, right-aligned). Same type as the
 *  hint — captions and instructions share one style. */
export const ASSET_CAPTION_CLASS =
  "mt-1.5 text-right font-display text-[12px] font-extralight uppercase leading-normal tracking-[0.12em] text-foreground/55 md:text-[13px]";

/** Supporting blurb (also styled site-wide via `.body-statement`). */
export const ASSET_BLURB_CLASS = "body-statement font-display text-pretty";

/** Footprint for an image group / asset below the hero (see `.asset-group`). */
export const ASSET_GROUP_CLASS = "asset-group";

/** A quiet text control for the row under a stage (view presets etc.). */
export const ASSET_CONTROL_CLASS =
  "flex h-11 min-w-11 items-center justify-center px-2 font-display text-[11px] font-light uppercase tracking-[0.14em] text-foreground/65 transition-colors duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-[var(--asset-accent)] disabled:cursor-default disabled:opacity-30 motion-reduce:transition-none md:text-[12px]";

/** Outer class for an AssetFrame's stage. */
export const ASSET_STAGE_CLASS = "relative aspect-[var(--stage-ratio)] w-full overflow-hidden";

/** Gap between rail thumbnails, px — matches the rail's `gap-1.5`. */
export const THUMB_GAP = 6;

/** Rail is sized as if there were at least this many thumbnails. */
export const MIN_THUMBS = 6;

/**
 * Sizing variables for the stage + rail grid.
 *
 * The rail's thumbnails share its width, so their stacked height is
 * rail × Σ(1/aspect) + the gaps (`thumbK` is that Σ). Setting it equal to
 * the stage's height (stage width ÷ stage ratio) gives `--rail`; `100%` is
 * the grid's own width, so it holds at every size. `--gallery-max` is the
 * whole width for a given maximum stage width.
 */
export function railLayoutVars({ stageAspect, thumbK, thumbCount }: {
  stageAspect: number;
  thumbK: number;
  thumbCount: number;
}) {
  return {
    "--stage-ratio": stageAspect,
    "--thumb-k": thumbK,
    "--thumb-gaps": `${THUMB_GAP * (thumbCount - 1)}px`,
    "--rail": "calc(((100% - var(--rail-gap)) / var(--stage-ratio) - var(--thumb-gaps)) / (var(--thumb-k) + 1 / var(--stage-ratio)))",
    "--gallery-max": "calc(var(--stage-max) * (1 + 1 / (var(--stage-ratio) * var(--thumb-k))) + var(--rail-gap) - var(--thumb-gaps) / var(--thumb-k))",
  } as CSSProperties;
}

/** Grid for the stage + rail. Children place themselves by `[grid-area:…]`:
 *  label, stage, thumbs, nav. */
export const RAIL_LAYOUT_CLASS =
  "mx-auto grid grid-cols-1 [--rail-gap:0px] [--stage-max:calc(60svh*var(--stage-ratio))] [grid-template-areas:'label'_'stage'_'thumbs'_'nav'] " +
  "w-[min(100%,max(18rem,var(--stage-max)))] " +
  "sm:grid-cols-[minmax(0,1fr)_var(--rail)] sm:gap-x-[var(--rail-gap)] sm:[--rail-gap:8px] sm:[grid-template-areas:'label_.'_'stage_thumbs'_'nav_.'] " +
  "sm:w-[min(100%,max(18rem,var(--gallery-max)))] " +
  "md:[--stage-max:min(1000px,calc(60svh*var(--stage-ratio)))] md:w-[min(85%,max(18rem,var(--gallery-max)))]";

export function AssetFrame({
  label,
  aspect,
  accent = "var(--accent-color, var(--color-accent))",
  ariaLabel,
  controls,
  hint,
  reserveControls = false,
  children,
}: {
  label: string;
  /** Width ÷ height of the stage. */
  aspect: number;
  accent?: string;
  ariaLabel?: string;
  /** Row under the stage. If it only appears later, set `reserveControls`
   *  so the page doesn't shift when it does. */
  controls?: ReactNode;
  /** Hold the controls row's height before `controls` is passed. */
  reserveControls?: boolean;
  /** Interaction hint; pass a string (even "") to reserve its line. */
  hint?: string;
  /** The stage — use `ASSET_STAGE_CLASS` on its outer element. */
  children: ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={ariaLabel ?? label}
      // Same grid as a gallery with the standard six stage-shaped
      // thumbnails, the rail column just left empty — so a 3D stage comes
      // out the same size, and on the same left edge, as a gallery's image.
      className={RAIL_LAYOUT_CLASS}
      style={{
        "--asset-accent": accent,
        ...railLayoutVars({ stageAspect: aspect, thumbK: MIN_THUMBS / aspect, thumbCount: MIN_THUMBS }),
      } as CSSProperties}
    >
      <p className={`${ASSET_LABEL_CLASS} [grid-area:label]`}>{label}</p>
      <div className="[grid-area:stage]">{children}</div>
      {/* With `reserveControls`, the row's height is held even while there
          are no controls yet, so the hint can sit right under the stage
          and the page still doesn't move when the controls arrive. */}
      <div className={`[grid-area:nav] ${reserveControls ? "min-h-16" : ""}`}>
        {controls && <div className="mt-1 flex flex-wrap items-center justify-center">{controls}</div>}
        {hint !== undefined && <p className={`${controls ? "-mt-1" : "mt-2"} ${ASSET_HINT_CLASS}`}>{hint}</p>}
      </div>
    </div>
  );
}
