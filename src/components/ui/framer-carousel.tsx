import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SlideControls = {
  goPrev: () => void;
  goNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  /** True for the slide currently in view. Render per-slide arrows only when
   *  this is set, or every slide's arrows bleed in around the active one. */
  isActive: boolean;
};

/**
 * One-slide-at-a-time carousel with a spring slide between slides. The caller
 * owns each slide's markup via `renderSlide`, including its prev/next arrows
 * (gated on `controls.isActive`) so they can be anchored to the slide's own
 * card edges rather than stranded at the full-width frame margins.
 *
 * Beneath the frame: a thumbnail strip when `thumbnails` is supplied — small
 * previews of every slide, the current one lit and the rest dimmed — else a
 * plain row of progress pills.
 *
 * SSR-safe: the track renders at offset 0 (first slide) on the server; the
 * spring only ever runs in an effect.
 */
export function FramerCarousel({
  count,
  renderSlide,
  thumbnails,
  className,
  accentColor = "#ffffff",
}: {
  count: number;
  renderSlide: (index: number, controls: SlideControls) => ReactNode;
  /** One image URL per slide — renders the preview strip instead of pills. */
  thumbnails?: string[];
  className?: string;
  /** Hex the active thumbnail's gradient frame is mixed from. */
  accentColor?: string;
}) {
  const [index, setIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  // Tracks whether a drag is in progress so the index-driven snap effect
  // below doesn't fight the drag gesture's own live position.
  const dragging = useRef(false);

  useEffect(() => {
    if (dragging.current) return;
    const width = frameRef.current?.offsetWidth ?? 1;
    const controls = animate(x, -index * width, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    return controls.stop;
  }, [index, x]);

  // Keep the slide aligned to the frame when the viewport resizes.
  useEffect(() => {
    const onResize = () => x.set(-index * (frameRef.current?.offsetWidth ?? 1));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index, x]);

  const go = (i: number) => setIndex(Math.max(0, Math.min(count - 1, i)));

  // Swipe/drag to change slides — mouse or touch. A quick flick (high
  // velocity) advances even if the drag distance itself was short; otherwise
  // it takes a real drag past a quarter of the frame's width. Either way the
  // track always springs back to a resolved slide, even when that's the one
  // it started on (setIndex alone wouldn't re-run the snap effect above if
  // the index doesn't actually change).
  const onDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    dragging.current = false;
    const width = frameRef.current?.offsetWidth || 1;
    const { offset, velocity } = info;
    let next = index;
    if (offset.x < -width / 4 || velocity.x < -500) next = index + 1;
    else if (offset.x > width / 4 || velocity.x > 500) next = index - 1;
    next = Math.max(0, Math.min(count - 1, next));
    setIndex(next);
    animate(x, -next * width, { type: "spring", stiffness: 300, damping: 30 });
  };

  return (
    <div className={className}>
      <style>{FC_CSS}</style>
      <div ref={frameRef} className="fc-frame relative overflow-hidden rounded-2xl">
        <motion.div
          className="flex cursor-grab active:cursor-grabbing"
          style={{ x }}
          drag={count > 1 ? "x" : false}
          /* A ref rather than a computed {left,right} pixel box — Motion
             measures against it live at drag start, so it's correct
             immediately on mount and stays correct through any resize
             without a manual recompute. */
          dragConstraints={frameRef}
          dragElastic={0.15}
          dragMomentum={false}
          onDragStart={() => {
            dragging.current = true;
          }}
          onDragEnd={onDragEnd}
        >
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="w-full shrink-0">
              {renderSlide(i, {
                goPrev: () => go(index - 1),
                goNext: () => go(index + 1),
                isFirst: index === 0,
                isLast: index === count - 1,
                isActive: i === index,
              })}
            </div>
          ))}
        </motion.div>
      </div>

      {count > 1 &&
        (thumbnails ? (
          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            {thumbnails.slice(0, count).map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`View ${i + 1} of ${count}`}
                aria-current={i === index}
                style={{ ["--fc-accent" as string]: accentColor }}
                className={cn(
                  "fc-thumb h-16 w-24 shrink-0 overflow-hidden rounded-md bg-secondary transition-all duration-300 ease-out sm:h-20 sm:w-32",
                  i === index
                    ? "fc-thumb--active scale-[1.06] opacity-100"
                    : "opacity-40 grayscale hover:opacity-80 hover:grayscale-0",
                )}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex justify-center gap-2">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-foreground" : "w-1.5 bg-foreground/30",
                )}
              />
            ))}
          </div>
        ))}
    </div>
  );
}

/* The active thumbnail's frame — a 2px gradient mixed from `--fc-accent`
   instead of the hard white ring it used to carry, so it reads as the
   project's own colour lifting the current sheet rather than a boxed
   outline. The padding-box layer is the page black behind the (loading)
   image; the border-box layer is the gradient. */
const FC_CSS = `
/* Without this, a mouse-down-and-move on an <img> inside the frame starts
   the browser's own native "drag this image out" gesture (HTML5 DnD)
   instead of — and before — Motion's pointer-based drag ever sees it, so
   the slide never budges. Scoped to the frame rather than a global img
   rule, which would kill drag-out of any other image on the page too. */
.fc-frame img {
  -webkit-user-drag: none;
  user-select: none;
}
.fc-thumb--active {
  border: 2px solid transparent;
  background-image:
    linear-gradient(var(--background, #000), var(--background, #000)),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--fc-accent, #fff) 92%, white),
      color-mix(in srgb, var(--fc-accent, #fff) 45%, black)
    );
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 8px 24px -10px color-mix(in srgb, var(--fc-accent, #fff) 55%, transparent);
}
`;
