import { useEffect, useRef, type RefObject } from "react";

/**
 * Ties a video's playback position to scroll progress through a tall wrapper element.
 * Scrolling down plays the video forward; scrolling up reverses it. No autoplay —
 * the video only moves in response to scroll.
 */
export function useScrollScrubVideo(
  wrapperRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  onProgress?: (progress: number) => void,
) {
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    if (!wrapper || !video) return;

    let duration = 0;
    let raf = 0;
    let lastProgress = -1;

    const onLoaded = () => {
      duration = video.duration || 0;
    };
    video.addEventListener("loadedmetadata", onLoaded);
    if (video.readyState >= 1) onLoaded();

    // Continuous rAF loop, not gated by scroll events — Lenis's own smoothing
    // means scroll events don't fire at a steady rate, so we just read the
    // current scroll position fresh every animation frame instead.
    const tick = () => {
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total <= 0
          ? rect.top <= 0
            ? 1
            : 0
          : Math.min(1, Math.max(0, -rect.top / total));

      if (progress !== lastProgress) {
        lastProgress = progress;
        if (duration) video.currentTime = progress * duration;
        onProgressRef.current?.(progress);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      cancelAnimationFrame(raf);
    };
  }, [wrapperRef, videoRef]);
}
