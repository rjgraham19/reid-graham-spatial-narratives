import { useEffect, type RefObject } from "react";

/**
 * Scroll-triggered fade for a project page's gallery images.
 *
 * Most gallery <img>s on the project page aren't wrapped in a RevealBlock, and
 * some carried a load-time CSS fade (`animate-image-fade`) that finished while
 * they were still below the fold — so by the time a visitor scrolled to them
 * there was nothing to see. This hook gives every design-mapped image below
 * the fold a fade that plays when it actually scrolls into view, once.
 *
 * Pace comes from the page's `data-reveal-pace` attribute (see styles.css,
 * `[data-scroll-fade]`): quick = 0.5s fade + small lift, slow = 0.8s
 * opacity-only fade on the softer curve.
 *
 * Images already on screen at mount (the hero) keep their own entrance, and
 * images inside a RevealBlock (`data-reveal`) are left to it. State is kept
 * in a data attribute React never sets, so re-renders can't wipe it. Skipped
 * for reduced motion and in Design Mode, where hidden images would get in
 * the way of editing.
 */
export function useScrollImageFade(rootRef: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || import.meta.env.MODE === "design") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fold = window.innerHeight;
    const imgs = Array.from(
      root.querySelectorAll<HTMLImageElement>('img[data-design-kind="image"]'),
    ).filter((img) => {
      if (img.closest("[data-reveal]") || inCarousel(img, root)) return false;
      return img.getBoundingClientRect().top > fold;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.scrollFade = "in";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0 },
    );
    for (const img of imgs) {
      img.dataset.scrollFade = "pending";
      observer.observe(img);
    }
    return () => {
      observer.disconnect();
      for (const img of imgs) delete img.dataset.scrollFade;
    };
  }, [rootRef, key]);
}

/* Slides parked off to the side of a carousel only "enter the viewport" when
 * swiped to — a fade there reads as the slide arriving blank, like a loading
 * lag. Any image inside a sideways-scrolling or clipped track is left alone. */
function inCarousel(img: HTMLElement, root: HTMLElement): boolean {
  if (img.closest('[aria-roledescription="carousel"]')) return true;
  for (let el = img.parentElement; el && el !== root; el = el.parentElement) {
    const { overflowX } = getComputedStyle(el);
    if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth + 1) {
      return true;
    }
  }
  return false;
}
