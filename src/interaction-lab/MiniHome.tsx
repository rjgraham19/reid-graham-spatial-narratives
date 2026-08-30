import { LAB_HERO } from "./data";

/**
 * A working, self-contained preview of the real homepage — the resting state
 * every entrance sequence resolves into. It mirrors src/routes/index.tsx (the
 * left-aligned REID / GRAHAM / DESIGN lockup, the payphone image on the right,
 * the ambient darken toward the split) without importing that route, which
 * would drag in the Design-Mode bridge.
 *
 * `entered` drives a one-shot settle: when an intro hands over, the homepage
 * fades its chrome up rather than snapping in, so the handoff reads as one
 * continuous move.
 */
export function MiniHome({ entered = true }: { entered?: boolean }) {
  return (
    <div className="lab-minihome" data-entered={entered ? "true" : "false"}>
      <style>{miniHomeCss}</style>

      <header className="lab-mh-nav">
        <span className="lab-mh-wordmark">
          Reid Graham <span>Design</span>
        </span>
        <nav className="lab-mh-links">
          <span>Projects</span>
          <span>Visualizations</span>
          <span>Connect</span>
        </nav>
      </header>

      <div className="lab-mh-split">
        <div className="lab-mh-left">
          <h1 className="lab-mh-title" aria-label="Reid Graham Design">
            <span>Reid</span>
            <span>Graham</span>
            <span className="lab-mh-thin">Design</span>
          </h1>
        </div>
        <div className="lab-mh-right">
          <img src={LAB_HERO} alt="Payphone booth in an overgrown, neon-lit environment" />
          <div className="lab-mh-scrim" />
        </div>
      </div>
    </div>
  );
}

const miniHomeCss = `
.lab-minihome {
  position: absolute;
  inset: 0;
  background: #000;
  color: hsl(0 0% 98%);
  overflow: hidden;
}
.lab-mh-nav {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: clamp(10px, 2.4vw, 22px) clamp(14px, 3vw, 40px);
}
.lab-mh-wordmark {
  font-family: var(--font-display, "Poppins", sans-serif);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: clamp(0.7rem, 1.4vw, 0.95rem);
}
.lab-mh-wordmark span { font-weight: 100; }
.lab-mh-links {
  display: flex;
  gap: clamp(8px, 1.6vw, 18px);
}
.lab-mh-links span {
  font-family: var(--font-display, "Poppins", sans-serif);
  font-weight: 200;
  font-size: clamp(0.55rem, 1vw, 0.7rem);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.45);
  cursor: pointer;
  transition: color 0.3s var(--lab-ease, ease);
}
.lab-mh-links span:hover { color: hsl(0 0% 98%); }

/* Resting homepage: everything is visible by default. The entered flag only
   adds a soft one-shot fade on top of the already-visible base, so the preview
   never depends on an animation completing to show its content. */
.lab-minihome[data-entered="true"] .lab-mh-nav { animation: lab-fade 0.7s 0.1s var(--lab-ease, ease); }

.lab-mh-split {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
@media (max-width: 640px) {
  .lab-mh-split { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
}
.lab-mh-left {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(14px, 4vw, 54px);
}
.lab-mh-title {
  font-family: var(--font-display, "Poppins", sans-serif);
  font-weight: 900;
  text-transform: uppercase;
  line-height: 0.85;
  letter-spacing: -0.04em;
  font-size: clamp(2rem, 8vw, 5.5rem);
  margin: 0;
}
.lab-mh-title span { display: block; }
.lab-mh-thin { font-weight: 100; color: rgba(255,255,255,0.85); }
.lab-minihome[data-entered="true"] .lab-mh-title span {
  animation: lab-clip-lr 1s var(--lab-ease, ease);
}
.lab-minihome[data-entered="true"] .lab-mh-title span:nth-child(2) { animation-delay: 0.08s; }
.lab-minihome[data-entered="true"] .lab-mh-title span:nth-child(3) { animation-delay: 0.22s; }

.lab-mh-right {
  position: relative;
  overflow: hidden;
}
.lab-mh-right img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.lab-mh-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #000 0%, rgba(0,0,0,0.4) 40%, transparent 70%);
}
@media (max-width: 640px) {
  .lab-mh-scrim { background: rgba(0,0,0,0.5); }
}
`;
