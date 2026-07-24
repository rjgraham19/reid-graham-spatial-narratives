import { useEffect, useRef, type RefObject } from "react";

// Matches the exported frame rate of the source video.
const SOURCE_FPS = 30;

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

    let totalFrames = 0;
    let raf = 0;
    let lastFrame = -1;

    const onLoaded = () => {
      totalFrames = Math.max(1, Math.round((video.duration || 0) * SOURCE_FPS));
    };
    video.addEventListener("loadedmetadata", onLoaded);
    if (video.readyState >= 1) onLoaded();

    // Continuous rAF loop, not gated by scroll events — Lenis's own smoothing
    // means scroll events don't fire at a steady rate, so we just read the
    // current scroll position fresh every animation frame instead. We only
    // ever seek when the target actually lands on a new source frame —
    // seeking to a sub-frame time that resolves to the same visible frame
    // just wastes a decode and is what made the scrub feel stepped/janky.
    const tick = () => {
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total <= 0
          ? rect.top <= 0
            ? 1
            : 0
          : Math.min(1, Math.max(0, -rect.top / total));

      if (totalFrames > 1) {
        const targetFrame = Math.round(progress * (totalFrames - 1));
        if (targetFrame !== lastFrame) {
          lastFrame = targetFrame;
          video.currentTime = targetFrame / SOURCE_FPS;
        }
      }
      onProgressRef.current?.(progress);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      cancelAnimationFrame(raf);
    };
  }, [wrapperRef, videoRef]);
}
