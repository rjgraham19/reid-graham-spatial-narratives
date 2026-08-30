import { useCallback, useRef, useState } from "react";
import { ExperimentFrame, getMeta, PhoneFrame } from "./ui";
import { LAB_IMAGES } from "./data";

const SHOTS = LAB_IMAGES.slice(0, 6);

/* CAROUSEL-01 · native scroll-snap + progress bar + count */
function SnapProgress() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    setI(Math.round(el.scrollLeft / el.clientWidth));
  };
  return (
    <div className="lab-car lab-car-snap">
      <div className="lab-car-track" ref={trackRef} onScroll={onScroll}>
        {SHOTS.map((s) => (
          <div className="lab-car-slide" key={s.src}>
            <img src={s.src} alt={s.project} />
          </div>
        ))}
      </div>
      <div className="lab-car-bar">
        <span style={{ width: `${((i + 1) / SHOTS.length) * 100}%` }} />
      </div>
      <div className="lab-car-count">
        {String(i + 1).padStart(2, "0")} / {String(SHOTS.length).padStart(2, "0")}
      </div>
    </div>
  );
}

/* Shared pointer-drag track for CAROUSEL-02 / 03 / 04 */
function useDragIndex(len: number) {
  const [i, setI] = useState(0);
  const start = useRef<number | null>(null);
  const onDown = (e: React.PointerEvent) => {
    start.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onUp = (e: React.PointerEvent) => {
    if (start.current == null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    if (Math.abs(dx) > 40) setI((v) => Math.max(0, Math.min(len - 1, v + (dx < 0 ? 1 : -1))));
  };
  const go = useCallback((n: number) => setI(Math.max(0, Math.min(len - 1, n))), [len]);
  return { i, onDown, onUp, go };
}

/* CAROUSEL-02 · full-bleed sequence */
function FullBleed() {
  const { i, onDown, onUp, go } = useDragIndex(SHOTS.length);
  return (
    <div className="lab-car lab-car-fb" onPointerDown={onDown} onPointerUp={onUp}>
      <div className="lab-car-fb-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {SHOTS.map((s) => (
          <div className="lab-car-fb-slide" key={s.src}>
            <img src={s.src} alt={s.project} />
          </div>
        ))}
      </div>
      <button className="lab-car-fb-zone left" onClick={() => go(i - 1)} aria-label="Previous" />
      <button className="lab-car-fb-zone right" onClick={() => go(i + 1)} aria-label="Next" />
      <span className="lab-car-fb-cap">{SHOTS[i].project}</span>
    </div>
  );
}

