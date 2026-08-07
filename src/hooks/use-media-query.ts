import { useEffect, useState } from "react";

/**
 * A media query as React state.
 *
 * Returns `undefined` until the query has actually been measured in the
 * browser, rather than guessing `false`. The pages are server-rendered, and a
 * hook that guessed would have every phone render one frame of the desktop
 * treatment before correcting itself. `undefined` lets a caller render nothing
 * until it knows, which is the difference between a clean load and a flash of
 * the wrong layout.
 */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * Where the inset project panel is allowed to appear.
 *
 * 1024px rather than the 768px the rest of the site breaks at, because the
 * panel renders the project page inside an iframe at 90vw. At a 768px window
 * that frame is only ~700px wide, so the project inside would lay itself out
 * as a phone — the mobile layout, in a panel, on a desktop. From 1024 the
 * frame is ~920px and the project always gets its desktop layout, with no band
 * of widths where the two disagree.
 *
 * Below this, a tile is a plain link to the full page, which is what the phone
 * and tablet experience is meant to be anyway.
 */
export const PANEL_MIN_WIDTH = 1024;

export function useCanShowPanel(): boolean | undefined {
  return useMediaQuery(`(min-width: ${PANEL_MIN_WIDTH}px)`);
}
