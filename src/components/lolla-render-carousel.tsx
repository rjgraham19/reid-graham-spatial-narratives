import { useEffect, useRef, useState, type PointerEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "motion/react";
import day from "@/assets/rg/lollapalooza-render-day.jpg";
import night from "@/assets/rg/lollapalooza-render-night.jpg";
import full from "@/assets/rg/lollapalooza-render-full.jpg";
import oasis from "@/assets/rg/lollapalooza-render-oasis.jpg";

const labels = ["Day and night", "Full view", "Oasis"];

/* Starts just left of the lamppost so the T-Mobile Club Magenta roof
   logo lands fully on the night side and never gets sliced by the
   handle on first load. */
const INITIAL_SLIDER_POSITION = 28;

/* Past this far toward either edge the handle is treated as "docked" —
   there's nothing left to reveal in that direction, so it collapses from
   a two-way drag grip into a single next/previous arrow instead of
   sitting there doubled up with the carousel's own nav-arrow, which is
   right next to it at the frame edge. */
const DOCK_THRESHOLD = 2;

function DayNightComparison({
  active,
  position,
  onPositionChange,
  onAdvance,
}: {
  active: boolean;
  position: number;
  onPositionChange: (next: number) => void;
  /** Called when the docked-right arrow is clicked to move to the next slide. */
  onAdvance: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const update = (event: PointerEvent<HTMLDivElement>) => {
    const rect = frame.current?.getBoundingClientRect();
    if (rect) onPositionChange(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)));
  };
  const dockedLeft = position <= DOCK_THRESHOLD;
  const dockedRight = position >= 100 - DOCK_THRESHOLD;

  return (
    <div ref={frame} className="relative aspect-video select-none">
      <img src={night} alt="Club Magenta exterior at night" draggable={false} className="absolute inset-0 h-full w-full object-contain" />
      <img src={day} alt="Club Magenta exterior by day" draggable={false} className="absolute inset-0 h-full w-full object-contain" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-3 flex justify-between px-4 font-display font-extralight text-[10px] uppercase tracking-[0.2em] text-white sm:top-5 sm:px-6">
        <span className="rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">Day</span>
        <span className="rounded-full bg-black/40 px-3 py-1 backdrop-blur-sm">Night</span>
      </div>
      <div
        role="slider"
        aria-label="Day and night comparison"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% day, ${100 - Math.round(position)}% night`}
        aria-orientation="horizontal"
        tabIndex={active ? 0 : -1}
        data-comparison-handle
        className="group absolute inset-y-0 z-10 w-11 -translate-x-1/2 cursor-ew-resize touch-pan-y focus-visible:outline-none"
        style={{ left: `${position}%` }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus({ preventScroll: true });
          update(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) update(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 2;
          const next = event.key === "Home" ? 0 : event.key === "End" ? 100
            : ["ArrowRight", "ArrowUp"].includes(event.key) ? position + step
              : ["ArrowLeft", "ArrowDown"].includes(event.key) ? position - step : null;
          if (next === null) return;
          event.preventDefault();
          onPositionChange(Math.max(0, Math.min(100, next)));
        }}
      >
        <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/80 shadow-lg" />
        {/* Same circle, blur, border and glyph weight as `.nav-arrow`
            elsewhere on the site — this just isn't a <button> because the
            un-docked state is a drag grip, not a click target. */}
        <span
          aria-hidden
          onClick={dockedRight ? onAdvance : undefined}
          className={`nav-arrow absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-[#E20074] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-black ${
            dockedRight ? "cursor-pointer" : ""
          }`}
        >
          {dockedRight ? "›" : dockedLeft ? "‹" : <>‹<span className="ml-2">›</span></>}
        </span>
      </div>
    </div>
  );
}

export function LollaRenderCarousel() {
  const reducedMotion = useReducedMotion();
  const [viewport, api] = useEmblaCarousel({
    loop: false,
    watchDrag: (_api, event) => !(event.target instanceof Element && event.target.closest("[data-comparison-handle]")),
  });
  const [active, setActive] = useState(0);
  const [comparisonPosition, setComparisonPosition] = useState(INITIAL_SLIDER_POSITION);

  useEffect(() => {
    if (!api) return;
    const select = () => setActive(api.selectedScrollSnap());
    select();
    api.on("select", select).on("reInit", select);
    return () => { api.off("select", select).off("reInit", select); };
  }, [api]);

  const go = (index: number) => api?.scrollTo(index, !!reducedMotion);
  const comparisonDockedRight = active === 0 && comparisonPosition >= 98;

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Club Magenta renderings">
      <p className="mb-2 font-display font-extralight uppercase text-[0.7rem] tracking-[0.14em] text-foreground/50">
        Renderings
      </p>
      <div className="relative mx-auto max-w-[1200px]">
        <div ref={viewport} className="overflow-hidden rounded-lg">
          <div className="flex touch-pan-y">
            {labels.map((label, index) => (
              <div key={label} role="group" aria-roledescription="slide" aria-label={`${index + 1} of 3: ${label}`} aria-hidden={index !== active} className="min-w-0 flex-[0_0_100%]">
                {index === 0 ? (
                  <DayNightComparison
                    active={active === 0}
                    position={comparisonPosition}
                    onPositionChange={setComparisonPosition}
                    onAdvance={() => go(1)}
                  />
                ) : (
                  <img src={index === 1 ? full : oasis} alt={`Club Magenta — ${label.toLowerCase()} rendering`} loading="lazy" draggable={false} className="aspect-video w-full object-contain" />
                )}
              </div>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous rendering" className="nav-arrow absolute left-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 disabled:invisible md:-left-5">‹</button>
        <button type="button" onClick={() => go(active + 1)} disabled={active === 2 || comparisonDockedRight} aria-label="Next rendering" className="nav-arrow absolute right-2 top-1/2 z-20 h-10 w-10 -translate-y-1/2 disabled:invisible md:-right-5">›</button>
      </div>
      <div className="mt-2 flex justify-center gap-1">
        {labels.map((label, index) => (
          <button key={label} type="button" onClick={() => go(index)} aria-label={`View ${label.toLowerCase()}`} aria-current={active === index ? "true" : undefined} className="flex h-8 min-w-8 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E20074]">
            <span className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${active === index ? "w-6 bg-[#E20074]" : "w-1.5 bg-foreground/30"}`} />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-center uppercase tracking-[0.15em] text-[0.6rem] md:text-base text-foreground/50">
        {active === 0 ? "Drag to explore day & night" : labels[active]}
      </p>
    </div>
  );
}
