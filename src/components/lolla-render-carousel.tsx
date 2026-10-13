import { useRef, useState } from "react";
import { ProjectGallery, type GallerySlide } from "@/components/project-gallery";
import day from "@/assets/rg/lollapalooza-render-day.jpg";
import night from "@/assets/rg/lollapalooza-render-night.jpg";
import full from "@/assets/rg/lollapalooza-render-full.jpg";
import oasis from "@/assets/rg/lollapalooza-render-oasis.jpg";
import lounge from "@/assets/rg/lollapalooza-render-lounge.jpg";

/* Starts just left of the lamppost so the T-Mobile Club Magenta roof
   logo lands fully on the night side and never gets sliced by the
   handle on first load. */
const INITIAL_SLIDER_POSITION = 28;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

/* Only the handle moves the comparison. Pressing or swiping anywhere else
   on the image belongs to the carousel, so someone swiping to the next
   rendering never yanks the slider to where their finger landed — and
   grabbing the handle doesn't jump it either, it just follows the drag.
   `data-gallery-nodrag` keeps the carousel from also treating a handle
   drag as a swipe. The handle sits at a clamped spot so its circle stays
   whole at either edge, while the divider line runs the full range. */
function DayNightComparison({ active }: { active: boolean }) {
  const [position, setPosition] = useState(INITIAL_SLIDER_POSITION);
  const frame = useRef<HTMLDivElement>(null);
  const scrub = (clientX: number) => {
    const rect = frame.current?.getBoundingClientRect();
    if (rect) setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  return (
    <div ref={frame} className="absolute inset-0 select-none">
      <img src={night} alt="Club Magenta exterior at night" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <img src={day} alt="Club Magenta exterior by day" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} />
      {/* Plain labels, not boxed — framed tags read as buttons that did
          nothing. Bottom corners, in the site's caption type (12/13px
          extralight caps, as ASSET_CAPTION_CLASS), white with a soft shadow
          so they hold up over both the bright lawn and the night scene. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-between px-3 font-display text-[12px] font-extralight uppercase leading-none tracking-[0.12em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.65)] sm:bottom-4 sm:px-4 md:text-[13px]">
        <span>Day</span>
        <span>Night</span>
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-white/85" style={{ left: `${position}%` }} />

      <div
        role="slider"
        aria-label="Day and night comparison"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% day, ${100 - Math.round(position)}% night`}
        aria-orientation="horizontal"
        tabIndex={active ? 0 : -1}
        data-gallery-nodrag
        className="group absolute top-1/2 z-[5] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-pan-y items-center justify-center focus-visible:outline-none"
        style={{ left: `clamp(22px, ${position}%, calc(100% - 22px))` }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus({ preventScroll: true });
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) scrub(event.clientX);
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
          setPosition(clamp(next));
        }}
      >
        {/* Same circle, blur, border and glyphs as `.nav-arrow` elsewhere on
            the site — reads as a two-way grip. */}
        <span aria-hidden className="nav-arrow h-10 w-10 gap-2 text-white shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-[#E20074] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-black">
          <span>‹</span><span>›</span>
        </span>
      </div>
    </div>
  );
}

/* Thumbnail for the comparison: half day, half night, so it reads as the
   pair rather than as just one of the two renders. */
function DayNightThumb() {
  return (
    <>
      <img src={night} alt="" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      <img src={day} alt="" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: "inset(0 50% 0 0)" }} />
    </>
  );
}

const slides: GallerySlide[] = [
  { id: "day-night", caption: "Day and night", aspect: 16 / 9, render: (active) => <DayNightComparison active={active} />, thumb: <DayNightThumb /> },
  // Re-lit renders (2026-10-13), all 16:9 like the stage, so nothing is
  // cropped. The day half of the comparison was re-lit too; the night half
  // is unchanged (same framing, matched to the pixel).
  { id: "interior", caption: "Interior view", aspect: 16 / 9, src: full, alt: "Club Magenta — interior view rendering" },
  { id: "lounge", caption: "Lounge seating", aspect: 16 / 9, src: lounge, alt: "Club Magenta — lounge seating rendering" },
  { id: "oasis", caption: "Oasis lounge space", aspect: 16 / 9, src: oasis, alt: "Club Magenta — oasis lounge space rendering" },
];

export function LollaRenderCarousel() {
  return <ProjectGallery label="Renderings" slides={slides} accent="#E20074" stageAspect={16 / 9} fit="cover" itemNoun="rendering" />;
}
