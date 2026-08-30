import { useRef, useState } from "react";
import { ExperimentFrame, getMeta, useReplay } from "./ui";
import { LAB_IMAGES, LAB_HIGHLIGHTS, LAB_LANDSCAPE, LAB_PORTRAIT } from "./data";

/* IMAGE-04 bounded parallax on scroll within the card. */
function Parallax({ img }: { img: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setY((e.currentTarget.scrollTop / e.currentTarget.scrollHeight) * 60);
  };
  return (
    <div className="lab-img-parallax" ref={ref} onScroll={onScroll}>
      <div className="lab-img-parallax-inner">
        <img src={img} alt="" style={{ transform: `translateY(${-y * 0.5}px) scale(1.15)` }} />
        <span className="lab-img-parallax-cap" style={{ transform: `translateY(${-y}px)` }}>
          Scroll — layers move at different rates
        </span>
      </div>
    </div>
  );
}

/* IMAGE-05 cursor preview trail over a project list. */
function PreviewTrail() {
  const poolRef = useRef<HTMLDivElement>(null);
  const last = useRef(0);
  const idx = useRef(0);
  const onMove = (e: React.MouseEvent) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const now = performance.now();
    if (now - last.current < 90) return;
    last.current = now;
    const host = poolRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const node = document.createElement("img");
    node.src = LAB_IMAGES[idx.current % LAB_IMAGES.length].src;
    idx.current += 1;
    node.className = "lab-img-trail-node";
    node.style.left = `${e.clientX - r.left}px`;
    node.style.top = `${e.clientY - r.top}px`;
    host.appendChild(node);
    while (host.children.length > 6) host.removeChild(host.firstChild as Node);
    setTimeout(() => node.remove(), 620);
  };
  return (
    <div className="lab-img-trail" onMouseMove={onMove}>
      <ul>
        {LAB_IMAGES.slice(0, 5).map((i) => (
          <li key={i.project}>{i.project}</li>
        ))}
      </ul>
      <div className="lab-img-trail-pool" ref={poolRef} aria-hidden />
    </div>
  );
}

/* IMAGE-06 stack separation on hover. */
function StackSeparation({ imgs }: { imgs: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="lab-img-stack"
      data-open={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      {imgs.slice(0, 4).map((src, i) => (
        <img key={src} src={src} alt="" style={{ ["--i" as string]: i, zIndex: 10 - i }} />
      ))}
    </div>
  );
}

export function SectionImage() {
  const r1 = useReplay();
  const r2 = useReplay();
  const r3 = useReplay();
  const land = LAB_LANDSCAPE;
  const port = LAB_PORTRAIT;
  return (
    <>
      <style>{css}</style>
      <div className="lab-grid">
        <ExperimentFrame meta={getMeta("IMAGE-01")} onReplay={r1.replay}>
          <div className="lab-img-fadeup" key={r1.replayKey}>
            {LAB_HIGHLIGHTS.slice(0, 6).map((i, n) => (
              <img
                key={i.src}
                src={i.src}
                alt={i.project}
                style={{ animationDelay: `${n * 90}ms` }}
              />
            ))}
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("IMAGE-02")} onReplay={r2.replay}>
          <div className="lab-img-single" key={r2.replayKey}>
            <img className="lab-img-mask" src={land[0].src} alt={land[0].project} />
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("IMAGE-03")} onReplay={r3.replay}>
          <div className="lab-img-single" key={r3.replayKey}>
            <img className="lab-img-aperture" src={port[0]?.src ?? land[1].src} alt="" />
          </div>
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("IMAGE-04")}>
          <Parallax img={land[2]?.src ?? land[0].src} />
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("IMAGE-05")}>
          <PreviewTrail />
        </ExperimentFrame>

        <ExperimentFrame meta={getMeta("IMAGE-06")}>
          <div className="lab-img-single lab-img-single--pad">
            <StackSeparation imgs={LAB_HIGHLIGHTS.map((i) => i.src)} />
          </div>
        </ExperimentFrame>
      </div>
    </>
  );
}

const css = `
.lab-img-single { position: absolute; inset: 0; overflow: hidden; background: #000; }
.lab-img-single--pad { display: grid; place-items: center; padding: 30px; }
.lab-img-single img { width: 100%; height: 100%; object-fit: cover; }

/* IMAGE-01 staggered fade up */
.lab-img-fadeup { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 1fr; gap: 3px; padding: 3px; }
.lab-img-fadeup img { width: 100%; height: 100%; object-fit: cover; opacity: 0; animation: lab-rise 0.6s var(--lab-ease, ease) both; }

/* IMAGE-02 directional mask */
.lab-img-mask { clip-path: inset(0 100% 0 0); animation: img-mask 0.9s var(--lab-ease, ease) 0.1s both; }
@keyframes img-mask { to { clip-path: inset(0 0 0 0); } }

/* IMAGE-03 aperture */
.lab-img-aperture { clip-path: inset(42% 42% 42% 42%); animation: lab-aperture 1s var(--lab-ease, ease) 0.1s both; }

/* IMAGE-04 parallax */
.lab-img-parallax { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; }
.lab-img-parallax-inner { position: relative; height: 220%; }
.lab-img-parallax-inner img { position: sticky; top: 0; width: 100%; height: 62%; object-fit: cover; }
.lab-img-parallax-cap { position: absolute; left: 14px; top: 40%; font-family: var(--font-mono, monospace); font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase; color: #fff; text-shadow: 0 2px 10px #000; }

/* IMAGE-05 trail */
.lab-img-trail { position: absolute; inset: 0; overflow: hidden; }
.lab-img-trail ul { position: absolute; inset: 0; margin: 0; padding: 28px; list-style: none; display: flex; flex-direction: column; gap: 12px; justify-content: center; }
.lab-img-trail li { font-family: var(--font-display, sans-serif); font-weight: 300; text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.9rem; color: rgba(255,255,255,0.5); }
.lab-img-trail-pool { position: absolute; inset: 0; pointer-events: none; }
.lab-img-trail-node { position: absolute; width: 150px; aspect-ratio: 3/2; object-fit: cover; transform: translate(-50%,-50%) scale(0.6); opacity: 0; animation: trail-pop 0.62s var(--lab-ease, ease) forwards; box-shadow: 0 12px 40px -12px rgba(0,0,0,0.7); }
@keyframes trail-pop { 20% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 0; transform: translate(-50%,-40%) scale(0.98); } }

/* IMAGE-06 stack */
.lab-img-stack { position: relative; width: min(60%, 220px); aspect-ratio: 1; cursor: pointer; }
.lab-img-stack img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border: 1px solid rgba(255,255,255,0.12); transition: transform 0.4s var(--lab-ease, ease); transform: rotate(calc(var(--i) * -2deg)) translate(calc(var(--i) * 3px), calc(var(--i) * 4px)); }
.lab-img-stack[data-open="true"] img { transform: translateX(calc(var(--i) * 34%)) rotate(calc(var(--i) * 1deg)); }
`;
