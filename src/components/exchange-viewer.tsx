import { useEffect, useRef, useState } from "react";
import type { ExchangeView } from "./exchange-scene";
const views: { id: ExchangeView; label: string; text: string }[] = [
  {
    id: "overall",
    label: "Whole facility",
    text: "An underground journey through three exchanges. Select a space to pull it forward and explore.",
  },
  {
    id: "section",
    label: "Section view",
    text: "The retained basin, connecting passages, and deepest vessel in a side-on view.",
  },
  {
    id: "nibi",
    label: "Nibi Oasis",
    text: "Exchange of Vitality — a public commons in the former retention basin, where cascading water and cedar water offer purification and renewal.",
  },
  {
    id: "wavescape",
    label: "Wavescape Space",
    text: "Exchange of Revitalization — rippling water, resting pods, and illuminated channels create a place for healing and restoration.",
  },
  {
    id: "steam",
    label: "Steam Sanctuary",
    text: "Exchange of Power — the deepest gathering space, where cedar-infused steam supports listening, communication, and water stewardship.",
  },
];
export function ExchangeViewer() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<Awaited<
    ReturnType<(typeof import("./exchange-scene"))["createExchangeScene"]>
  > | null>(null);
  const [active, setActive] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false);
  const [view, setView] = useState<ExchangeView>("overall"),
    [ground, setGround] = useState(true);
  useEffect(() => {
    if (!active || !host.current) return;
    let cancelled = false;
    let scene: typeof controls.current = null;
    setError(false);
    setReady(false);
    import("./exchange-scene")
      .then(async ({ createExchangeScene }) => {
        if (cancelled || !host.current) return;
        scene = createExchangeScene(host.current);
        controls.current = scene;
        await scene.load();
        if (!cancelled) {
          setReady(true);
          setView("overall");
          setGround(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          scene?.dispose();
          controls.current = null;
          setError(true);
        }
      });
    return () => {
      cancelled = true;
      scene?.dispose();
      controls.current = null;
    };
  }, [active]);
  return (
    <section className="px-6 md:px-12 lg:px-16 py-10" aria-label="Explore the Exchange Facility">
      <p className="text-xs tracking-[.2em] uppercase text-foreground/50 mb-3">
        Three spaces / One water journey
      </p>
      <h2 className="font-display text-2xl md:text-4xl mb-5">Beneath the surface</h2>
      <div
        className="relative overflow-hidden rounded-md bg-[#101526]"
        style={{ height: "clamp(420px, 72svh, 850px)" }}
      >
        {!active && (
          <img
            src="/models/exchange-section.png"
            alt="Section drawing showing the three spaces of the underground Exchange Facility"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain opacity-65"
          />
        )}
        <div ref={host} className="absolute inset-0" data-lenis-prevent />
        {!active && (
          <button
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black rounded-md px-6 py-3"
            onClick={() => setActive(true)}
          >
            Explore the facility in 3D
          </button>
        )}
        {active && !ready && (
          <div
            role="status"
            className="absolute bottom-6 left-6 right-6 bg-black/80 rounded p-3 text-white"
          >
            {error ? (
              <>
                The model could not load.{" "}
                <button className="underline" onClick={() => setActive(false)}>
                  Return to preview
                </button>
              </>
            ) : (
              "Loading the facility…"
            )}
          </div>
        )}
      </div>
      {ready && (
        <>
          <div className="flex flex-wrap gap-2 mt-5" role="group" aria-label="Model views">
            {views.map((v) => (
              <button
                key={v.id}
                aria-pressed={view === v.id}
                onClick={() => {
                  setView(v.id);
                  controls.current?.select(v.id);
                }}
                className={`px-4 py-3 rounded-md border text-sm transition-colors ${view === v.id ? "bg-[#b8baff] text-[#101526] border-[#b8baff]" : "border-white/20 hover:bg-white/10"}`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <label className="flex gap-2 items-center text-sm mt-4">
            <input
              type="checkbox"
              checked={ground}
              onChange={(e) => {
                setGround(e.target.checked);
                controls.current?.ground(e.target.checked);
              }}
            />
            Show surrounding ground
          </label>
        </>
      )}
      <p
        aria-live="polite"
        className="mt-5 max-w-3xl text-sm md:text-base text-foreground/65 leading-relaxed"
      >
        {views.find((v) => v.id === view)?.text}
      </p>
    </section>
  );
}
