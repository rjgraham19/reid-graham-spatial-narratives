import { useEffect, useRef, useState } from "react";
import { ExperimentFrame, getMeta, useReplay } from "./ui";

/* TYPE-05 word swap — cycles a list. */
function WordSwap({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 1600);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className="lab-type-swap">
      <span className="lab-type-swap-track" style={{ transform: `translateY(-${i * 1.2}em)` }}>
        {words.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </span>
    </span>
  );
}

/* TYPE-06 proximity weight — per-letter scale from pointer distance. */
function ProximityHeading({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const spans = el.querySelectorAll<HTMLSpanElement>("span[data-l]");
    spans.forEach((s) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const t = Math.max(0, 1 - d / 160);
      s.style.transform = `scaleY(${1 + t * 0.5}) translateY(${-t * 3}px)`;
      s.style.opacity = `${0.55 + t * 0.45}`;
    });
  };
  const reset = () => {
    ref.current?.querySelectorAll<HTMLSpanElement>("span[data-l]").forEach((s) => {
      s.style.transform = "";
      s.style.opacity = "";
    });
  };
  return (
    <h3 ref={ref} className="lab-type-prox" onMouseMove={onMove} onMouseLeave={reset}>
      {[...text].map((ch, i) => (
        <span data-l key={i}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </h3>
  );
}

export function SectionType() {
  const r1 = useReplay();
  const r2 = useReplay();
  const r3 = useReplay();
  const r4 = useReplay();
  return (
    <>
      <style>{css}</style>
      <div className="lab-grid">
        <ExperimentFrame meta={getMeta("TYPE-01")} onReplay={r1.replay}>
          <div className="lab-type-stage" key={r1.replayKey}>
            <div className="lab-type-wm">
              <span>Reid</span>
              <span>Graham</span>
              <span className="thin">Design</span>
            </div>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("TYPE-02")} onReplay={r2.replay}>
          <div className="lab-type-stage" key={r2.replayKey}>
            <div className="lab-type-split">
              <span className="top">Field House</span>
              <span className="bot" aria-hidden>
                Field House
              </span>
            </div>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("TYPE-03")} onReplay={r3.replay}>
          <div className="lab-type-stage" key={r3.replayKey}>
            <h3 className="lab-type-track">True West</h3>
            <p className="lab-type-hint">Entrance opens tracking; hover compresses it</p>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("TYPE-04")} onReplay={r4.replay}>
          <div className="lab-type-stage" key={r4.replayKey}>
            <div className="lab-type-mask">
              <span className="line">
                <span>The Diary of</span>
              </span>
              <span className="line">
                <span>Anne Frank</span>
              </span>
            </div>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("TYPE-05")}>
          <div className="lab-type-stage">
            <p className="lab-type-caption">
              A room that is&nbsp;
              <WordSwap words={["staged", "built", "rendered", "inhabited"]} />
            </p>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("TYPE-06")}>
          <div className="lab-type-stage">
            <ProximityHeading text="REID GRAHAM" />
            <p className="lab-type-hint">Move across the letters</p>
          </div>
        </ExperimentFrame>
      </div>
    </>
  );
}

const css = `
.lab-type-stage {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px; padding: 24px; text-align: center;
}
.lab-type-hint { font-family: var(--font-mono, monospace); font-size: 0.55rem; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.3); }

/* TYPE-01 wordmark kinetic */
.lab-type-wm {
  font-family: var(--font-display, sans-serif); font-weight: 900; text-transform: uppercase;
  line-height: 0.84; letter-spacing: -0.04em; font-size: clamp(1.8rem, 6vw, 3rem);
}
.lab-type-wm span { display: block; animation: lab-clip-lr 0.9s var(--lab-ease, ease) both; }
.lab-type-wm span:nth-child(2) { animation-delay: 0.09s; }
.lab-type-wm .thin { font-weight: 100; color: rgba(255,255,255,0.85); animation-delay: 0.28s; }

/* TYPE-02 split reveal */
.lab-type-split { position: relative; font-family: var(--font-display, sans-serif); font-weight: 800; text-transform: uppercase; font-size: clamp(1.6rem, 5vw, 2.6rem); letter-spacing: -0.02em; }
.lab-type-split .top, .lab-type-split .bot { display: block; }
.lab-type-split .top { clip-path: inset(0 0 50% 0); animation: split-top 0.7s var(--lab-ease, ease) both; }
.lab-type-split .bot { position: absolute; inset: 0; clip-path: inset(50% 0 0 0); animation: split-bot 0.7s var(--lab-ease, ease) both; }
@keyframes split-top { from { transform: translateX(-40%); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes split-bot { from { transform: translateX(40%); opacity: 0; } to { transform: none; opacity: 1; } }

/* TYPE-03 tracking breathe */
.lab-type-track {
  font-family: var(--font-display, sans-serif); font-weight: 300; text-transform: uppercase;
  font-size: clamp(1.6rem, 5vw, 2.6rem);
  letter-spacing: 0.5em; animation: track-open 1s var(--lab-ease, ease) both;
  transition: letter-spacing 0.4s var(--lab-ease, ease);
  cursor: default;
}
.lab-type-track:hover { letter-spacing: 0.12em; }
@keyframes track-open { from { letter-spacing: 0.02em; opacity: 0; } to { letter-spacing: 0.24em; opacity: 1; } }

/* TYPE-04 mask rise */
.lab-type-mask { font-family: var(--font-display, sans-serif); font-weight: 800; text-transform: uppercase; font-size: clamp(1.5rem, 4.6vw, 2.4rem); letter-spacing: -0.02em; line-height: 1.08; }
.lab-type-mask .line { display: block; overflow: hidden; padding-bottom: 0.04em; }
.lab-type-mask .line > span { display: block; animation: mask-rise 0.7s var(--lab-ease, ease) both; }
.lab-type-mask .line:nth-child(2) > span { animation-delay: 0.12s; }
@keyframes mask-rise { from { transform: translateY(105%); } to { transform: translateY(0); } }

/* TYPE-05 word swap */
.lab-type-caption { font-family: var(--font-serif, serif); font-style: italic; font-size: 1.15rem; color: rgba(255,255,255,0.8); display: inline-flex; align-items: baseline; }
.lab-type-swap { display: inline-block; height: 1.2em; overflow: hidden; }
.lab-type-swap-track { display: flex; flex-direction: column; transition: transform 0.5s var(--lab-ease, ease); }
.lab-type-swap-track span { height: 1.2em; line-height: 1.2em; color: var(--color-accent, #3ad6d6); font-style: normal; font-family: var(--font-display, sans-serif); font-weight: 500; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.08em; }

/* TYPE-06 proximity */
.lab-type-prox { font-family: var(--font-display, sans-serif); font-weight: 700; text-transform: uppercase; font-size: clamp(1.6rem, 5vw, 2.8rem); letter-spacing: 0.02em; display: flex; cursor: default; }
.lab-type-prox span[data-l] { display: inline-block; transform-origin: 50% 100%; color: rgba(255,255,255,0.55); transition: transform 0.28s var(--lab-ease, ease), opacity 0.28s ease; }
`;
