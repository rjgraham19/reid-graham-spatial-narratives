import { useEffect, useRef, useState } from "react";
import type { LollaControls, LollaView } from "./lolla-scene";
import poster from "@/assets/rg/lollapalooza-render-night-poster.jpg";
import { AssetFrame, ASSET_CONTROL_CLASS, ASSET_STAGE_CLASS } from "@/components/asset-frame";

/* Give up on the model after this long and leave the rendering in place
   (with a retry) rather than an open-ended "Loading…". */
const LOAD_TIMEOUT_MS = 30_000;

// Same labels and order as TownhouseViewer's view row.
const VIEWS: { label: string; view: LollaView }[] = [
  { label: "NE", view: "NE" },
  { label: "NW", view: "NW" },
  { label: "SE", view: "SE" },
  { label: "SW", view: "SW" },
];

/** Embedded directly in the page, not a popup: the model loads a little
 *  ahead of scroll, so by the time it arrives it's already sitting there
 *  live, at rest, showing the pavilion as photographed — no separate poster
 *  standing in for it. Orbit and zoom stay off until the visitor clicks in,
 *  which is also what triggers the roof-rise: one gesture, not a click that
 *  swaps to a different image. Gating it on a click rather than firing on
 *  scroll (the first version of this) is what keeps a casual scroll down
 *  the page scrolling the page — once the model turns interactive, hovering
 *  it and scrolling zooms the camera instead, same as any embedded 3D
 *  viewer, so that trade only kicks in once someone has actually opted in. */
