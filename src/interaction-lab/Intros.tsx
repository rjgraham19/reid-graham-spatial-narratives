import { useEffect, useState, type ReactElement } from "react";
import { FullscreenStage, LabButton, useLabPreload } from "./ui";
import { MiniHome } from "./MiniHome";
import { LAB_IMAGES, LAB_HIGHLIGHTS, LAB_WORDMARK, type LabImage } from "./data";

/* ─────────────────────────────────────────────────────────────────────
   ENTRANCE SIMULATIONS

   Each intro is a genuine full-viewport takeover: it starts from a clean
   state, plays a proposed first-entry sequence with real project images and
   the exact wordmark REID GRAHAM DESIGN, and resolves into <MiniHome/> — a
   working preview of the real homepage.

   The runner (IntroLaunch) owns the fullscreen shell, the Replay / Skip /
   Exit controls, the preload gate, and the reduced-motion branch. Replay
   bumps `playKey`, which hard-remounts the sequence — no page refresh.
   ───────────────────────────────────────────────────────────────────── */

type IntroProps = {
  playKey: number;
  reduced: boolean;
  onResolve: () => void;
};

const REEL = LAB_IMAGES;
const TILES = LAB_HIGHLIGHTS.slice(0, 9);

/* Shared: a line-by-line wipe of the wordmark. */
function Wordmark({ delay = 0, className = "" }: { delay?: number; className?: string }) {
  const [a, b, c] = LAB_WORDMARK.split(" ");
  return (
    <div className={"lab-intro-wm " + className} aria-label={LAB_WORDMARK}>
      <span style={{ animationDelay: `${delay}s` }}>{a}</span>
      <span style={{ animationDelay: `${delay + 0.09}s` }}>{b}</span>
      <span className="thin" style={{ animationDelay: `${delay + 0.22}s` }}>
        {c}
      </span>
    </div>
  );
}

