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

    const onLoaded = () => {
      duration = video.duration || 0;
    };
    video.addEventListener("loadedmetadata", onLoaded);
    if (video.readyState >= 1) onLoaded();

    const update = () => {
      raf = 0;
      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress =
        total <= 0
          ? rect.top <= 0
            ? 1
            : 0
          : Math.min(1, Math.max(0, -rect.top / total));
      if (duration) video.currentTime = progress * duration;
      onProgressRef.current?.(progress);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [wrapperRef, videoRef]);
}