export function LollaViewer() {
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<LollaControls | null>(null);
  // Set if the model is clicked before it's finished loading — the load
  // effect below fires the deferred reveal itself once `loaded` flips true.
  const pendingReveal = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [gableShown, setGableShown] = useState(false);
  const [errored, setErrored] = useState(false);
  // Bumped by "Try again" to re-run the load effect from scratch.
  const [attempt, setAttempt] = useState(0);

  // Load a little before the section arrives, so the model is already
  // sitting there live by the time it scrolls into view. Any failure — no
  // WebGL, the model or decoder failing to load, or the time limit — tears
  // down whatever was half-built and leaves the rendering showing.
  useEffect(() => {
    if (!stage.current || !host.current) return;
    let live = true; // false once unmounted, or once this attempt gave up
    let timer: number | undefined;
    const hostEl = host.current;
    const fail = () => {
      if (!live) return;
      live = false;
      window.clearTimeout(timer);
      controls.current?.dispose();
      controls.current = null;
      hostEl.replaceChildren();
      pendingReveal.current = false;
      setErrored(true);
    };
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        nearObserver.disconnect();
        timer = window.setTimeout(fail, LOAD_TIMEOUT_MS);
        import("./lolla-scene")
          .then(async ({ createLollaScene }) => {
            if (!live) return;
            const scene = createLollaScene(hostEl);
            controls.current = scene;
            await scene.load();
            if (!live) return;
            window.clearTimeout(timer);
            setLoaded(true);
          })
          .catch(fail);
      },
      { rootMargin: "600px 0px" },
    );
    nearObserver.observe(stage.current);
    return () => {
      live = false;
      window.clearTimeout(timer);
      nearObserver.disconnect();
      controls.current?.dispose();
      controls.current = null;
    };
  }, [attempt]);

  // If the model was clicked before it finished loading, fire the reveal it
  // deferred as soon as loading catches up.
  useEffect(() => {
    if (loaded && pendingReveal.current && controls.current) {
      pendingReveal.current = false;
      controls.current.reveal();
      setRevealed(true);
    }
  }, [loaded]);

  // Only hand the click to the scene once it has finished loading — before
  // that the scene ignores reveal(), so the click is queued instead and the
  // effect above plays it the moment loading completes.
  const activate = () => {
    if (revealed || errored) return;
    if (!loaded || !controls.current) {
      pendingReveal.current = true;
      return;
    }
    controls.current.reveal();
    setRevealed(true);
  };

  const retry = () => {
    setErrored(false);
    setLoaded(false);
    setRevealed(false);
    setAttempt((n) => n + 1);
  };

  return (
    <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10" aria-label="Lolla pavilion model">
      <AssetFrame
        label="Explore in 3D"
        /* ~1.74:1 — the point where the orthographic camera fits the model's
           width and its height together (see lolla-scene's resize). Wider
           and the camera starts showing past the ground plane into black. */
        aspect={1.74}
        accent="#E20074"
        ariaLabel="Club Magenta pavilion in 3D"
        reserveControls
        controls={revealed && (
          /* Under the model, not over it — same as the galleries. Only once
             the model is opened; `reserveControls` holds their space, so the
             page doesn't shift when they appear. */
          <div className="flex flex-wrap items-center justify-center animate-fade-in-fast" role="group" aria-label="Model views">
            {VIEWS.map((v) => (
              <button key={v.view} type="button" onClick={() => controls.current?.view(v.view)} aria-label={`${v.label} isometric view`} className={ASSET_CONTROL_CLASS}>
                {v.label}
              </button>
            ))}
            <span aria-hidden className="mx-2 h-4 w-px bg-foreground/20" />
            {/* "Gable" is a state to leave on or off, not a fifth view, so
                it's a switch rather than another preset. */}
            <button
              type="button"
              role="switch"
              aria-checked={gableShown}
              onClick={() => setGableShown(controls.current?.toggleGable() ?? false)}
              className={`${ASSET_CONTROL_CLASS} gap-2`}
            >
              Gable
              <span
                aria-hidden
                className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 motion-reduce:transition-none"
                style={{ background: gableShown ? "#E20074" : "rgba(255,255,255,0.25)" }}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none"
                  style={{ transform: gableShown ? "translateX(14px)" : "translateX(2px)" }}
                />
              </span>
            </button>
          </div>
        )}
        // Once open, the controls row speaks for itself — no hint under it.
        hint={errored || revealed ? undefined : "Click the model to explore"}
      >
        <div
          ref={stage}
          className={`${ASSET_STAGE_CLASS} bg-[#050507] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E20074]`}
          style={{ cursor: loaded && !revealed ? "pointer" : revealed ? "grab" : undefined }}
          onClick={activate}
          // Keyboard equivalent of the click, dropped once revealed — after
          // that the canvas itself takes tab focus for its own arrow-key orbit.
          role={!revealed && !errored ? "button" : undefined}
          tabIndex={!revealed && !errored ? 0 : undefined}
          aria-label={!revealed && !errored ? "Explore the pavilion in 3D" : undefined}
          onKeyDown={
            !revealed && !errored
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate();
                  }
                }
              : undefined
          }
        >
          {/* Only once opened, when the wheel zooms the model. Before that a
              scroll here is a page scroll and must stay with the smooth
              scroller, or the page jumps up and down mid-glide. */}
          {/* Hidden until the model is fully loaded, then faded in — so the
              first thing anyone sees is the model itself, never a half-built
              scene or a different image standing in for it. */}
          <div
            ref={host}
            className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
            style={{ opacity: loaded && !errored ? 1 : 0 }}
            data-lenis-prevent={revealed ? "" : undefined}
          />

          {/* The night rendering, only if the model can't load at all (no
              WebGL, failed download). It used to stand in while loading too,
              but swapping a render for the model read as a glitch. */}
          {errored && (
            <img
              src={poster}
              alt="Club Magenta pavilion at night (rendering)"
              decoding="async"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}

          {!loaded && !errored && (
            <p role="status" className="pointer-events-none absolute bottom-4 left-4 font-display text-[11px] font-extralight uppercase tracking-[0.14em] text-white/60">
              Loading model…
            </p>
          )}
          {errored && (
            <div className="absolute bottom-4 left-4 flex items-center gap-3 font-display text-[11px] font-extralight uppercase tracking-[0.14em] text-white/75">
              <span role="status">3D view unavailable</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  retry();
                }}
                className="underline underline-offset-4 text-white hover:text-white/80"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </AssetFrame>
    </section>
  );
}
