import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "motion/react";
import { designId } from "@/lib/design-ids";
import type { MediaItem } from "@/lib/projects";
import frontOverview from "@/assets/rg/lollapalooza-drafting-front-bar-overview.png";
import frontViews from "@/assets/rg/lollapalooza-drafting-front-bar-views.png";
import backOverview from "@/assets/rg/lollapalooza-drafting-back-bar.png";

// These exports include wide blank paper margins. Frame only the content,
// with a generous 60px paper border; the lightbox retains the original sheet.
// Key by source so a replacement uploaded in Design Mode is never cropped.
const paperFrames: Record<string, [number, number, number, number]> = {
  [frontOverview]: [143, 323, 2024, 1179],
  [frontViews]: [125, 323, 2092, 1096],
  [backOverview]: [144, 323, 2038, 1171],
};

export function DrawingCarousel({ slug, items, onOpen }: {
  slug: string;
  items: { item: MediaItem; index: number }[];
  onOpen: (index: number) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [viewport, api] = useEmblaCarousel({ loop: false });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!api) return;
    const select = () => setActive(api.selectedScrollSnap());
    select();
    api.on("select", select).on("reInit", select);
    return () => { api.off("select", select).off("reInit", select); };
  }, [api]);

  const go = (index: number) => api?.scrollTo(index, !!reducedMotion);
  return (
    <div role="region" aria-roledescription="carousel" aria-label="Technical drawings" className="mx-auto max-w-[1200px]"
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        go(Math.max(0, Math.min(items.length - 1, active + (event.key === "ArrowRight" ? 1 : -1))));
      }}>
      <p className="mb-3 text-left font-display font-light uppercase text-xl md:text-3xl tracking-wide text-foreground">Technical drawings</p>
      <div className="relative">
        <div ref={viewport} className="overflow-hidden">
          <div className="flex items-start touch-pan-y">
            {items.map(({ item, index }, i) => {
              const crop = paperFrames[item.src];
              return (
              <div key={item.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${items.length}`} aria-hidden={i !== active} inert={i !== active} className="min-w-0 flex-[0_0_100%]">
                <button type="button" onClick={() => onOpen(index)} aria-label={`Enlarge ${item.caption ?? "drawing"}`} className="relative flex aspect-[8/5] w-full items-center justify-center bg-white cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#E20074]">
                  <span className={crop ? "relative block overflow-hidden" : "absolute inset-0"} style={crop ? { width: `min(100%, ${crop[2] / crop[3] / 1.6 * 100}%)`, aspectRatio: `${crop[2]} / ${crop[3]}` } : undefined}>
                    <img data-design-id={designId.projectMedia(slug, item.id!)} data-design-kind="image" src={item.src} alt={item.caption ?? "Technical drawing"} draggable={false} className={crop ? "absolute max-w-none" : "block h-full w-full object-contain"} style={crop ? { width: `${2376 / crop[2] * 100}%`, left: `${-crop[0] / crop[2] * 100}%`, top: `${-crop[1] / crop[3] * 100}%` } : undefined} />
                  </span>
                </button>
              </div>
              );
            })}
          </div>
        </div>
        <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous drawing" className="nav-arrow absolute left-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 disabled:invisible md:-left-5">‹</button>
        <button type="button" onClick={() => go(active + 1)} disabled={active === items.length - 1} aria-label="Next drawing" className="nav-arrow absolute right-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 disabled:invisible md:-right-5">›</button>
      </div>
      <div className="mt-2 flex justify-center gap-1">
        {items.map(({ item }, i) => (
          <button key={item.id} type="button" onClick={() => go(i)} aria-label={`View ${item.caption ?? `drawing ${i + 1}`}`} aria-current={active === i ? "true" : undefined} className="flex h-8 min-w-8 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E20074]">
            <span className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${active === i ? "w-6 bg-[#E20074]" : "w-1.5 bg-foreground/30"}`} />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="sr-only">{active + 1} / {items.length} · {items[active]?.item.caption}</p>
    </div>
  );
}
