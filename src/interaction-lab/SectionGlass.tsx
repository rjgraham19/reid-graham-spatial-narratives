import { useRef } from "react";
import { ExperimentFrame, getMeta } from "./ui";
import { LAB_IMAGES } from "./data";

/* A shared backdrop so every glass demo is shown "in a realistic context" —
   sitting on top of a project image rather than on flat black. */
function GlassStage({
  img,
  children,
  accent,
}: {
  img: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="lab-glass-stage"
      style={accent ? ({ ["--acc" as string]: accent } as React.CSSProperties) : undefined}
    >
      <img src={img} alt="" />
      <div className="lab-glass-scrim" />
      <div className="lab-glass-slot">{children}</div>
    </div>
  );
}

/* GLASS-02 cursor sheen — track pointer as CSS vars. */
function SheenButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <button ref={ref} type="button" className="lab-glass-btn lab-glass-sheen" onMouseMove={onMove}>
      {children}
    </button>
  );
}

/* GLASS-03 tint on approach — distance from cursor drives tint strength. */
function TintButton({ children, accent }: { children: React.ReactNode; accent: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const d = Math.hypot(e.clientX - cx, e.clientY - cy);
    const strength = Math.max(0, 1 - d / 260);
    el.style.setProperty("--tint", strength.toFixed(3));
  };
  const reset = () => ref.current?.style.setProperty("--tint", "0");
  return (
    <button
      ref={ref}
      type="button"
      className="lab-glass-btn lab-glass-tint"
      style={{ ["--acc" as string]: accent }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </button>
  );
}

export function SectionGlass() {
  const [a, b, c, d, e, f] = LAB_IMAGES;
  return (
    <>
      <style>{css}</style>

      {/* SVG filters used by GLASS-04 / GLASS-05, rendered once, hidden. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="lab-glass-lens">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.014"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale="14"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="lab-glass-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      <div className="lab-grid">
        <ExperimentFrame meta={getMeta("GLASS-01")}>
          <GlassStage img={a.src}>
            <button type="button" className="lab-glass-btn">
              Enter
            </button>
          </GlassStage>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("GLASS-02")}>
          <GlassStage img={b.src}>
            <SheenButton>View project</SheenButton>
          </GlassStage>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("GLASS-03")}>
          <GlassStage img={c.src}>
            <TintButton accent={c.accent}>Open {c.project.split(" ")[0]}</TintButton>
          </GlassStage>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("GLASS-04")}>
          <GlassStage img={d.src}>
            <button type="button" className="lab-glass-btn lab-glass-lens">
              Next ›
            </button>
          </GlassStage>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("GLASS-05")}>
          <GlassStage img={e.src}>
            <div className="lab-glass-goowrap">
              <button type="button" className="lab-glass-bubble">
                ‹
              </button>
              <button type="button" className="lab-glass-bubble">
                ›
              </button>
            </div>
          </GlassStage>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("GLASS-06")}>
          <GlassStage img={f.src} accent={f.accent}>
            <button type="button" className="lab-glass-portal">
              <span>Enter</span>
            </button>
          </GlassStage>
        </ExperimentFrame>
      </div>
    </>
  );
}

const css = `
.lab-glass-stage { position: absolute; inset: 0; overflow: hidden; }
.lab-glass-stage > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.lab-glass-scrim { position: absolute; inset: 0; background: radial-gradient(120% 100% at 50% 100%, rgba(0,0,0,0.55), rgba(0,0,0,0.15)); }
.lab-glass-slot { position: absolute; inset: 0; display: grid; place-items: center; }

.lab-glass-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem;
  padding: 0.7rem 1.4rem; border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.09);
  color: rgba(255,255,255,0.97);
  font-family: var(--font-display, sans-serif); font-weight: 200;
  font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase;
  cursor: pointer; position: relative; overflow: hidden;
  background-color: rgba(8,6,10,0.30);
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.18) 100%);
  -webkit-backdrop-filter: blur(10px) saturate(120%); backdrop-filter: blur(10px) saturate(120%);
  box-shadow: inset 0 -1px 0 rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 18px -8px rgba(0,0,0,0.5);
  transition: transform 0.16s var(--lab-ease, ease), background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.lab-glass-btn:hover { transform: translateY(-1px); border-color: rgba(255,255,255,0.16); }
.lab-glass-btn:active { transform: translateY(1px) scale(0.985); background-color: rgba(4,3,6,0.5); }
.lab-glass-btn:focus-visible { outline: 2px solid rgba(255,255,255,0.6); outline-offset: 2px; }

/* GLASS-02 sheen */
.lab-glass-sheen::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(120px 120px at var(--mx,50%) var(--my,0%), rgba(255,255,255,0.28), transparent 60%);
  opacity: 0; transition: opacity 0.25s ease;
}
.lab-glass-sheen:hover::after { opacity: 1; }

/* GLASS-03 tint */
.lab-glass-tint {
  background-color: color-mix(in srgb, var(--acc) calc(var(--tint,0) * 34%), rgba(8,6,10,0.30));
  border-color: color-mix(in srgb, var(--acc) calc(var(--tint,0) * 60%), rgba(255,255,255,0.09));
}

/* GLASS-04 lens */
.lab-glass-lens { filter: url(#lab-glass-lens); transition: filter 0.2s ease; }
.lab-glass-lens:hover { filter: url(#lab-glass-lens) brightness(1.05); }
@media (prefers-reduced-motion: reduce), (pointer: coarse) {
  .lab-glass-lens { filter: none; }
}

/* GLASS-05 merge/split */
.lab-glass-goowrap { display: flex; gap: 10px; filter: url(#lab-glass-goo); }
.lab-glass-bubble {
  width: 46px; height: 46px; border-radius: 999px; border: none; cursor: pointer;
  background: rgba(20,16,24,0.6); color: #fff; font-size: 1.1rem;
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  transition: transform 0.3s var(--lab-ease, ease);
}
.lab-glass-goowrap:hover .lab-glass-bubble:first-child { transform: translateX(14px); }
.lab-glass-goowrap:hover .lab-glass-bubble:last-child { transform: translateX(-14px); }
@media (prefers-reduced-motion: reduce) { .lab-glass-goowrap { filter: none; } }

/* GLASS-06 portal expand */
.lab-glass-portal {
  width: 84px; height: 84px; border-radius: 999px; cursor: pointer; position: relative;
  border: 1px solid rgba(255,255,255,0.14); color: #fff; overflow: hidden;
  background: color-mix(in srgb, var(--acc, #3ad6d6) 22%, rgba(8,6,10,0.4));
  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  font-family: var(--font-display, sans-serif); font-weight: 200; font-size: 0.62rem;
  letter-spacing: 0.16em; text-transform: uppercase;
  transition: transform 0.5s var(--lab-ease, ease);
}
.lab-glass-portal:active { transform: scale(26); }
.lab-glass-portal span { position: relative; z-index: 2; }
`;
