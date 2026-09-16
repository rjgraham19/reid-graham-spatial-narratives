import { useEffect, useRef, type RefObject } from "react";

/** Absolute position, never elapsed time: reversing scroll retraces the pose. */
export function useScrollProgress(
  wrapperRef: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void,
  enabled = true,
) {
  const callback = useRef(onProgress);
  callback.current = onProgress;
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!enabled || !wrapper) return;
    let frame = 0;
    let near = true;
    let previous = -1;
    const read = () => {
      frame = 0;
      const rect = wrapper.getBoundingClientRect();
      const sticky = wrapper.firstElementChild as HTMLElement | null;
      const travel = rect.height - (sticky?.clientHeight ?? window.innerHeight);
      const progress = Math.min(1, Math.max(0, travel > 0 ? -rect.top / travel : 0));
      if (progress !== previous) {
        previous = progress;
        callback.current(progress);
      }
    };
    const schedule = () => {
      if (near && !frame) frame = requestAnimationFrame(read);
    };
    const keepProgressOnResize = () => {
      if (previous > 0 && previous < 1) {
        const rect = wrapper.getBoundingClientRect();
        const sticky = wrapper.firstElementChild as HTMLElement | null;
        const travel = rect.height - (sticky?.clientHeight ?? window.innerHeight);
        window.scrollTo({ top: rect.top + window.scrollY + previous * travel, behavior: "instant" });
      }
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => {
      near = entry.isIntersecting;
      // Read once on exit too, so a large scroll reaches the exact endpoint.
      if (!frame) frame = requestAnimationFrame(read);
    }, { rootMargin: "200px 0px" });
    observer.observe(wrapper);
    const resize = new ResizeObserver(keepProgressOnResize);
    resize.observe(wrapper);
    if (wrapper.firstElementChild) resize.observe(wrapper.firstElementChild);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", keepProgressOnResize, { passive: true });
    read();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", keepProgressOnResize);
    };
  }, [wrapperRef, enabled]);
}
