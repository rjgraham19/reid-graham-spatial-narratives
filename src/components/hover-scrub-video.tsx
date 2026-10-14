import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { InViewVideo } from "@/components/in-view-video";

/**
 * An InViewVideo (silent, autoplays when scrolled into view) with no frame
 * around it. Hovering fades in a thin scrub bar along its bottom edge and a
 * small play/pause mark; both fade out again when the pointer leaves.
 * Clicking the footage itself still opens it in the lightbox.
 */
export function HoverScrubVideo({
  src,
  onOpen,
  label,
}: {
  src: string;
  onOpen: () => void;
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState(false);
  const scrubbing = useRef(false);

  const video = () => box.current?.querySelector("video") ?? null;

  // Follow play/pause from any source (scroll autoplay, the mark below).
  useEffect(() => {
    const v = video();
    if (!v) return;
    const sync = () => setPlaying(!v.paused);
    v.addEventListener("play", sync);
    v.addEventListener("pause", sync);
    sync();
    return () => {
      v.removeEventListener("play", sync);
      v.removeEventListener("pause", sync);
    };
  }, []);

  // Keep the bar's fill smooth while it's on show; idle otherwise.
  useEffect(() => {
    if (!hover) return;
    let raf = 0;
    const tick = () => {
      const v = video();
      if (v && fill.current && v.duration) {
        fill.current.style.transform = `scaleX(${v.currentTime / v.duration})`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [hover]);

  const seekTo = (clientX: number) => {
    const v = video();
    const r = bar.current?.getBoundingClientRect();
    if (!v || !r || !v.duration) return;
    v.currentTime = Math.min(Math.max((clientX - r.left) / r.width, 0), 1) * v.duration;
  };
  const onBarDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    scrubbing.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Not every pointer can be captured; scrubbing by click still works.
    }
    seekTo(e.clientX);
  };
  const onBarMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scrubbing.current) seekTo(e.clientX);
  };
  const onBarUp = () => {
    scrubbing.current = false;
  };

  const toggle = () => {
    const v = video();
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  const shown = "opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none";

  return (
    <div
      ref={box}
      className="group relative bg-black"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <button type="button" onClick={onOpen} className="block w-full cursor-zoom-in" aria-label={label}>
        <InViewVideo src={src} className="block w-full h-auto" />
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause video" : "Play video"}
        className={`absolute bottom-3 left-2 flex h-7 w-7 items-center justify-center text-white/80 hover:text-white ${shown}`}
      >
        {playing ? (
          <svg aria-hidden viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
            <rect x="2" y="1.5" width="2.5" height="9" />
            <rect x="7.5" y="1.5" width="2.5" height="9" />
          </svg>
        ) : (
          <svg aria-hidden viewBox="0 0 12 12" width="10" height="10" fill="currentColor">
            <path d="M3 1.5v9l7.5-4.5z" />
          </svg>
        )}
      </button>

      {/* Taller hit area than the visible 2px line, so it's easy to grab. */}
      <div
        ref={bar}
        role="slider"
        aria-label="Video position"
        aria-valuemin={0}
        aria-valuemax={100}
        className={`absolute inset-x-0 bottom-0 flex h-3 cursor-pointer items-end touch-none ${shown}`}
        onPointerDown={onBarDown}
        onPointerMove={onBarMove}
        onPointerUp={onBarUp}
        onPointerCancel={onBarUp}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-[2px] w-full bg-white/20">
          <div ref={fill} className="absolute inset-0 origin-left bg-white/80" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </div>
  );
}
