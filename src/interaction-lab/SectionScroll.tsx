import { useRef, useState } from "react";
import { RevealBlock, RevealPaceProvider } from "@/components/animated-text";
import { PROJECTS } from "@/lib/projects";
import { LabButton, ShortlistStar, useReplay } from "./ui";

/**
 * SCROLL REVEAL — previews the site's two reveal paces on one mock project
 * page, using the real RevealBlock exactly as project pages do:
 *
 *   Quick  the original snappy fade-up (lighter projects).
 *   Slow   settings read from matthewplaia.com (Framer): images fade only,
 *          0.8s, ease [.68,0,.22,.83]; text unrolls line by line, each line
 *          rising 10px over 1s, 0.05s apart (moodier projects).
 *
 * A project opts into slow with `revealPace: "slow"` in src/lib/projects.ts.
 * Unlike the other lab sections this is not a grid of small cards — a scroll
 * reveal only reads properly on a real scrolling page.
 */

type Mode = "quick" | "slow";

function Img({ src, className }: { src: string; className?: string }) {
  return (
    <RevealBlock className={className}>
      <img src={src} alt="" loading="lazy" />
    </RevealBlock>
  );
}

function Text({ text, as = "p", className }: { text: string; as?: "p" | "h2"; className?: string }) {
  const Tag = as;
  return (
    <RevealBlock>
      <Tag className={className}>{text}</Tag>
    </RevealBlock>
  );
}

function MockProjectPage() {
  // The project with the longest description (and enough images to fill the
  // page) — a multi-line paragraph is what shows the line-by-line reveal off.
  const p = [...PROJECTS]
    .filter((x) => x.media.filter((m) => m.type === "image").length >= 6)
    .sort((a, b) => b.description.length - a.description.length)[0] ?? PROJECTS[0];
  const imgs = [p.cover, ...p.media.filter((m) => m.type === "image").map((m) => m.src)];
  const at = (n: number) => imgs[n % imgs.length];
  const second =
    p.extendedDescription ??
    "Every surface on stage was chosen to hold light differently — matte where the actors stand, slick where the audience's eye should drift. The result reads as one continuous room that slowly comes apart over the evening.";

  return (
    <div className="scr-page">
      <Img src={at(0)} className="scr-img scr-img--hero" />

      <div className="scr-intro">
        <Text as="h2" text={p.title} className="scr-title" />
        <Text text={p.description} className="scr-body" />
      </div>

      <div className="scr-pair">
        <Img src={at(1)} className="scr-img" />
        <Img src={at(2)} className="scr-img" />
      </div>

      <div className="scr-intro">
        <Text as="h2" text="Process" className="scr-title" />
        <Text text={second} className="scr-body" />
      </div>

      <Img src={at(3)} className="scr-img scr-img--wide" />

      <div className="scr-pair">
        <Img src={at(4)} className="scr-img" />
        <Img src={at(5)} className="scr-img" />
      </div>

      <Img src={at(6)} className="scr-img scr-img--wide" />
    </div>
  );
}

export function SectionScroll() {
  const [mode, setMode] = useState<Mode>("slow");
  const { replayKey, replay } = useReplay();
  const topRef = useRef<HTMLDivElement>(null);

  const restart = (next?: Mode) => {
    if (next) setMode(next);
    replay();
    topRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  };

  return (
    <>
      <style>{css}</style>
      <div ref={topRef} />
      <div className="scr-bar">
        <div className="lab-devtoggle" role="group" aria-label="Reveal style">
          {(
            [
              ["quick", "Quick — lighter projects"],
              ["slow", "Slow — moody projects"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              data-active={mode === m}
              onClick={() => restart(m)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <LabButton small onClick={() => restart()}>
          ⟲ Replay from top
        </LabButton>
        <span className="scr-stars">
          <span className="lab-mono">SCROLL-01 images</span> <ShortlistStar id="SCROLL-01" />
          <span className="lab-mono">SCROLL-02 text</span> <ShortlistStar id="SCROLL-02" />
        </span>
      </div>
      <p className="scr-hint">
        {mode === "slow"
          ? "Slow — images fade only (0.8s, soft in-out). Text rises 10px and unrolls one line at a time (1s each, 0.05s apart)."
          : "Quick — every block lifts 16px and fades in over 0.5s, fast start then slowing."}{" "}
        Scroll down.
      </p>
      <div key={`${mode}-${replayKey}`}>
        <RevealPaceProvider pace={mode}>
          <MockProjectPage />
        </RevealPaceProvider>
      </div>
    </>
  );
}

const css = `
.scr-bar { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 0; background: rgba(0,0,0,0.86); backdrop-filter: blur(10px); border-bottom: 1px solid var(--lab-line); }
.scr-stars { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lab-dim); }
.scr-hint { margin: 16px 0 48px; max-width: 60ch; font-size: 0.85rem; line-height: 1.6; color: var(--lab-dim); }

.scr-page { display: flex; flex-direction: column; gap: clamp(28px, 5vw, 64px); }
.scr-img { overflow: hidden; background: #0a0a0a; }
.scr-img img { display: block; width: 100%; height: 100%; object-fit: cover; }
.scr-img--hero { aspect-ratio: 16 / 9; }
.scr-img--wide { aspect-ratio: 21 / 9; }
.scr-pair { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(12px, 2vw, 24px); }
.scr-pair .scr-img { aspect-ratio: 4 / 5; }

.scr-intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr); gap: clamp(20px, 4vw, 64px); align-items: start; padding: clamp(20px, 6vh, 80px) 0; }
.scr-title { font-family: var(--font-display, sans-serif); font-weight: 600; text-transform: uppercase; letter-spacing: -0.01em; line-height: 1; font-size: clamp(1.6rem, 3.2vw, 2.6rem); margin: 0; }
.scr-body { margin: 0; font-size: clamp(1rem, 1.3vw, 1.2rem); line-height: 1.65; color: rgba(255,255,255,0.78); max-width: 58ch; }

@media (max-width: 760px) {
  .scr-intro { grid-template-columns: 1fr; }
  .scr-pair { grid-template-columns: 1fr; }
  .scr-stars { margin-left: 0; }
}
`;
