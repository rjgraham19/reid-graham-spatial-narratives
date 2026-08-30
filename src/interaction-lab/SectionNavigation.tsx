import { useRef, useState } from "react";
import { ExperimentFrame, getMeta, useReplay } from "./ui";
import { LAB_HIGHLIGHTS } from "./data";

const LINKS = ["Projects", "Visualizations", "Connect"];

/* ── NAV-01 · Letter Wave ─────────────────────────────────────────── */
function LetterWave() {
  return (
    <nav className="lab-nav-demo">
      {LINKS.map((label) => (
        <span className="lab-nav-wave" key={label} tabIndex={0}>
          {[...label].map((ch, i) => (
            <span key={i} style={{ ["--d" as string]: `${i * 28}ms` }}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </nav>
  );
}

/* ── NAV-02 · Rolling Labels ──────────────────────────────────────── */
function RollingLabels() {
  return (
    <nav className="lab-nav-demo">
      {LINKS.map((label) => (
        <span className="lab-nav-roll" key={label} tabIndex={0}>
          <span className="lab-nav-roll-inner">
            <span>{label}</span>
            <span>{label}</span>
          </span>
        </span>
      ))}
    </nav>
  );
}

/* ── NAV-03 · Magnetic Pull ───────────────────────────────────────── */
function Magnetic() {
  return (
    <nav className="lab-nav-demo">
      {LINKS.map((label) => (
        <MagLink key={label}>{label}</MagLink>
      ))}
    </nav>
  );
}
function MagLink({ children }: { children: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * 0.28}px, ${dy * 0.34}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <span className="lab-nav-mag" onMouseMove={onMove} onMouseLeave={reset}>
      <span ref={ref} className="lab-nav-mag-inner" tabIndex={0}>
        {children}
      </span>
    </span>
  );
}

/* ── NAV-04 · Full-Bleed Menu (mobile) ───────────────────────────── */
function FullBleedMenu({ replayKey }: { replayKey: number }) {
  const [open, setOpen] = useState(true);
  const imgs = LAB_HIGHLIGHTS;
  return (
    <div className="lab-nav-fbm" key={replayKey}>
      <button className="lab-nav-fbm-toggle" onClick={() => setOpen((v) => !v)} type="button">
        {open ? "Close ✕" : "Menu"}
      </button>
      {open ? (
        <ul className="lab-nav-fbm-list">
          {LINKS.map((label, i) => (
            <li key={label} style={{ ["--i" as string]: i }}>
              <span
                className="lab-nav-fbm-sliver"
                style={{ backgroundImage: `url(${imgs[i % imgs.length].src})` }}
              />
              <span className="lab-nav-fbm-label">{label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SectionNavigation() {
  const nav04 = useReplay();
  return (
    <>
      <style>{css}</style>
      <div className="lab-grid">
        <ExperimentFrame meta={getMeta("NAV-01")}>
          <div className="lab-nav-stage">
            <LetterWave />
            <p className="lab-nav-hint">Hover a label</p>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("NAV-02")}>
          <div className="lab-nav-stage">
            <RollingLabels />
            <p className="lab-nav-hint">Hover a label</p>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("NAV-03")}>
          <div className="lab-nav-stage">
            <Magnetic />
            <p className="lab-nav-hint">Move the cursor near a label</p>
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("NAV-04")} onReplay={nav04.replay}>
          <div className="lab-nav-stage lab-nav-stage--phone">
            <FullBleedMenu replayKey={nav04.replayKey} />
          </div>
        </ExperimentFrame>
      </div>
    </>
  );
}

const css = `
.lab-nav-stage {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 22px; padding: 24px;
}
.lab-nav-stage--phone { padding: 0; }
.lab-nav-hint {
  font-family: var(--font-mono, monospace); font-size: 0.58rem;
  letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.3);
}
.lab-nav-demo {
  display: flex; flex-direction: column; gap: 14px; align-items: center;
  font-family: var(--font-display, "Poppins", sans-serif);
  font-weight: 200; text-transform: uppercase; letter-spacing: 0.16em;
  font-size: 1.05rem;
}

/* NAV-01 letter wave */
.lab-nav-wave { display: inline-flex; cursor: pointer; color: rgba(255,255,255,0.55); outline: none; }
.lab-nav-wave > span {
  display: inline-block; transition: transform 0.32s var(--lab-ease, ease) var(--d), color 0.3s ease;
}
.lab-nav-wave:hover > span, .lab-nav-wave:focus-visible > span {
  transform: translateY(-6px); color: hsl(0 0% 98%);
}

/* NAV-02 rolling */
.lab-nav-roll { display: inline-block; height: 1.2em; overflow: hidden; cursor: pointer; color: rgba(255,255,255,0.55); }
.lab-nav-roll-inner { display: flex; flex-direction: column; transition: transform 0.4s var(--lab-ease, ease); }
.lab-nav-roll-inner > span { height: 1.2em; line-height: 1.2em; }
.lab-nav-roll-inner > span:last-child { color: hsl(0 0% 98%); }
.lab-nav-roll:hover .lab-nav-roll-inner, .lab-nav-roll:focus-within .lab-nav-roll-inner { transform: translateY(-1.2em); }

/* NAV-03 magnetic */
.lab-nav-mag { display: inline-block; padding: 6px 14px; }
.lab-nav-mag-inner {
  display: inline-block; color: rgba(255,255,255,0.6); cursor: pointer;
  transition: transform 0.35s var(--lab-ease, ease), color 0.3s ease;
}
.lab-nav-mag-inner:hover { color: hsl(0 0% 98%); }

/* NAV-04 full-bleed menu */
.lab-nav-fbm { position: absolute; inset: 0; background: #000; }
.lab-nav-fbm-toggle {
  position: absolute; top: 12px; right: 12px; z-index: 3;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
  color: #fff; font-family: var(--font-display, sans-serif); font-weight: 200;
  font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase;
  padding: 8px 12px; border-radius: 6px; cursor: pointer;
}
.lab-nav-fbm-list { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; margin: 0; padding: 0 22px; list-style: none; }
.lab-nav-fbm-list li {
  position: relative; display: flex; align-items: center; gap: 14px;
  padding: 14px 0; overflow: hidden;
  animation: lab-clip-lr 0.7s var(--lab-ease, ease) both;
  animation-delay: calc(var(--i) * 0.08s + 0.1s);
}
.lab-nav-fbm-sliver {
  width: 46px; height: 46px; flex-shrink: 0; background-size: cover; background-position: center;
  clip-path: inset(0 0 0 0);
}
.lab-nav-fbm-label {
  font-family: var(--font-display, sans-serif); font-weight: 900; text-transform: uppercase;
  letter-spacing: -0.02em; font-size: 1.9rem; line-height: 1;
}
`;
