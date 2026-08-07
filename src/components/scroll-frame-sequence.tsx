import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A PNG/WebP frame sequence scrubbed by scroll position: scrolling down
 * advances the frames, scrolling back up runs them in reverse, so the
 * subject reads as spinning under the reader's control.
 *
 * Frames are drawn to a canvas rather than swapped on an <img>, which
 * avoids the flash that src-swapping causes, and are all preloaded first
 * so scrubbing never lands on a frame that hasn't arrived yet.
 *
 * The scroll position is read on a continuous requestAnimationFrame loop
 * rather than from scroll events, because Lenis's smoothing means scroll
 * events don't fire at a steady rate.
 */
export function ScrollFrameSequence({
  frames,
  className,
  alt,
  backdrop,
}: {
  frames: string[];
  className?: string;
  alt?: string;
  /**
   * Optional layer rendered behind the canvas inside the sticky frame. It's
   * pinned along with the frame, so it holds still while the sequence plays
   * over it rather than scrolling past.
   */
  backdrop?: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);

  // Preload every frame before allowing scrubbing.
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const imgs = frames.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = img.onerror = () => {
        loaded += 1;
        if (loaded === frames.length && !cancelled) setReady(true);
      };
      return img;
    });
    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [frames]);

  useEffect(() => {
    if (!ready) return;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let smoothed: number | null = null;
    let lastDrawn = -1;

    const sizeCanvas = () => {
      const first = imagesRef.current[0];
      if (!first?.naturalWidth) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      lastDrawn = -1; // force a redraw at the new size
    };

    const paint = (img: HTMLImageElement, alpha: number) => {
      if (!img?.naturalWidth) return;
      const scale = Math.min(
        canvas.width / img.naturalWidth,
        canvas.height / img.naturalHeight,
      );
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      ctx.globalAlpha = 1;
    };

    /**
     * Draws at a fractional frame position, cross-fading the two frames
     * either side of it. With only 32 frames spread over a long scroll each
     * one would otherwise hold for ~75px and visibly snap; blending turns
     * that into continuous movement.
     */
    const drawAt = (exact: number) => {
      const lower = Math.floor(exact);
      const upper = Math.min(frames.length - 1, lower + 1);
      const blend = exact - lower;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      paint(imagesRef.current[lower], 1);
      if (upper !== lower && blend > 0.01) {
        paint(imagesRef.current[upper], blend);
      }
    };

    const tick = () => {
      const rect = wrapper.getBoundingClientRect();

      // Skip entirely when the section is nowhere near the viewport.
      const nearby =
        rect.bottom > -window.innerHeight &&
        rect.top < window.innerHeight * 2;

      if (nearby) {
        // Progress starts the moment the section's top edge appears at the
        // bottom of the viewport, and completes as the sticky frame releases —
        // so the sequence is already turning while the section scrolls into
        // place, rather than waiting until it's aligned with the viewport top.
        const travel = rect.height;
        const target =
          travel <= 0
            ? 0
            : Math.min(1, Math.max(0, (window.innerHeight - rect.top) / travel));

        // Ease toward the scroll position rather than tracking it exactly, so
        // abrupt wheel or trackpad jumps arrive as motion instead of a jolt.
        smoothed =
          smoothed === null ? target : smoothed + (target - smoothed) * 0.2;

        const exact = smoothed * (frames.length - 1);
        if (Math.abs(exact - lastDrawn) > 0.002) {
          lastDrawn = exact;
          drawAt(exact);
        }
      }

      raf = requestAnimationFrame(tick);
    };

    sizeCanvas();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", sizeCanvas);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sizeCanvas);
    };
  }, [ready, frames]);

  return (
    <div ref={wrapperRef} className={className}>
      {/* svh so the pinned frame fits the visible area on a phone; with vh its
          bottom sits behind the address bar, and the frame resizes mid-scroll
          as that bar hides. */}
      <div className="sticky top-0 h-[100svh] w-full flex items-center justify-center overflow-hidden">
        {backdrop}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={alt}
          /* Taller than the viewport on purpose: the frames carry roughly 30%
             transparent padding, so the can itself paints at about 69% of this
             box. At full height it stands clearly proud of the banner strip
             behind it, overhanging top and bottom the way the composition
             calls for; the empty padding is what the frame clips. */
          className="relative z-10 h-[100svh] w-auto max-w-full"
        />
      </div>
    </div>
  );
}
