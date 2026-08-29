import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Guarantees a headline fits its container's width — never clipped, never
 * broken mid-word — by trimming its font size when, and only when, it would
 * overflow.
 *
 * How it's meant to be wired:
 *   - the element sizes its font from `calc(<clamp> * var(--fit-scale, 1))`
 *   - this hook owns `--fit-scale`, starting at 1
 *   - after layout it measures `scrollWidth` vs `clientWidth`; if the content
 *     spills, it steps the scale down (to a floor) until it fits
 *
 * SSR-safe: the server renders at scale 1, i.e. the plain CSS clamp, which is
 * the right size for almost every title at almost every width. The hook only
 * does anything on the rare width / zoom / long-word combination where the
 * clamp alone would overflow, and because it shrinks the real font size the
 * box shrinks with it — no leftover gap under a scaled-down title.
 *
 * Re-measures on container resize and on `deps` change (e.g. the text itself).
 */
export function useFitText<T extends HTMLElement>(deps: unknown[] = [], floor = 0.62) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(1);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    // Measure from a clean slate each time so growing the window can also
    // give size back, not only take it away.
    el.style.setProperty("--fit-scale", "1");

    // Force a reflow read, then step down until it fits or we hit the floor.
    let s = 1;
    // `clientWidth` is the padded box; `scrollWidth` includes any overflow.
    // A one-pixel tolerance avoids thrashing on sub-pixel rounding.
    while (s > floor && el.scrollWidth - el.clientWidth > 1) {
      s = Math.max(floor, s - 0.03);
      el.style.setProperty("--fit-scale", s.toFixed(3));
    }
    setScale(s);
  }, [floor]);

  useEffect(() => {
    measure();

    const el = ref.current;
    if (!el) return;

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    if (ro) {
      ro.observe(el);
      if (el.parentElement) ro.observe(el.parentElement);
    }
    window.addEventListener("resize", measure);
    // Fonts loading in late can change metrics after the first pass.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  return { ref, scale };
}
