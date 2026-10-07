import { useEffect, useRef, useState } from "react";

/**
 * A video that behaves like an animated visual rather than a player:
 * no controls, muted, looping, and it starts itself once scrolled into
 * view (and pauses again when it leaves, so offscreen videos aren't
 * burning CPU on long pages).
 *
 * Muted playback is what makes programmatic play() permissible without a
 * user gesture under browser autoplay policies; the promise is still
 * guarded since a browser may refuse regardless. If it does, the native
 * controls appear so the visitor can start it themselves.
 *
 * Reduced motion: nothing starts on its own. A one-shot clip is shown on
 * its final frame (the composition it's meant to rest on); a looping one
 * waits on its first frame with controls.
 */
export function InViewVideo({
  src,
  className,
  playOnce = false,
}: {
  src: string;
  className?: string;
  /**
   * Run the clip a single time, the first time it's scrolled into view, and
   * then leave it resting on its final frame — so it reads as a still image
   * that animated once, rather than a video on a loop.
   */
  playOnce?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (playOnce) {
        const toEnd = () => {
          if (Number.isFinite(video.duration)) video.currentTime = video.duration;
        };
        if (video.readyState >= 1) toEnd();
        else video.addEventListener("loadedmetadata", toEnd, { once: true });
      } else {
        setShowControls(true);
      }
      return;
    }

    let played = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          if (playOnce && played) return;
          video
            .play()
            .then(() => {
              // Only a playback that actually started counts as the one
              // play — stop watching then, so scrolling back past it
              // doesn't restart the animation.
              played = true;
              if (playOnce) observer.disconnect();
            })
            .catch(() => {
              // Autoplay refused: hand the visitor the controls.
              setShowControls(true);
            });
        } else if (!playOnce) {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [playOnce]);

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      loop={!playOnce}
      playsInline
      controls={showControls}
      // Fully buffered ahead of time for the one-shot case: it gets a single
      // chance to play, so it shouldn't stall partway through.
      preload={playOnce ? "auto" : "metadata"}
      className={className}
    />
  );
}
