import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CloseMark, GlassButton } from "./glass-button";

/**
 * How long the panel takes to fade out before unmounting.
 *
 * There was an expand-from-the-tile / collapse-back-into-it animation here.
 * It's gone: scaling the panel also scales the iframe inside it, so the whole
 * project page stretched and squashed through the transform, and the controls
 * rode along on top of the nav while it played. A fade does the job of
 * covering the state change without deforming anything.
 */
const CLOSE_MS = 220;
/** Matches --ease-cinematic, which WAAPI can't read from a custom property. */
const CINEMATIC = "cubic-bezier(0.32, 0.72, 0, 1)";

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
  accentHue,
  accentSaturation = 100,
}: {
  url: string;
  title: string;
  onClose: () => void;
  /**
   * The project's tint, straight from its `accentHue` in projects.ts. Left
   * undefined the overlay falls back to neutral smoked glass, so a project
   * needs no overlay entry at all to open correctly.
   */
  accentHue?: number;
  /** Peak saturation, 0–100. Only worth setting for a shrill hue. */
  accentSaturation?: number;
}) {
  const tinted = typeof accentHue === "number";
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<Element | null>(null);
  /** Guards against a second exit being triggered mid-close. */
  const closingRef = useRef(false);
  /**
   * True while the project page inside the frame has its image viewer open.
   * The project's own close hides for the duration, so there's never a pair
   * of × marks on screen competing to be the one that dismisses the image.
   */
  const [viewerOpen, setViewerOpen] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);
  useEffect(() => () => observerRef.current?.disconnect(), []);

  /**
   * The single exit. Back, the perimeter and Escape all come through here, so
   * there is one close path rather than three that could drift apart. Fades
   * the panel and its tint out together, then unmounts.
   */
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const panel = panelRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !panel) {
      onClose();
      return;
    }

    /* The close must not depend on the animation reporting back. A browser
       that suspends animations — a backgrounded tab, most obviously — never
       resolves `finished`, and the panel would be stranded open with no way
       out. Whichever arrives first wins, and the guard makes the second a
       no-op. */
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      onClose();
    };
    const failsafe = window.setTimeout(finish, CLOSE_MS + 150);

    const fade = panel.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: CLOSE_MS,
      easing: CINEMATIC,
      fill: "forwards",
    });
    /* The tint goes with it. A WAAPI animation outranks the CSS
       `overlay-fade-in`, so this wins over that rule's held end state. */
    overlayRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: CLOSE_MS,
      easing: "linear",
      fill: "forwards",
    });

    fade.finished
      .then(() => {
        window.clearTimeout(failsafe);
        finish();
      })
      .catch(finish);
  }, [onClose]);

  // Close on Escape. Captured on the parent document; the iframe gets its own
  // listener once it loads, since key events inside it don't bubble out here.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  /* Hold the feed still behind the panel, and put focus back where it was.

     `overflow: hidden` alone wasn't holding it still: making the document
     unscrollable clamps the scroll offset to zero, so the feed jumped to the
     top the moment the panel opened — visible right through the glass — and
     closing left the reader at the top of the page rather than at the tile
     they came from. Pinning the body at a negative offset keeps every pixel
     where it was, and the offset is scrolled back on the way out.

     This also keeps `originRect` valid: the tile stays at the same viewport
     position throughout, so the panel collapses back onto it. */
  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    const body = document.body;
    const y = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      Object.assign(body.style, previous);
      window.scrollTo(0, y);
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
          if ((ev as KeyboardEvent).key === "Escape") requestClose();
        });

        // Hide the panel's scrollbar. It sits inside the rounded corners and
        // reads as a browser chrome artefact rather than part of the page.
        // Scrolling itself is untouched.
        const style = doc.createElement("style");
        style.textContent =
          "html{scrollbar-width:none}html::-webkit-scrollbar{display:none}";
        doc.head.appendChild(style);

        /* Watch the frame for its image viewer opening and closing. The
           viewer lives in the project page, a document down; same-origin, so
           observing it directly is simpler and less brittle than adding a
           message channel to every project page for one boolean. */
        const check = () =>
          setViewerOpen(!!doc.querySelector('[role="dialog"][aria-modal="true"]'));
        check();
        const observer = new MutationObserver(check);
        observer.observe(doc.body, { childList: true, subtree: true });
        observerRef.current = observer;

      } catch {
        /* cross-origin — outer close paths still work */
      }
    },
    [requestClose],
  );

  const overlayVars = tinted
    ? ({
        "--overlay-hue": String(accentHue),
        "--overlay-sat": String(accentSaturation),
        "--overlay-alpha": "1",
      } as React.CSSProperties)
    : undefined;

  const dialog = createPortal(
    <div
      /* The scope carries the panel-width variable the panel reads, plus this
         project's tint. Setting the hue here rather than swapping a class
         means changing project only updates a custom property on an element
         that stays mounted — the glass shifts colour without the overlay
         being torn down and rebuilt. */
      className="project-overlay-scope fixed inset-0 z-[100]"
      style={overlayVars}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Glass rather than a scrim. A heavy dark veil hid the feed, which made
          the panel read as a new page; a light, low-opacity tint over a
          gentler blur keeps the feed legible underneath, so it stays obvious
          that the page is only inset and that clicking out returns to it. */}
      <button
        ref={overlayRef}
        type="button"
        onClick={requestClose}
        aria-label="Close project"
        className="project-overlay absolute inset-0 h-full w-full cursor-zoom-out"
      />

      {/* Behind the site header: black at the top easing down through the
          project's hue and out to nothing. Sits over the perimeter but under
          the panel, so it gives the header something to sit on without ever
          darkening the project's own content, and without drawing a bar.
          pointer-events-none so the perimeter underneath stays clickable. */}
      <div className="project-overlay-header-scrim pointer-events-none absolute inset-x-0 top-0 h-[150px]" />

      {/* Panel top is a fixed distance rather than a viewport fraction, so the
          controls above it always have room. The previous calc(4vh - 2.6rem)
          went negative on shorter screens and clipped the close button off the
          top of the window. */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="project-overlay-panel absolute inset-x-[3vw] bottom-[4vh] top-[78px] overflow-hidden rounded-lg bg-background outline-none md:inset-x-[5vw]"
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

      {/* The project's own close, in the window's upper-right corner. The only
          control belonging to the project — the site header outside the window
          handles everything else, and PROJECTS there already goes back to the
          feed, which is why the Back control is gone.

          Hidden while the frame's image viewer is up, so the viewer's own
          close is unambiguously the one that dismisses the image. */}
      {!viewerOpen && (
        <GlassButton
          icon
          onClick={requestClose}
          aria-label="Close project"
          className="panel-close absolute z-10"
        >
          <CloseMark />
        </GlassButton>
      )}
    </div>,
    document.body,
  );

  return dialog;
}
