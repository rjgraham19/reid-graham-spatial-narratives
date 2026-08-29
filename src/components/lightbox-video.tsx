import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The video as it appears *enlarged* in the project lightbox — the one place
 * a project video gets real transport controls. Inline in the gallery it
 * stays a silent, looping, controlless moving image (see the gallery loop in
 * work.$hub.$slug.tsx); those affordances only make sense once the clip is
 * blown up and the viewer has clearly chosen to look at it.
 *
 * The bar is deliberately minimal: a play/pause toggle and a draggable
 * progress rail, nothing else. It auto-hides a couple of seconds after the
 * last interaction while the video is playing, and stays put whenever the
 * video is paused or a scrub is in progress. The rail fill and thumb take
 * the project accent from `--accent-color` (set on the lightbox wrapper),
 * falling back to white for a project with no accent.
 *
 * Clicking the video toggles play/pause rather than closing the lightbox —
 * the caller closes via its own ✕ control or a click on the dark margin
 * around this element, which still works because the root here stops click
 * propagation.
 */
export function LightboxVideo({
  src,
  zoom = 1,
  animateZoom = true,
}: {
  src: string;
  /** Pinch / wheel zoom factor from the lightbox, applied to the video only. */
  zoom?: number;
  /** False mid-pinch, so the scale tracks the fingers with no easing lag. */
  animateZoom?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);
  const scrubbing = useRef(false);

  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..1
  const [controlsShown, setControlsShown] = useState(true);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  const armHideTimer = useCallback(() => {
    clearHideTimer();
    const v = videoRef.current;
    // Controls linger while paused or mid-scrub — only a playing, untouched
    // clip lets them fade.
    if (!v || v.paused || scrubbing.current) return;
    hideTimer.current = window.setTimeout(() => setControlsShown(false), 2200);
  }, [clearHideTimer]);

  const revealControls = useCallback(() => {
    setControlsShown(true);
    armHideTimer();
  }, [armHideTimer]);

  useEffect(() => {
    revealControls();
    return clearHideTimer;
  }, [revealControls, clearHideTimer]);

  // Mirror the element's own state into React — covers loop wrap-around,
  // stalls, and any play/pause we didn't initiate.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (!scrubbing.current && v.duration) setProgress(v.currentTime / v.duration);
    };
    const onPlay = () => {
      setPlaying(true);
      armHideTimer();
    };
    const onPause = () => {
      setPlaying(false);
      setControlsShown(true);
      clearHideTimer();
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [armHideTimer, clearHideTimer]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
    revealControls();
  }, [revealControls]);

  const seekToClientX = useCallback((clientX: number) => {
    const v = videoRef.current;
    const track = trackRef.current;
    if (!v || !track || !v.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setProgress(ratio);
    v.currentTime = ratio * v.duration;
  }, []);

  const onScrubDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      scrubbing.current = true;
      clearHideTimer();
      trackRef.current?.setPointerCapture(e.pointerId);
      seekToClientX(e.clientX);
    },
    [clearHideTimer, seekToClientX],
  );

  const onScrubMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (scrubbing.current) seekToClientX(e.clientX);
    },
    [seekToClientX],
  );

  const onScrubUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubbing.current) return;
      scrubbing.current = false;
      trackRef.current?.releasePointerCapture(e.pointerId);
      armHideTimer();
    },
    [armHideTimer],
  );

  const accentFill = { background: "var(--accent-color, #ffffff)" } as const;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      onClick={(e) => e.stopPropagation()}
      onPointerMove={revealControls}
      onPointerLeave={armHideTimer}
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        onClick={togglePlay}
        style={{
          transform: `scale(${zoom})`,
          transition: animateZoom ? "transform 120ms ease-out" : "none",
        }}
        className="max-h-full max-w-full object-contain cursor-pointer select-none"
      />

      {/* Auto-hiding transport bar. `pointer-events-none` while hidden so it
          never swallows a click meant for the video or the dark margin. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300 ${
          controlsShown ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div
          ref={trackRef}
          onPointerDown={onScrubDown}
          onPointerMove={onScrubMove}
          onPointerUp={onScrubUp}
          onPointerCancel={onScrubUp}
          onTouchStart={(e) => e.stopPropagation()}
          className="group/track relative flex h-6 flex-1 cursor-pointer items-center"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full" style={{ ...accentFill, width: `${progress * 100}%` }} />
          </div>
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover/track:opacity-100"
            style={{ ...accentFill, left: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* Drawn rather than glyphs, to match BackChevron / CloseMark — weight stays
   put regardless of the font, and `currentColor` carries the icon with the
   button's own text colour. */
function PlayIcon() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" fill="currentColor">
      <path d="M3 1.5v9l7-4.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" fill="currentColor">
      <rect x="2.5" y="1.5" width="2.5" height="9" rx="0.4" />
      <rect x="7" y="1.5" width="2.5" height="9" rx="0.4" />
    </svg>
  );
}
