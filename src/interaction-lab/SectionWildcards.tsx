import { useRef, useState } from "react";
import { ExperimentFrame, getMeta, LabButton } from "./ui";
import { LAB_IMAGES } from "./data";
import { MiniHome } from "./MiniHome";

/* WILD-01 · time-of-day grade — slider stands in for the visitor's local hour */
const GRADES: Record<string, string> = {
  dawn: "linear-gradient(180deg, rgba(255,180,120,0.10), rgba(90,110,200,0.06))",
  midday: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
  dusk: "linear-gradient(180deg, rgba(255,120,80,0.10), rgba(40,20,60,0.14))",
  night: "linear-gradient(180deg, rgba(20,30,80,0.16), rgba(0,0,0,0.28))",
};
function TimeOfDay() {
  const keys = Object.keys(GRADES);
  const [k, setK] = useState(1);
  const key = keys[k];
  return (
    <div className="lab-wild-tod">
      <div className="lab-wild-tod-preview">
        <MiniHome entered={false} />
        <div className="lab-wild-tod-grade" style={{ background: GRADES[key] }} />
      </div>
      <div className="lab-wild-tod-ctl">
        <input
          type="range"
          min={0}
          max={keys.length - 1}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
          aria-label="Time of day"
        />
        <span className="lab-mono">{key} · local hour</span>
      </div>
    </div>
  );
}

/* WILD-02 · model-light cursor — a raking light mask that follows the pointer */
function ModelLight({ img }: { img: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div className="lab-wild-light" ref={ref} onMouseMove={onMove}>
      <img src={img} alt="" />
      <div className="lab-wild-light-rake" />
      <p className="lab-wild-hint">Move across the image</p>
    </div>
  );
}

/* WILD-03 · plan ↔ perspective toggle */
function PlanToggle({ plan, persp }: { plan: string; persp: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="lab-wild-plan" data-persp={on}>
      <div className="lab-wild-plan-frame">
        <img className="plan" src={plan} alt="Plan / elevation" />
        <img className="persp" src={persp} alt="Perspective render" />
      </div>
      <LabButton small onClick={() => setOn((v) => !v)}>
        {on ? "Show drawing" : "Show building"}
      </LabButton>
    </div>
  );
}

export function SectionWildcards() {
  return (
    <>
      <style>{css}</style>
      <div className="lab-grid">
        <ExperimentFrame meta={getMeta("WILD-01")}>
          <TimeOfDay />
        </ExperimentFrame>
        <ExperimentFrame meta={getMeta("WILD-02")}>
          <ModelLight img={LAB_IMAGES[2].src} />
        </ExperimentFrame>
        <ExperimentFrame meta={getMeta("WILD-03")}>
          <PlanToggle plan={LAB_IMAGES[8].src} persp={LAB_IMAGES[2].src} />
        </ExperimentFrame>
      </div>
    </>
  );
}

const css = `
.lab-wild-tod, .lab-wild-light, .lab-wild-plan { position: absolute; inset: 0; background: #000; }
.lab-wild-hint { position: absolute; left: 12px; bottom: 10px; font-family: var(--font-mono, monospace); font-size: 0.52rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.35); }

/* WILD-01 */
.lab-wild-tod-preview { position: absolute; inset: 0 0 46px; overflow: hidden; }
.lab-wild-tod-grade { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: soft-light; transition: background 0.6s var(--lab-ease, ease); }
.lab-wild-tod-ctl { position: absolute; left: 0; right: 0; bottom: 0; height: 46px; display: flex; align-items: center; gap: 10px; padding: 0 12px; border-top: 1px solid rgba(255,255,255,0.1); }
.lab-wild-tod-ctl input { flex: 1; accent-color: var(--color-accent, #3ad6d6); }
.lab-wild-tod-ctl span { font-size: 0.52rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.5); white-space: nowrap; }

/* WILD-02 */
.lab-wild-light img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.5) contrast(1.05); }
.lab-wild-light-rake {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(240px 240px at var(--mx,50%) var(--my,50%), rgba(255,245,225,0.28), rgba(255,245,225,0.06) 45%, transparent 68%);
  mix-blend-mode: screen;
}

/* WILD-03 */
.lab-wild-plan { display: grid; place-items: center; gap: 12px; padding: 22px; grid-template-rows: 1fr auto; }
.lab-wild-plan-frame { position: relative; width: 100%; height: 100%; perspective: 900px; }
.lab-wild-plan-frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.6s var(--lab-ease, ease), transform 0.6s var(--lab-ease, ease); backface-visibility: hidden; }
.lab-wild-plan-frame .plan { opacity: 1; transform: rotateX(0deg); }
.lab-wild-plan-frame .persp { opacity: 0; transform: rotateX(12deg) scale(1.04); }
.lab-wild-plan[data-persp="true"] .plan { opacity: 0; transform: rotateX(-12deg) scale(0.98); }
.lab-wild-plan[data-persp="true"] .persp { opacity: 1; transform: rotateX(0deg) scale(1); }
`;