/* CAROUSEL-03 · draggable filmstrip */
function Filmstrip() {
  const { i, onDown, onUp, go } = useDragIndex(SHOTS.length);
  return (
    <div className="lab-car lab-car-strip">
      <div className="lab-car-strip-main">
        <img src={SHOTS[i].src} alt={SHOTS[i].project} />
      </div>
      <div className="lab-car-strip-rail" onPointerDown={onDown} onPointerUp={onUp}>
        <div
          className="lab-car-strip-inner"
          style={{ transform: `translateX(calc(50% - ${i * 78 + 39}px))` }}
        >
          {SHOTS.map((s, n) => (
            <button
              key={s.src}
              className="lab-car-strip-thumb"
              data-active={n === i}
              onClick={() => go(n)}
              type="button"
            >
              <img src={s.src} alt="" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* CAROUSEL-04 · stacked cards */
function StackedCards() {
  const { i, onDown, onUp } = useDragIndex(SHOTS.length);
  return (
    <div className="lab-car lab-car-stack" onPointerDown={onDown} onPointerUp={onUp}>
      {SHOTS.map((s, n) => {
        const rel = n - i;
        if (rel < 0 || rel > 2) return null;
        return (
          <div
            className="lab-car-stack-card"
            key={s.src}
            style={{ ["--rel" as string]: rel, zIndex: 10 - rel }}
          >
            <img src={s.src} alt={s.project} />
            <span>{s.project}</span>
          </div>
        );
      })}
      <p className="lab-car-hint">Swipe / drag the top card</p>
    </div>
  );
}

/* CAROUSEL-05 · thumb index + cross-fading caption */
function ThumbIndex() {
  const [i, setI] = useState(0);
  return (
    <div className="lab-car lab-car-thumb">
      <div className="lab-car-thumb-main">
        {SHOTS.map((s, n) => (
          <img key={s.src} src={s.src} alt={s.project} data-active={n === i} />
        ))}
        <span className="lab-car-thumb-cap" key={i}>
          {SHOTS[i].project}
        </span>
      </div>
      <div className="lab-car-thumb-rail">
        {SHOTS.map((s, n) => (
          <button key={s.src} data-active={n === i} onClick={() => setI(n)} type="button">
            <img src={s.src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectionCarousels() {
  return (
    <>
      <style>{css}</style>
      <div className="lab-grid">
        <ExperimentFrame meta={getMeta("CAROUSEL-01")}>
          <SnapProgress />
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("CAROUSEL-02")} stageFill="mobile">
          <PhoneFrame>
            <FullBleed />
          </PhoneFrame>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("CAROUSEL-03")}>
          <Filmstrip />
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("CAROUSEL-04")} stageFill="mobile">
          <PhoneFrame>
            <StackedCards />
          </PhoneFrame>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("CAROUSEL-05")}>
          <ThumbIndex />
        </ExperimentFrame>
      </div>
    </>
  );
}

const css = `
.lab-car { position: absolute; inset: 0; background: #000; overflow: hidden; touch-action: pan-y; }
.lab-car-hint { position: absolute; left: 0; right: 0; bottom: 10px; text-align: center; font-family: var(--font-mono, monospace); font-size: 0.5rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.35); }

/* 01 snap */
.lab-car-track { display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
.lab-car-track::-webkit-scrollbar { display: none; }
.lab-car-slide { flex: 0 0 100%; scroll-snap-align: start; }
.lab-car-slide img { width: 100%; height: 100%; object-fit: cover; }
.lab-car-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: rgba(255,255,255,0.16); }
.lab-car-bar span { display: block; height: 100%; background: hsl(0 0% 98%); transition: width 0.3s var(--lab-ease, ease); }
.lab-car-count { position: absolute; right: 12px; bottom: 12px; font-family: var(--font-mono, monospace); font-size: 0.6rem; letter-spacing: 0.12em; color: #fff; text-shadow: 0 1px 6px #000; }

/* 02 full-bleed */
.lab-car-fb { touch-action: pan-y; }
.lab-car-fb-track { display: flex; height: 100%; transition: transform 0.45s var(--lab-ease, ease); }
.lab-car-fb-slide { flex: 0 0 100%; }
.lab-car-fb-slide img { width: 100%; height: 100%; object-fit: cover; }
.lab-car-fb-zone { position: absolute; top: 0; bottom: 0; width: 40%; border: none; background: transparent; cursor: pointer; }
.lab-car-fb-zone.left { left: 0; } .lab-car-fb-zone.right { right: 0; }
.lab-car-fb-cap { position: absolute; left: 14px; bottom: 16px; font-family: var(--font-display, sans-serif); font-weight: 200; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.62rem; color: #fff; text-shadow: 0 2px 10px #000; }

/* 03 filmstrip */
.lab-car-strip { display: flex; flex-direction: column; }
.lab-car-strip-main { flex: 1; overflow: hidden; }
.lab-car-strip-main img { width: 100%; height: 100%; object-fit: cover; }
.lab-car-strip-rail { height: 66px; overflow: hidden; border-top: 1px solid rgba(255,255,255,0.1); background: #050505; touch-action: pan-y; }
.lab-car-strip-inner { display: flex; gap: 6px; height: 100%; padding: 8px 0; transition: transform 0.4s var(--lab-ease, ease); }
.lab-car-strip-thumb { flex: 0 0 72px; height: 100%; padding: 0; border: 1px solid transparent; background: none; cursor: pointer; opacity: 0.4; transition: opacity 0.3s ease, border-color 0.3s ease; }
.lab-car-strip-thumb[data-active="true"] { opacity: 1; border-color: var(--color-accent, #3ad6d6); }
.lab-car-strip-thumb img { width: 100%; height: 100%; object-fit: cover; }

/* 04 stacked */
.lab-car-stack { touch-action: pan-y; }
.lab-car-stack-card { position: absolute; inset: 12% 10% 16%; border-radius: 6px; overflow: hidden; transform: translateY(calc(var(--rel) * 14px)) scale(calc(1 - var(--rel) * 0.06)); transition: transform 0.4s var(--lab-ease, ease), opacity 0.4s ease; box-shadow: 0 20px 50px -20px rgba(0,0,0,0.8); }
.lab-car-stack-card img { width: 100%; height: 100%; object-fit: cover; }
.lab-car-stack-card span { position: absolute; left: 12px; bottom: 12px; font-family: var(--font-display, sans-serif); font-weight: 800; text-transform: uppercase; font-size: 0.7rem; text-shadow: 0 2px 10px #000; }

/* 05 thumb index */
.lab-car-thumb { display: flex; flex-direction: column; }
.lab-car-thumb-main { position: relative; flex: 1; overflow: hidden; }
.lab-car-thumb-main img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.5s var(--lab-ease, ease); }
.lab-car-thumb-main img[data-active="true"] { opacity: 1; }
.lab-car-thumb-cap { position: absolute; left: 14px; bottom: 14px; font-family: var(--font-display, sans-serif); font-weight: 200; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.64rem; color: #fff; text-shadow: 0 2px 10px #000; animation: lab-fade 0.5s ease both; }
.lab-car-thumb-rail { display: flex; gap: 4px; padding: 6px; background: #050505; border-top: 1px solid rgba(255,255,255,0.1); overflow-x: auto; scrollbar-width: none; }
.lab-car-thumb-rail::-webkit-scrollbar { display: none; }
.lab-car-thumb-rail button { flex: 0 0 54px; height: 40px; padding: 0; border: 1px solid transparent; background: none; cursor: pointer; opacity: 0.4; }
.lab-car-thumb-rail button[data-active="true"] { opacity: 1; border-color: var(--color-accent, #3ad6d6); }
.lab-car-thumb-rail img { width: 100%; height: 100%; object-fit: cover; }
`;
