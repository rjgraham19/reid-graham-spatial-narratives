import { useEffect, useRef, useState } from "react";
import type { LollaControls } from "./lolla-scene";
import poster from "@/assets/rg/lollapalooza-render-night-poster.jpg";
import { AssetFrame, ASSET_STAGE_CLASS } from "@/components/asset-frame";
import { ModelToggle, ModelViewControls } from "@/components/model-view-controls";

/* Give up on the model after this long and leave the rendering in place
   (with a retry) rather than an open-ended "Loading…". */
const LOAD_TIMEOUT_MS = 30_000;

/** Embedded directly in the page, not a popup, and live from the start:
 *  the model loads a little ahead of scroll, the roof-rise plays once it is
 *  actually on screen, and from then on it can be dragged and the view
 *  buttons and Gable switch work — no click to opt in first. The view row
 *  is on show from the start (inactive until the model is ready), so it is
 *  clear straight away that this is something to explore. The mouse wheel
 *  is left to the page (see lolla-scene), so scrolling past never gets
 *  caught by the model. */
export function LollaViewer() {
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<LollaControls | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [gableShown, setGableShown] = useState(false);
  const [errored, setErrored] = useState(false);
  // Bumped by "Try again" to re-run the load effect from scratch.
  const [attempt, setAttempt] = useState(0);

  // Load a little before the section arrives, so the model is already
  // sitting there by the time it scrolls into view. Any failure — no
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

  // The roof-rise waits until the model is properly on screen, so nobody
  // misses it by having it play while still below the fold.
  useEffect(() => {
    if (!stage.current) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    io.observe(stage.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (loaded && onScreen && !revealed && controls.current) {
      controls.current.reveal();
      setRevealed(true);
    }
  }, [loaded, onScreen, revealed]);

  const retry = () => {
    setErrored(false);
    setLoaded(false);
    setRevealed(false);
    setGableShown(false);
    setAttempt((n) => n + 1);
  };

  return (
    <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10" aria-label="Lolla pavilion model">
      <AssetFrame
        label="Explore in 3D"
        hint="Drag to rotate · use presets on touch; swipe vertically to scroll"
        /* ~1.74:1 — the point where the orthographic camera fits the model's
           width and its height together (see lolla-scene's resize). Wider
           and the camera starts showing past the ground plane into black. */
        aspect={1.74}
        accent="#E20074"
        ariaLabel="Club Magenta pavilion in 3D"
        reserveControls
        controls={
          !errored && (
            /* Under the model, not over it — same as the galleries. Inactive
               until the model is in and its roof has risen. */
            <ModelViewControls disabled={!revealed} onView={(v) => controls.current?.view(v)}>
              <ModelToggle
                label="Gable"
                on={gableShown}
                disabled={!revealed}
                onToggle={() => setGableShown(controls.current?.toggleGable() ?? false)}
              />
            </ModelViewControls>
          )
        }
      >
        <div
          ref={stage}
          className={`${ASSET_STAGE_CLASS} bg-[#050507]`}
          style={{ cursor: revealed ? "grab" : undefined }}
        >
          {/* Hidden until the model is fully loaded, then faded in — so the
              first thing anyone sees is the model itself, never a half-built
              scene or a different image standing in for it. */}
          <div
            ref={host}
            className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
            style={{ opacity: loaded && !errored ? 1 : 0 }}
          />

          {/* The night rendering, only if the model can't load at all (no
              WebGL, failed download). */}
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
                onClick={retry}
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
