import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * An edge-to-edge band of images scrolling horizontally on an endless loop.
 *
 * The list is rendered twice back-to-back and the track is animated by exactly
 * -50%, so the seam is invisible and the loop never jumps. Fades, hover and
 * the pause-on-hover are CSS-only; the injected `<style>` is scoped to the
 * `.ias-*` classes and never touches `html`/`body`.
 *
 * Adapted from the 21st.dev "image-auto-slider" — parameterised, made
 * optionally clickable (`onImageClick`), stripped of the global
 * `html, body { … }` reset it shipped with, height driven by the card sizes
 * rather than `min-h-screen`, and given a `prefers-reduced-motion` stop.
 */

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1482881497185-d4a9ddbe4151?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524799526615-766a9833dec0?q=80&w=1600&auto=format&fit=crop",
];

export function ImageAutoSlider({
  images = DEFAULT_IMAGES,
  imageAlts,
  speedSeconds = 40,
  reverse = false,
  paused = false,
  onImageClick,
  className,
  imageClassName,
}: {
  /** Image URLs, in order. Rendered twice for the seamless loop. */
  images?: string[];
  /** Optional alt / label per image (parallel to `images`). */
  imageAlts?: string[];
  /** Seconds for one full pass of the (duplicated) track. Lower = faster. */
  speedSeconds?: number;
  /** Scroll left-to-right instead of right-to-left. */
  reverse?: boolean;
  /** Freeze the scroll (e.g. while a viewer opened from a tile is up). */
  paused?: boolean;
  /** When set, each tile becomes a button; called with the index into `images`. */
  onImageClick?: (index: number) => void;
  className?: string;
  /** Extra classes on each tile — e.g. to change the card size. */
  imageClassName?: string;
}) {
  const n = images.length;
  const loop = n > 0 ? [...images, ...images] : [];
  const clickable = typeof onImageClick === "function";

  return (
    <div className={cn("ias-root relative w-full overflow-hidden", className)}>
      <style>{IAS_CSS}</style>
      <div
        className="ias-track flex w-max gap-4 md:gap-6"
        style={
          {
            animationDuration: `${speedSeconds}s`,
            animationDirection: reverse ? "reverse" : "normal",
            animationPlayState: paused ? "paused" : "running",
          } as CSSProperties
        }
      >
        {loop.map((src, i) => {
          const idx = i % n;
          const isDupe = i >= n;
          const alt = imageAlts?.[idx] ?? "";
          const tileClass = cn(
            "ias-item h-48 w-48 shrink-0 overflow-hidden rounded-xl shadow-2xl sm:h-60 sm:w-60 md:h-80 md:w-80 lg:h-[22rem] lg:w-[22rem]",
            imageClassName,
          );
          const img = (
            <img
              src={src}
              alt={alt}
              aria-hidden={isDupe || undefined}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover"
            />
          );

          return clickable ? (
            <button
              key={i}
              type="button"
              onClick={() => onImageClick?.(idx)}
              aria-hidden={isDupe || undefined}
              tabIndex={isDupe ? -1 : undefined}
              aria-label={alt ? `Open image: ${alt}` : `Open image ${idx + 1}`}
              className={cn(tileClass, "block cursor-pointer border-0 bg-secondary p-0")}
            >
              {img}
            </button>
          ) : (
            <div key={i} className={tileClass}>
              {img}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const IAS_CSS = `
@keyframes ias-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.ias-root {
  -webkit-mask: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
  mask: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
}
.ias-track {
  animation-name: ias-scroll;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform;
}
.ias-item {
  transition: transform 0.3s ease, filter 0.3s ease;
}
.ias-item:hover {
  transform: scale(1.04);
  filter: brightness(1.08);
}
@media (prefers-reduced-motion: reduce) {
  .ias-track { animation: none; }
}
`;

/** Alias so a copy of the 21st.dev demo (`import { Component } from …`) works. */
export { ImageAutoSlider as Component };
