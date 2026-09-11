import { useEffect, useRef, useState } from "react";
import type { LollaControls, LollaView } from "./lolla-scene";

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

  // Load a little before the section arrives, so the model is already
  // sitting there live by the time it scrolls into view.
  useEffect(() => {
    if (!stage.current || !host.current) return;
    let cancelled = false;
    const hostEl = host.current;
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        nearObserver.disconnect();
        import("./lolla-scene")
          .then(async ({ createLollaScene }) => {
            if (cancelled) return;
            const scene = createLollaScene(hostEl);
            controls.current = scene;
            await scene.load();
            if (!cancelled) setLoaded(true);
          })
          .catch(() => {
            if (!cancelled) setErrored(true);
          });
      },
      { rootMargin: "600px 0px" },
    );
    nearObserver.observe(stage.current);
    return () => {
      cancelled = true;
      nearObserver.disconnect();
      controls.current?.dispose();
      controls.current = null;
    };
  }, []);

  // If the model was clicked before it finished loading, fire the reveal it
  // deferred as soon as loading catches up.
  useEffect(() => {
    if (loaded && pendingReveal.current && controls.current) {
      pendingReveal.current = false;
      controls.current.reveal();
      setRevealed(true);
    }
  }, [loaded]);

  const activate = () => {
    if (revealed) return;
    if (controls.current) {
      controls.current.reveal();
      setRevealed(true);
    } else {
      pendingReveal.current = true;
    }
  };

  return (
    <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10" aria-label="Lolla pavilion model">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Interactive model</p>
          <h2 className="text-2xl font-medium">Club Magenta</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Step inside: orbit the space, pick your vantage point, and watch the gable tent take flight.
        </p>
      </div>

      <div
        ref={stage}
        /* Capped rather than full-bleed: an orthographic camera framed for a
           roughly-square stage starts showing past the edges of the ground
           plane — into open black — once the container gets wide enough,
           which on an ultrawide display is well before 100%. Capping the
           width keeps the aspect ratio within what the camera was actually
           framed for, on any screen. */
        className="relative mx-auto overflow-hidden rounded-md bg-[#050507]"
        style={{
          height: "clamp(340px, 65vh, 760px)",
          maxWidth: "1280px",
          cursor: loaded && !revealed ? "pointer" : revealed ? "grab" : undefined,
        }}
        onClick={activate}
        // Keyboard equivalent of the click, dropped once revealed — after
        // that the canvas itself takes tab focus for its own arrow-key orbit.
        role={!revealed ? "button" : undefined}
        tabIndex={!revealed ? 0 : undefined}
        aria-label={!revealed ? "Explore the pavilion in 3D" : undefined}
        onKeyDown={
          !revealed
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  activate();
                }
              }
            : undefined
        }
      >
        <div ref={host} className="absolute inset-0" data-lenis-prevent />

        {!loaded && !errored && (
          <p
            role="status"
            className="pointer-events-none absolute bottom-6 left-6 text-xs uppercase tracking-[0.18em] text-white/60"
          >
            Loading model…
          </p>
        )}
        {loaded && !revealed && (
          /* Set higher than dead-centre and landing on the gable — the
             magenta tent — rather than the plainer ground/seating below it,
             which is where a true vertical centre falls on this model. */
          <p className="pointer-events-none absolute inset-x-0 top-[32%] flex justify-center text-sm uppercase tracking-[0.18em] text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            Click to explore
          </p>
        )}
        {errored && (
          <p
            role="status"
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-foreground/70"
          >
            The 3D view could not load.
          </p>
        )}

        {revealed && (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 px-4 animate-fade-in-fast">
            {/* The buttons themselves went bare (NE/NW/SE/SW, no
                "isometric") to match Townhouse — this is what still tells a
                first-time visitor what the row does, without putting the
                word back on every button. */}
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
              Navigate Isometric Views
            </p>
            {/* Sized to sit inside the label's own width rather than
                Townhouse's larger touch-target buttons spilling wider than
                it — this row reads as one contained block, not two
                differently-scaled rows stacked on top of each other. */}
            <div className="flex justify-center gap-1.5">
              {VIEWS.map((v) => (
                <button
                  key={v.view}
                  type="button"
                  onClick={() => controls.current?.view(v.view)}
                  className="rounded border border-white/25 bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm hover:bg-white/10"
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {revealed && (
          /* Set apart from the camera presets rather than boxed in with
             them — "gable" is a state to leave on or off, not a fifth view
             to pick, so it sits in its own corner as a bare label + switch
             rather than another glass pill in the row below. */
          <button
            type="button"
            role="switch"
            aria-checked={gableShown}
            aria-label="Gable roof"
            onClick={() => setGableShown(controls.current?.toggleGable() ?? false)}
            className="absolute top-4 right-4 flex items-center gap-2 text-sm text-white animate-fade-in-fast"
          >
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">Gable</span>
            <span
              aria-hidden
              className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.5)] transition-colors duration-200"
              style={{ background: gableShown ? "#CD007F" : "rgba(255,255,255,0.35)" }}
            >
              <span
                className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ transform: gableShown ? "translateX(18px)" : "translateX(2px)" }}
              />
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