/* A one-shot timer that survives remounts via key, calls onResolve once. */
function useResolveTimer(ms: number, onResolve: () => void, deps: unknown[]) {
  useEffect(() => {
    const t = setTimeout(onResolve, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* ── INTRO-01 · Rapid Reel ─────────────────────────────────────────── */
function Intro01({ playKey, reduced, onResolve }: IntroProps) {
  const shots = REEL.slice(0, 5);
  const each = reduced ? 420 : 360;
  const total = reduced ? 1400 : each * shots.length + 900;
  useResolveTimer(total, onResolve, [playKey]);
  return (
    <div className="lab-intro lab-intro-reel" key={playKey}>
      {shots.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.project}
          className="lab-intro-reel-shot"
          style={{ animationDelay: `${i * each}ms`, animationDuration: `${each + 240}ms` }}
        />
      ))}
      <div className="lab-intro-reel-vignette" />
      <Wordmark
        delay={reduced ? 0.2 : (each * shots.length) / 1000 - 0.6}
        className="center huge"
      />
    </div>
  );
}

/* ── INTRO-02 · Layered Handoff ────────────────────────────────────── */
function Intro02({ playKey, reduced, onResolve }: IntroProps) {
  const planes = REEL.slice(1, 4);
  useResolveTimer(reduced ? 1500 : 3400, onResolve, [playKey]);
  return (
    <div
      className="lab-intro lab-intro-layer"
      key={playKey}
      data-reduced={reduced ? "true" : "false"}
    >
      <div
        className="lab-intro-layer-field"
        style={{
          background: `radial-gradient(120% 90% at 30% 20%, ${planes[0].accent}55, #000 70%)`,
        }}
      />
      {planes.map((p, i) => (
        <div
          key={p.src}
          className="lab-intro-layer-plane"
          style={{
            animationDelay: `${0.25 + i * 0.28}s`,
            zIndex: 10 + i,
            ["--tz" as string]: `${(planes.length - i) * -60}px`,
          }}
        >
          <img src={p.src} alt={p.project} />
        </div>
      ))}
      <Wordmark delay={reduced ? 0.2 : 1.5} className="center big" />
      <div className="lab-intro-layer-lift" style={{ animationDelay: reduced ? "0.9s" : "2.5s" }} />
    </div>
  );
}

/* ── INTRO-03 · Aperture Sequence ──────────────────────────────────── */
function Intro03({ playKey, reduced, onResolve }: IntroProps) {
  const frames = REEL.slice(0, 4);
  useResolveTimer(reduced ? 1500 : 3200, onResolve, [playKey]);
  const shapes = [
    "inset(38% 8% 38% 8%)", // wide slot
    "inset(6% 34% 6% 34%)", // portal
    "inset(12% 12% 12% 12%)", // window
    "inset(0% 0% 0% 0%)", // full
  ];
  return (
    <div className="lab-intro lab-intro-ap" key={playKey}>
      {frames.map((f, i) => (
        <div
          key={f.src}
          className="lab-intro-ap-frame"
          style={{
            animationDelay: `${i * (reduced ? 0.35 : 0.62)}s`,
            ["--shape" as string]: shapes[i],
            zIndex: i + 1,
          }}
        >
          <img src={f.src} alt={f.project} />
        </div>
      ))}
      <Wordmark delay={reduced ? 0.2 : 2.4} className="center big" />
    </div>
  );
}

/* ── INTRO-04 · Tile Collapse ──────────────────────────────────────── */
function Intro04({ playKey, reduced, onResolve }: IntroProps) {
  useResolveTimer(reduced ? 1500 : 3000, onResolve, [playKey]);
  return (
    <div
      className="lab-intro lab-intro-tiles"
      key={playKey}
      data-reduced={reduced ? "true" : "false"}
    >
      <div className="lab-intro-tiles-grid">
        {TILES.map((t, i) => (
          <div
            key={t.src}
            className="lab-intro-tiles-cell"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <img src={t.src} alt={t.project} />
          </div>
        ))}
      </div>
      <Wordmark delay={reduced ? 0.2 : 2.0} className="corner" />
    </div>
  );
}

/* ── INTRO-05 · Spatial Filmstrip ──────────────────────────────────── */
function Intro05({ playKey, reduced, onResolve }: IntroProps) {
  const strip = [...REEL, ...REEL].slice(0, 8);
  useResolveTimer(reduced ? 1500 : 3600, onResolve, [playKey]);
  return (
    <div className="lab-intro lab-intro-strip" key={playKey}>
      <div className="lab-intro-strip-space">
        {strip.map((s, i) => (
          <div
            key={i}
            className="lab-intro-strip-plane"
            style={{ animationDelay: `${i * 0.24}s`, ["--i" as string]: i }}
          >
            <img src={s.src} alt={s.project} />
          </div>
        ))}
      </div>
      <Wordmark delay={reduced ? 0.2 : 2.6} className="center big" />
    </div>
  );
}

const INTROS: Record<string, (p: IntroProps) => ReactElement> = {
  "INTRO-01": Intro01,
  "INTRO-02": Intro02,
  "INTRO-03": Intro03,
  "INTRO-04": Intro04,
  "INTRO-05": Intro05,
};

/* ── The launch shell ──────────────────────────────────────────────── */
export function IntroLaunch({
  id,
  open,
  onClose,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  const { ready, progress } = useLabPreload();
  const [phase, setPhase] = useState<"intro" | "home">("intro");
  const [playKey, setPlayKey] = useState(0);
  const reduced = usePrefersReducedMotion();

  // INTRO-05 is desktop-only; on a narrow viewport fall back to INTRO-01.
  const isNarrow = useIsNarrow();
  const effectiveId = id === "INTRO-05" && isNarrow ? "INTRO-01" : id;
  const Intro = INTROS[effectiveId] ?? Intro01;

  // Reset to the clean state every time the stage is (re)opened.
  useEffect(() => {
    if (open) {
      setPhase("intro");
      setPlayKey((k) => k + 1);
    }
  }, [open, id]);

  const replay = () => {
    setPhase("intro");
    setPlayKey((k) => k + 1);
  };
  const skip = () => setPhase("home");

  return (
    <FullscreenStage
      open={open}
      onClose={onClose}
      hint={`${effectiveId} · ${phase === "intro" ? "playing" : "homepage preview"}`}
      controls={
        <>
          <LabButton small onClick={replay}>
            ⟲ Replay
          </LabButton>
          {phase === "intro" ? (
            <LabButton small onClick={skip}>
              Skip intro
            </LabButton>
          ) : null}
          <LabButton small variant="primary" onClick={onClose}>
            Exit to lab
          </LabButton>
        </>
      }
    >
      {!ready ? (
        <div className="lab-intro lab-intro-loading">
          <div className="lab-spinner" />
          <div className="lab-intro-loading-bar">
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p>Preloading project images…</p>
        </div>
      ) : phase === "intro" ? (
        <Intro playKey={playKey} reduced={reduced} onResolve={() => setPhase("home")} />
      ) : (
        <div className="lab-intro-home">
          <MiniHome entered />
        </div>
      )}
      <IntroCss />
    </FullscreenStage>
  );
}

/* Small hooks kept local to the intro system. */
function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
}
function useIsNarrow() {
  const [n, setN] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const on = () => setN(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return n;
}

/* All intro CSS in one injected tag, scoped by the .lab-intro* class names. */
function IntroCss() {
  return <style>{css}</style>;
}

const css = `
.lab-intro {
  position: absolute; inset: 0; overflow: hidden; background: #000;
  color: hsl(0 0% 98%);
}
/* Resting state — never gated on an animation reaching its end, so the
   resolved homepage is always visible even where the animation clock is
   throttled (embedded preview panes, aggressive power saving). The fade is a
   pure enhancement layered on a visible base. */
.lab-intro-home { position: absolute; inset: 0; opacity: 1; }
.lab-intro-home > * { animation: lab-fade 0.5s ease; }

.lab-intro-loading {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px;
}
.lab-intro-loading p {
  font-family: var(--font-mono, monospace); font-size: 0.62rem;
  letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.45);
}
.lab-intro-loading-bar { width: 180px; height: 2px; background: rgba(255,255,255,0.15); }
.lab-intro-loading-bar span { display: block; height: 100%; background: hsl(0 0% 98%); transition: width 0.2s linear; }

/* Wordmark */
.lab-intro-wm {
  position: absolute; z-index: 60;
  font-family: var(--font-display, "Poppins", sans-serif);
  font-weight: 900; text-transform: uppercase; line-height: 0.82;
  letter-spacing: -0.04em; pointer-events: none;
}
.lab-intro-wm span { display: block; opacity: 0; animation: lab-clip-lr 0.9s var(--lab-ease, ease) both; }
.lab-intro-wm .thin { font-weight: 100; color: rgba(255,255,255,0.86); }
.lab-intro-wm.center {
  left: 50%; top: 50%; transform: translate(-50%,-50%); text-align: left;
}
.lab-intro-wm.corner { left: clamp(16px,4vw,52px); bottom: clamp(16px,5vh,52px); }
.lab-intro-wm.huge { font-size: clamp(2.4rem, 9vw, 7rem); }
.lab-intro-wm.big { font-size: clamp(2rem, 7vw, 5rem); }

/* INTRO-01 Rapid Reel */
.lab-intro-reel-shot {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transform: scale(1.08);
  animation-name: reel-shot; animation-timing-function: var(--lab-ease, ease);
  animation-fill-mode: both;
}
@keyframes reel-shot {
  0% { opacity: 0; transform: scale(1.1); }
  18% { opacity: 1; transform: scale(1.04); }
  82% { opacity: 1; transform: scale(1.0); }
  100% { opacity: 0; transform: scale(0.99); }
}
.lab-intro-reel-shot:last-of-type { animation-name: reel-last; }
@keyframes reel-last {
  0% { opacity: 0; transform: scale(1.1); }
  30% { opacity: 1; transform: scale(1.03); }
  100% { opacity: 1; transform: scale(1.0); }
}
.lab-intro-reel-vignette {
  position: absolute; inset: 0; z-index: 50; pointer-events: none;
  background: radial-gradient(120% 80% at 50% 60%, transparent 45%, rgba(0,0,0,0.6) 100%);
}

/* INTRO-02 Layered Handoff */
.lab-intro-layer-field { position: absolute; inset: 0; animation: lab-fade 0.6s ease both; }
.lab-intro-layer-plane {
  position: absolute; inset: 8% 10%; border-radius: 4px; overflow: hidden;
  opacity: 0; transform: translateY(30px) scale(1.06);
  box-shadow: 0 40px 120px -30px rgba(0,0,0,0.8);
  animation: layer-plane 1s var(--lab-ease, ease) both;
  backdrop-filter: blur(2px);
}
.lab-intro-layer[data-reduced="true"] .lab-intro-layer-plane { backdrop-filter: none; }
.lab-intro-layer-plane img { width: 100%; height: 100%; object-fit: cover; opacity: 0.92; }
@keyframes layer-plane {
  from { opacity: 0; transform: translateY(34px) scale(1.08); filter: blur(6px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
.lab-intro-layer[data-reduced="true"] .lab-intro-layer-plane { animation-name: lab-fade; }
.lab-intro-layer-lift {
  position: absolute; inset: 0; z-index: 40; background: #000;
  transform: translateY(0); animation: layer-lift 0.9s var(--lab-ease, ease) both;
}
@keyframes layer-lift {
  0%, 30% { transform: translateY(0); }
  100% { transform: translateY(-100%); }
}

/* INTRO-03 Aperture */
.lab-intro-ap-frame {
  position: absolute; inset: 0;
  clip-path: inset(50% 50% 50% 50%);
  animation: ap-frame 1.4s var(--lab-ease, ease) both;
}
.lab-intro-ap-frame img { width: 100%; height: 100%; object-fit: cover; }
@keyframes ap-frame {
  0% { clip-path: inset(50% 50% 50% 50%); }
  30% { clip-path: var(--shape); }
  70% { clip-path: var(--shape); }
  100% { clip-path: inset(50% 50% 50% 50%); }
}
.lab-intro-ap-frame:last-of-type { animation-name: ap-frame-last; }
@keyframes ap-frame-last {
  0% { clip-path: inset(50% 50% 50% 50%); }
  60% { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}

/* INTRO-04 Tile Collapse */
.lab-intro-tiles-grid {
  position: absolute; inset: 0; display: grid;
  grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr);
  gap: 3px;
  animation: tiles-grid 1s var(--lab-ease, ease) 1.7s both;
}
@keyframes tiles-grid {
  0% { transform: none; opacity: 1; }
  100% { transform: translateX(-26%) scale(0.9); opacity: 0.16; }
}
.lab-intro-tiles[data-reduced="true"] .lab-intro-tiles-grid { animation: none; }
.lab-intro-tiles-cell { overflow: hidden; opacity: 0; transform: scale(1.1); animation: lab-fade 0.5s var(--lab-ease, ease) both, tiles-cell 0.6s var(--lab-ease, ease) both; }
@keyframes tiles-cell { from { transform: scale(1.12); } to { transform: scale(1); } }
.lab-intro-tiles-cell img { width: 100%; height: 100%; object-fit: cover; }

/* INTRO-05 Spatial Filmstrip */
.lab-intro-strip-space {
  position: absolute; inset: 0; perspective: 1400px; perspective-origin: 50% 50%;
  transform-style: preserve-3d;
}
.lab-intro-strip-plane {
  position: absolute; left: 50%; top: 50%;
  width: min(64vw, 900px); aspect-ratio: 16/9;
  margin-left: calc(min(64vw, 900px) / -2);
  margin-top: calc((min(64vw, 900px) * 9 / 16) / -2);
  transform-style: preserve-3d;
  opacity: 0;
  animation: strip-plane 2.4s var(--lab-ease, ease) both;
}
.lab-intro-strip-plane img { width: 100%; height: 100%; object-fit: cover; box-shadow: 0 40px 120px -40px rgba(0,0,0,0.9); }
@keyframes strip-plane {
  0% { opacity: 0; transform: translateZ(-2600px) translateX(6%); }
  12% { opacity: 1; }
  86% { opacity: 1; }
  100% { opacity: 0; transform: translateZ(360px) translateX(-4%); }
}
.lab-intro-strip-plane:last-of-type { animation-name: strip-last; }
@keyframes strip-last {
  0% { opacity: 0; transform: translateZ(-1800px); }
  40% { opacity: 1; }
  100% { opacity: 1; transform: translateZ(0); }
}
`;
