import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "motion/react";
import { ASSET_HINT_CLASS, ASSET_LABEL_CLASS, MIN_THUMBS, RAIL_LAYOUT_CLASS, railLayoutVars } from "@/components/asset-frame";

/**
 * The standard project gallery: a small category label, a fixed-proportion
 * main stage, a rail of complete thumbnails beside it, and one quiet
 * navigation row beneath it (‹ accent-pill pagination ›).
 *
 * Layout: from 640px up the thumbnails stack in a vertical rail to the
 * right of the stage, sized so the stack's total height is exactly the
 * stage's height — top and bottom line up with the main image. On phones
 * they move into a compact horizontal row under the image so
 * the image keeps the full width. Swipe, arrows, dots, thumbnails and the
 * keyboard all drive the same active slide.
 *
 * The stage never changes size between slides. With `fit="contain"` each
 * image is shown whole inside it (drawings); with `fit="cover"` it fills the
 * frame edge to edge, trimming a little if its shape differs (photos and
 * renders). Images aren't clickable for enlarging; there's no lightbox here
 * on purpose.
 */

export type GallerySlide = {
  id: string;
  /** Short caption — not shown for now, but names the slide (and its
   *  thumbnail) for screen readers; kept for a later visible caption. */
  caption: string;
  /** Width ÷ height of what's displayed (after any `trim`). */
  aspect: number;
  src?: string;
  alt?: string;
  /** Show only this pixel rectangle of the source — for blank paper margins. */
  trim?: { x: number; y: number; width: number; height: number; sourceWidth: number };
  designId?: string;
  /** Specialised slide (e.g. the day/night comparison) — fills the fitted
   *  image box. `active` is false while it's off screen. */
  render?: (active: boolean) => ReactNode;
  /** Thumbnail for a `render` slide (image slides use their own image). */
  thumb?: ReactNode;
  /** Interaction hint shown under the navigation while this slide is active. */
  hint?: string;
};


function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === "left" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} />
    </svg>
  );
}

