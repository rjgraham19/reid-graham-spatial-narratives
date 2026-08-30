import { useState } from "react";
import { ExperimentFrame, getMeta, LabButton } from "./ui";
import { LAB_IMAGES } from "./data";

/* Each transition demo has two states — "grid" (a project card) and "page"
   (the project view) — and animates between them on a trigger, so the motion
   itself is what's being evaluated. Replay resets to "grid". */
function TransitionDemo({
  variant,
  img,
  accent,
  title,
  playKey,
}: {
  variant: string;
  img: string;
  accent: string;
  title: string;
  playKey: number;
}) {
  const [state, setState] = useState<"grid" | "page">("grid");
  return (
    <div className={`lab-tr lab-tr--${variant}`} data-state={state} key={playKey}>
      {/* GRID STATE */}
      <button className="lab-tr-card" type="button" onClick={() => setState("page")}>
        <img src={img} alt={title} />
        <span className="lab-tr-card-title">{title}</span>
      </button>

      {/* PAGE STATE */}
      <div className="lab-tr-page" style={{ ["--acc" as string]: accent }}>
        <div className="lab-tr-page-hero">
          <img src={img} alt={title} />
        </div>
        <div className="lab-tr-page-body">
          <h4>{title}</h4>
          <p>
            Project view. The incoming state is fully resolved — the transition only carries you
            here, it never makes you wait.
          </p>
          <LabButton small onClick={() => setState("grid")}>
            ‹ Back
          </LabButton>
        </div>
      </div>

      {/* Effect layers */}
      <div className="lab-tr-wash" style={{ ["--acc" as string]: accent }} />
    </div>
  );
}

export function SectionTransitions() {
  const [k, setK] = useState(0);
  const replay = () => setK((n) => n + 1);
  const [a, b, c, d] = LAB_IMAGES;
  return (
    <>
      <style>{css}</style>
      <div className="lab-grid">
        <ExperimentFrame meta={getMeta("TRANSITION-01")} onReplay={replay}>
          <TransitionDemo
            variant="expand"
            img={a.src}
            accent={a.accent}
            title={a.project}
            playKey={k}
          />
        </ExperimentFrame>
        <ExperimentFrame meta={getMeta("TRANSITION-02")} onReplay={replay}>
          <TransitionDemo
            variant="lens"
            img={b.src}
            accent={b.accent}
            title={b.project}
            playKey={k}
          />
        </ExperimentFrame>
        <ExperimentFrame meta={getMeta("TRANSITION-03")} onReplay={replay}>
          <TransitionDemo
            variant="push"
            img={c.src}
            accent={c.accent}
            title={c.project}
            playKey={k}
          />
        </ExperimentFrame>
        <ExperimentFrame meta={getMeta("TRANSITION-04")} onReplay={replay}>
          <TransitionDemo
            variant="wash"
            img={d.src}
            accent={d.accent}
            title={d.project}
            playKey={k}
          />
        </ExperimentFrame>
      </div>
    </>
  );
}

const css = `
.lab-tr { position: absolute; inset: 0; overflow: hidden; background: #060606; }
.lab-tr-card {
  position: absolute; inset: 18% 18%; border: none; padding: 0; cursor: pointer;
  overflow: hidden; border-radius: 4px; background: #000;
  transition: inset 0.55s var(--lab-ease, ease), opacity 0.4s ease, transform 0.55s var(--lab-ease, ease);
}
.lab-tr-card img { width: 100%; height: 100%; object-fit: cover; }
.lab-tr-card-title {
  position: absolute; left: 10px; bottom: 8px; font-family: var(--font-display, sans-serif);
  font-weight: 800; text-transform: uppercase; font-size: 0.8rem; letter-spacing: -0.01em;
  text-shadow: 0 2px 12px rgba(0,0,0,0.8);
}
.lab-tr-page {
  position: absolute; inset: 0; display: grid; grid-template-rows: 58% 42%;
  opacity: 0; pointer-events: none;
}
.lab-tr-page-hero { overflow: hidden; }
.lab-tr-page-hero img { width: 100%; height: 100%; object-fit: cover; }
.lab-tr-page-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
.lab-tr-page-body h4 { font-family: var(--font-display, sans-serif); font-weight: 800; text-transform: uppercase; font-size: 1rem; }
.lab-tr-page-body p { font-family: var(--font-serif, serif); font-style: italic; font-size: 0.82rem; line-height: 1.5; color: rgba(255,255,255,0.66); }
.lab-tr-wash { position: absolute; inset: 0; pointer-events: none; opacity: 0; }

/* state: page — shared reveal */
.lab-tr[data-state="page"] .lab-tr-page { opacity: 1; pointer-events: auto; transition: opacity 0.3s ease 0.15s; }

/* EXPAND */
.lab-tr--expand[data-state="page"] .lab-tr-card { inset: 0; }
.lab-tr--expand[data-state="page"] .lab-tr-card .lab-tr-card-title { opacity: 0; }

/* LENS */
.lab-tr--lens .lab-tr-wash {
  background: rgba(10,10,12,0.5); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
  transform: translateX(-110%);
}
.lab-tr--lens[data-state="page"] .lab-tr-wash {
  animation: tr-lens 0.7s var(--lab-ease, ease) forwards;
}
@keyframes tr-lens {
  0% { transform: translateX(-110%); opacity: 1; }
  55% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(110%); opacity: 1; }
}

/* PUSH */
.lab-tr--push[data-state="page"] .lab-tr-card { transform: translateX(-24%) scale(0.92); opacity: 0.4; }
.lab-tr--push .lab-tr-page { transform: translateX(30%); transition: transform 0.55s var(--lab-ease, ease), opacity 0.3s ease; }
.lab-tr--push[data-state="page"] .lab-tr-page { transform: translateX(0); }

/* WASH */
.lab-tr--wash .lab-tr-wash { background: linear-gradient(115deg, var(--acc) 0%, var(--acc) 45%, transparent 46%); transform: translateX(-100%); }
.lab-tr--wash[data-state="page"] .lab-tr-wash { animation: tr-wash 0.75s var(--lab-ease, ease) forwards; }
@keyframes tr-wash {
  0% { transform: translateX(-100%); opacity: 1; }
  60% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}
`;
