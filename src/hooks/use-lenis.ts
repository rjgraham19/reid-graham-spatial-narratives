import { useEffect } from "react";
import Lenis from "lenis";

let pageScroll: Lenis | null = null;

/** Programmatic reveals use the same scroll controller as wheel gestures. */
export function scrollToReveal(element: HTMLElement) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (pageScroll) {
    pageScroll.resize();
    pageScroll.scrollTo(element, { offset: -112, immediate: reduced, force: true });
  } else {
    element.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
  }
}

/** Site-wide smooth scrolling. Individual pages can still layer their own motion on top.
 *  Skipped entirely for visitors with reduced motion: the browser's own
 *  scrolling is left alone (and scrollToReveal falls back to an instant jump). */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });
    pageScroll = lenis;

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      if (pageScroll === lenis) pageScroll = null;
    };
  }, []);
}
