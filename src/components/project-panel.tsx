import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { GlassButton } from "./glass-button";

/**
 * Opens a project as an inset panel over the feed, rather than as a full page.
 *
 * DESKTOP ONLY. The caller decides — see `useCanShowPanel` — and below that
 * width a tile is a plain link to the full project page, with no panel and no
 * clickable perimeter. A phone has no room to be showing one page inside
 * another, and the backdrop would put a tap target over the whole screen.
 *
 * The project renders in an iframe, and that is the whole trick. Three of the
 * project pages are built on scroll animations that measure the browser
 * window — the TaB can sequence and the Lollapalooza record scrub each read
 * window.innerHeight, and both use full-height frames inside a 300–400vh
 * runway. In an ordinary modal those would still measure the window rather
 * than the panel, so the sections would overflow their container and the
 * scroll maths driving the animations would track against the wrong height.
 *
 * Giving the panel its own document makes its window the panel: 100vh,
 * 100svh and innerHeight all resolve to the panel's own size, so every project
 * page keeps working exactly as it does today with no changes to any of them.
 * Which is the requirement — same pages, smaller frame.
 *
 * The address bar is kept in step by the caller's router state, so back closes
 * the panel and the link stays shareable, while a direct visit to the same URL
 * still renders the full page as before.
 */
export function ProjectPanel({
  url,
  title,
  onClose,
  prototypeGlass = false,
}: {
  url: string;
  title: string;
  onClose: () => void;
  /**
   * PROTOTYPE — swaps the neutral glass perimeter for the tinted magenta
   * treatment. Set for Lollapalooza only, and the rules behind it are gated
   * to 1024px and up. See the marked block in styles.css; removing that
   * block and this prop takes the experiment out entirely.
   */
  prototypeGlass?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<Element | null>(null);

  // Close on Escape. Captured on the parent document; the iframe gets its own
  // listener once it loads, since key events inside it don't bubble out here.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Hold the feed still behind the panel, and put focus back where it was.
  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      (returnFocusRef.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  const onFrameLoad = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      // Same-origin, so the panel's document can be tidied from here.
      // Guarded throughout: if it ever isn't reachable, the panel still works
      // and the outer listener and backdrop still close it.
      try {
        const doc = e.currentTarget.contentDocument;
        if (!doc) return;

        doc.addEventListener("keydown", (ev) => {
          if ((ev as KeyboardEvent).key === "Escape") onClose();
        });

        // Hide the panel's scrollbar. It sits inside the rounded corners and
        // reads as a browser chrome artefact rather than part of the page.
        // Scrolling itself is untouched.
        const style = doc.createElement("style");
        style.textContent =
          "html{scrollbar-width:none}html::-webkit-scrollbar{display:none}";
        doc.head.appendChild(style);

      } catch {
        /* cross-origin — outer close paths still work */
      }
    },
    [onClose],
  );

  return createPortal(
    <div
      /* The scope carries the panel-width variable the prototype's panel and
         both controls read, so they stay in step from one declaration. */
      className={`fixed inset-0 z-[100] ${prototypeGlass ? "lolla-glass-scope" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Glass rather than a scrim. A heavy dark veil hid the feed, which made
          the panel read as a new page; a light, low-opacity tint over a
          gentler blur keeps the feed legible underneath, so it stays obvious
          that the page is only inset and that clicking out returns to it. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close project"
        className={`absolute inset-0 h-full w-full cursor-zoom-out ${
          prototypeGlass
            ? "lolla-glass-perimeter"
            : "bg-white/[0.07] backdrop-blur-[5px]"
        }`}
      />

      {/* Panel top is a fixed distance rather than a viewport fraction, so the
          controls above it always have room. The previous calc(4vh - 2.6rem)
          went negative on shorter screens and clipped the close button off the
          top of the window. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`absolute inset-x-[3vw] bottom-[4vh] top-[78px] overflow-hidden rounded-lg bg-background outline-none md:inset-x-[5vw] ${
          prototypeGlass
            ? "lolla-glass-panel"
            : "shadow-[0_30px_90px_rgba(0,0,0,0.7)]"
        }`}
      >
        {/* panel=1 tells the project page it's inset, so it drops the site
            nav — inside the panel the wordmark and top-level links belong to
            the page behind, and repeating them reads as a site within a site.
            The back link is all the navigation the panel needs. */}
        <iframe
          src={`${url}?panel=1`}
          title={title}
          onLoad={onFrameLoad}
          className="h-full w-full border-0"
        />
      </div>

      {/* Both controls live in the panel's chrome rather than in the page
          inside it, so they stay put while the project scrolls. The back link
          used to be the first thing in the page itself and scrolled away with
          it; here it mirrors the close button and is always reachable. */}
      {/* Glass tiles, the same for every project — they take their tint from
          the perimeter behind them rather than carrying one of their own, so
          a tinted perimeter needs no matching button treatment. */}
      <GlassButton
        onClick={onClose}
        className="panel-control-start absolute left-[3vw] top-[34px] z-10 md:left-[5vw]"
      >
        {/* Drawn rather than typed. The arrow was a glyph with a shaft, which
            at this size read as a dash with a point on it; a bare chevron is
            the mark that belongs on a cut-glass control, and as an SVG its
            weight and proportions don't shift with the font. */}
        <svg
          aria-hidden
          viewBox="0 0 8 14"
          width="6"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 1 1.5 7l5 6" />
        </svg>
        Back to Projects
      </GlassButton>

      <GlassButton
        onClick={onClose}
        aria-label="Close project"
        className="panel-control-end absolute right-[3vw] top-[34px] z-10 md:right-[5vw]"
      >
        Close ✕
      </GlassButton>
    </div>,
    document.body,
  );
}