/** The slide's image — honouring `trim` — filling whatever box it's put in. */
function SlideImage({ slide, fit, className = "", designId = true, lazy = false }: {
  slide: GallerySlide;
  fit: "cover" | "contain";
  className?: string;
  designId?: boolean;
  lazy?: boolean;
}) {
  const design = designId && slide.designId ? { "data-design-id": slide.designId, "data-design-kind": "image" } : {};
  if (slide.trim) {
    return (
      <img
        src={slide.src}
        alt={slide.alt}
        {...design}
        loading={lazy ? "lazy" : undefined}
        decoding="async"
        draggable={false}
        className={`absolute max-w-none ${className}`}
        style={{
          width: `${(slide.trim.sourceWidth / slide.trim.width) * 100}%`,
          left: `${(-slide.trim.x / slide.trim.width) * 100}%`,
          top: `${(-slide.trim.y / slide.trim.height) * 100}%`,
        }}
      />
    );
  }
  return (
    <img
      src={slide.src}
      alt={slide.alt}
      {...design}
      loading={lazy ? "lazy" : undefined}
      decoding="async"
      draggable={false}
      className={`absolute inset-0 h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}

export function ProjectGallery({
  label,
  slides,
  accent = "var(--accent-color, var(--color-accent))",
  stageAspect,
  fit = "contain",
  stageClassName = "",
  itemNoun = "slide",
  minThumbs = MIN_THUMBS,
}: {
  label: string;
  slides: GallerySlide[];
  accent?: string;
  /** Width ÷ height of the stage. Each gallery picks one to suit its content. */
  stageAspect: number;
  /** "cover" fills the stage (may trim edges); "contain" shows each image whole. */
  fit?: "cover" | "contain";
  /** Backdrop behind contained images (stage and thumbnails), e.g. `bg-white` for drawings. */
  stageClassName?: string;
  /** Used in control names: "Previous drawing", "Next rendering". */
  itemNoun?: string;
  /** The rail is sized as if there were at least this many thumbnails, so a
   *  short gallery gets normal-sized thumbnails with space left below them
   *  (room for more images later) rather than a few oversized ones. */
  minThumbs?: number;
}) {
  const reducedMotion = useReducedMotion();
  const [viewport, api] = useEmblaCarousel({
    loop: false,
    // Leave drags that start on the comparison handle alone.
    watchDrag: (_api, event) => !(event.target instanceof Element && event.target.closest("[data-gallery-nodrag]")),
  });
  const [active, setActive] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const changed = useRef(false);
  const rail = useRef<HTMLDivElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!api) return;
    const select = () => setActive(api.selectedScrollSnap());
    select();
    api.on("select", select).on("reInit", select);
    return () => { api.off("select", select).off("reInit", select); };
  }, [api]);

  // Announce only real changes, never the first render.
  useEffect(() => {
    if (!changed.current) { changed.current = true; return; }
    setAnnouncement(`${slides[active]?.caption}, ${active + 1} of ${slides.length}`);
  }, [active, slides]);

  // Keep the selected thumbnail in view inside its own rail — scrolling the
  // rail only, never the page (which scrollIntoView would also do).
  useEffect(() => {
    const box = rail.current;
    const thumb = thumbs.current[active];
    if (!box || !thumb) return;
    const b = box.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    const behavior = reducedMotion ? "auto" : "smooth";
    if (t.top < b.top) box.scrollBy({ top: t.top - b.top, behavior });
    else if (t.bottom > b.bottom) box.scrollBy({ top: t.bottom - b.bottom, behavior });
    if (t.left < b.left) box.scrollBy({ left: t.left - b.left, behavior });
    else if (t.right > b.right) box.scrollBy({ left: t.right - b.right, behavior });
  }, [active, reducedMotion]);

  const go = (index: number) => api?.scrollTo(Math.max(0, Math.min(slides.length - 1, index)), !!reducedMotion);
  const hasHints = slides.some((slide) => slide.hint);

  const arrow = (direction: "left" | "right") => (
    <button
      type="button"
      onClick={() => go(active + (direction === "left" ? -1 : 1))}
      disabled={direction === "left" ? active === 0 : active === slides.length - 1}
      aria-label={`${direction === "left" ? "Previous" : "Next"} ${itemNoun}`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-[color,opacity] duration-200 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-[var(--gallery-accent)] disabled:cursor-default disabled:opacity-25 disabled:hover:text-foreground/70 motion-reduce:transition-none"
    >
      <Chevron direction={direction} />
    </button>
  );

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      style={{
        "--gallery-accent": accent,
        // Below `minThumbs`, the missing slots count as stage-shaped thumbnails.
        ...railLayoutVars({
          stageAspect,
          thumbK: slides.reduce((sum, slide) => sum + 1 / slide.aspect, 0) + Math.max(0, minThumbs - slides.length) / stageAspect,
          thumbCount: Math.max(minThumbs, slides.length),
        }),
      } as CSSProperties}
      className={RAIL_LAYOUT_CLASS}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        // The comparison slider owns its own arrow keys.
        if (event.target instanceof Element && event.target.closest("[role='slider']")) return;
        event.preventDefault();
        go(active + (event.key === "ArrowRight" ? 1 : -1));
      }}
    >
      <p className={`${ASSET_LABEL_CLASS} [grid-area:label]`}>
        {label}
      </p>

      <div ref={viewport} className={`overflow-hidden [grid-area:stage] ${stageClassName}`}>
        <div className="flex touch-pan-y">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${slide.caption}`}
              aria-hidden={i !== active}
              inert={i !== active}
              className="min-w-0 flex-[0_0_100%]"
            >
              {/* Fixed-proportion stage; the inner box is the image's own
                  shape fitted inside it (needed for trims and the comparison). */}
              <div className="flex aspect-[var(--stage-ratio)] w-full items-center justify-center [container-type:size]">
                <div
                  className="relative overflow-hidden"
                  style={fit === "cover"
                    ? { width: "100%", height: "100%" }
                    : { width: `min(100cqw, calc(100cqh * ${slide.aspect}))`, aspectRatio: String(slide.aspect) }}
                >
                  {slide.render ? slide.render(i === active) : <SlideImage slide={slide} fit={fit} lazy={i !== 0} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails: each a complete miniature in its own shape. A vertical
          rail beside the stage whose stack is exactly the stage's height,
          or a horizontal row under it on phones (scrolling if needed). */}
      <div className="relative mt-1.5 [grid-area:thumbs] sm:mt-0">
        <div
          ref={rail}
          className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] sm:flex-col sm:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              ref={(el) => { thumbs.current[i] = el; }}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show ${slide.caption}`}
              aria-current={active === i ? "true" : undefined}
              // Phones: a fixed 48px-tall row. Rail: full rail width.
              // Both keep the image's own shape, so nothing is clipped.
              className={`relative h-12 shrink-0 overflow-hidden transition-opacity duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gallery-accent)] motion-reduce:transition-none sm:h-auto sm:w-full ${stageClassName} ${
                active === i ? "opacity-100" : "opacity-40 hover:opacity-75 focus-visible:opacity-75"
              }`}
              style={{ aspectRatio: String(slide.aspect) }}
            >
              {slide.thumb ?? <SlideImage slide={{ ...slide, alt: "" }} fit="cover" designId={false} />}
            </button>
          ))}
        </div>
      </div>

      <div className="[grid-area:nav]">
        {/* One quiet row: ‹ dots ›. Exactly one dot is ever the wide pill, so
            the row's total width — and the chevrons' positions — never change. */}
        <div className="mt-1 flex items-center justify-center">
          {arrow("left")}
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to ${slide.caption}`}
              aria-current={active === i ? "true" : undefined}
              className="group flex h-11 min-w-7 items-center justify-center px-1 focus-visible:outline-none"
            >
              <span
                className={`h-1.5 rounded-full transition-all duration-300 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-[3px] group-focus-visible:outline-[var(--gallery-accent)] motion-reduce:transition-none ${
                  active === i ? "w-6 bg-[var(--gallery-accent)]" : "w-1.5 bg-foreground/35 group-hover:bg-foreground/60"
                }`}
              />
            </button>
          ))}
          {arrow("right")}
        </div>

        {/* Reserved even when empty so the page never shifts between slides. */}
        {hasHints && (
          <p className={`-mt-1 ${ASSET_HINT_CLASS}`}>
            {slides[active]?.hint ?? ""}
          </p>
        )}
      </div>

      <p aria-live="polite" aria-atomic="true" className="sr-only">{announcement}</p>
    </div>
  );
}
