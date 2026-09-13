import { useEffect, useRef, useState } from "react";
import type { ExchangeView } from "./exchange-scene";

const ZONES: {
  id: ExchangeView;
  overline?: string;
  label: string;
  subtitle?: string;
  text?: string;
}[] = [
  { id: "overall", label: "Entire Facility" },
  {
    id: "nibi",
    overline: "ZONE 1",
    label: "Nibi Oasis",
    subtitle: "Exchange of Vitality",
    text: "A public commons in the former retention basin, where cascading water and cedar walkways offer purification and renewal.",
  },
  {
    id: "wavescape",
    overline: "ZONE 2",
    label: "Wavescapes",
    subtitle: "Exchange of Rejuvenation",
    text: "Rippling water, resting pods, and illuminated channels create a place for healing and restoration.",
  },
  {
    id: "steam",
    overline: "ZONE 3",
    label: "Steam Sanctuary",
    subtitle: "Exchange of Power",
    text: "The deepest gathering space, where cedar-infused steam supports listening, communication, and water stewardship.",
  },
];

/** Loads a little ahead of scroll (same pattern as the Lolla pavilion
 *  viewer) so the whole facility is already sitting there rendered by the
 *  time this section arrives — no click needed to see it. A click only
 *  ever drags the camera; scroll-wheel zoom is switched off in the scene
 *  itself so an ordinary scroll never gets caught by the model and always
 *  keeps moving the page. */
export function ExchangeViewer() {
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<Awaited<
    ReturnType<(typeof import("./exchange-scene"))["createExchangeScene"]>
  > | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [view, setView] = useState<ExchangeView>("overall");

  useEffect(() => {
    if (!stage.current || !host.current) return;
    let cancelled = false;
    const hostEl = host.current;
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        nearObserver.disconnect();
        import("./exchange-scene")
          .then(async ({ createExchangeScene }) => {
            if (cancelled) return;
            const scene = createExchangeScene(hostEl);
            controls.current = scene;
            await scene.load();
            if (!cancelled) setReady(true);
          })
          .catch(() => {
            if (!cancelled) setError(true);
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

  const selectZone = (id: ExchangeView) => {
    setView(id);
    controls.current?.select(id);
  };

  const zoneText = ZONES.find((z) => z.id === view);

  return (
    <section className="pt-4 pb-10" aria-label="Explore the Exchange Facility">
      <div
        className="flex flex-wrap gap-2 mb-4 px-6 md:px-12 lg:px-16"
        role="group"
        aria-label="Facility view"
      >
        {ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            aria-pressed={view === z.id}
            onClick={() => selectZone(z.id)}
            className={`rounded-md border px-4 py-2.5 text-left text-sm transition-colors ${
              view === z.id
                ? "bg-[#84a8ed] text-black border-[#84a8ed]"
                : "border-white/20 hover:bg-white/10"
            }`}
          >
            {z.overline && (
              <span
                className={`block text-[9px] tracking-[0.2em] uppercase ${
                  view === z.id ? "text-black/60" : "text-foreground/45"
                }`}
              >
                {z.overline}
              </span>
            )}
            {z.label}
          </button>
        ))}
      </div>

      {/* Full-bleed and tall — this is the page's real header image, not a
          boxed-in embed, so it needs to fill the viewport the moment the
          page opens rather than sit behind a rounded frame with page
          gutters on either side. */}
      <div
        ref={stage}
        className="relative w-full overflow-hidden bg-black"
        style={{ height: "clamp(480px, 85vh, 950px)" }}
      >
        <div ref={host} className="absolute inset-0" data-lenis-prevent />

        {!ready && (
          <p
            role="status"
            className="pointer-events-none absolute bottom-6 left-6 text-xs uppercase tracking-[0.18em] text-white/60"
          >
            {error ? "The model could not load." : "Loading the facility…"}
          </p>
        )}

        {/* Zone copy, inside the viewport so it never gets skipped past on a
            scroll — set on the right, since the scene shifts the selected
            zone's geometry there to make room for it. Only overlaid from lg:
            below that the canvas is too short/narrow for text to sit over it
            without covering the model, so it drops to a plain block under
            the canvas instead (still inside this same component). */}
        {ready && zoneText?.text && (
          <div className="hidden lg:block absolute right-6 top-1/2 max-w-xs -translate-y-1/2 rounded-md bg-black/50 p-4 backdrop-blur-sm">
            <h3 className="font-display text-xl mb-1">{zoneText.label}</h3>
            <p className="text-xs uppercase tracking-[0.15em] text-white/50 mb-2">
              {zoneText.subtitle}
            </p>
            <p className="text-sm leading-relaxed text-white/80">{zoneText.text}</p>
          </div>
        )}

        {/* Floating zoom / reset puck — small, translucent, recedes until
            hovered so it never competes with the model itself. */}
        {ready && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-1.5 py-1.5 opacity-50 backdrop-blur-md transition-opacity duration-200 hover:opacity-100">
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              onClick={() => controls.current?.zoomIn()}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="7" cy="7" r="5" />
                <path d="M7 4.6v4.8M4.6 7h4.8M11 11l3.5 3.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              onClick={() => controls.current?.zoomOut()}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="7" cy="7" r="5" />
                <path d="M4.6 7h4.8M11 11l3.5 3.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Reset view"
              title="Reset view"
              onClick={() => controls.current?.resetView()}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M13 8A5 5 0 1 1 11.4 4.4" strokeLinecap="round" />
                <path d="M13 3v3.5H9.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Zone copy for anything below lg, below the canvas but still inside
          this component. */}
      {ready && zoneText?.text && (
        <div className="lg:hidden mt-4 px-6 md:px-12 lg:px-16">
          <h3 className="font-display text-xl mb-1">{zoneText.label}</h3>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/50 mb-2">
            {zoneText.subtitle}
          </p>
          <p className="text-sm leading-relaxed text-foreground/70">{zoneText.text}</p>
        </div>
      )}
    </section>
  );
}
