import { animate, motion, useMotionValue } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SlideControls = {
  goPrev: () => void;
  goNext: () => void;
  isFirst: boolean;
  isLast: boolean;
};

/**
 * One-slide-at-a-time carousel with a spring slide between slides and a row
 * of progress pills beneath. The caller owns each slide's markup via
 * `renderSlide`, including its prev/next arrows — passed in through
 * `SlideControls` — so the arrows can be anchored to the slide's own content
 * box (e.g. just off a centred card's edges) rather than stranded out at the
 * full-width frame margins.
 *
 * The frame clips with `overflow: clip` + a `overflow-clip-margin`, so the
 * off-screen slides are hidden while an arrow that sits a little outside the
 * card is still allowed to show.
 *
 * SSR-safe: the track renders at offset 0 (first slide) on the server; the
 * spring only ever runs in an effect.
 */
export function FramerCarousel({
  count,
  renderSlide,
  className,
}: {
  count: number;
  renderSlide: (index: number, controls: SlideControls) => ReactNode;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
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
  const controls: SlideControls = {
    goPrev: () => go(index - 1),
    goNext: () => go(index + 1),
    isFirst: index === 0,
    isLast: index === count - 1,
  };

  return (
    <div className={className}>
      <div
        ref={frameRef}
        className="relative rounded-2xl [overflow-clip-margin:52px] [overflow:clip]"
      >
        <motion.div className="flex" style={{ x }}>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="w-full shrink-0">
              {renderSlide(i, controls)}
            </div>
          ))}
        </motion.div>
      </div>

      {count > 1 && (
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
      )}
    </div>
  );
}
