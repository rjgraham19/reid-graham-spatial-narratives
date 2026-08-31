import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PROJECTS, HERO_URL } from "@/lib/projects";

/**
 * First-visit entrance for the homepage.
 *
 * Black takeover: the wordmark wipes in left-to-right, centred and large. A
 * self-running trail drops project images every ~380ms along a slow arc (and
 * follows the cursor if it moves — pointer hidden), so it reads with no input.
 * At 2.0s the wordmark glides centre -> its left resting spot; at 2.9s the
 * payphone fades in on the right. It holds, then the whole layer cross-fades
 * out over the real homepage sitting underneath.
 *
 * Plays once per browser — a flag in localStorage suppresses it on every
 * later visit. Renders nothing on the server and for returning visitors, so
 * there is no hydration mismatch. Honours prefers-reduced-motion (short,
 * static path) and skips the pointer trail on coarse pointers.
 */

const SEEN_KEY = "rg:entrance-v1";
const WORDMARK = "REID GRAHAM DESIGN";

// Discipline-tagged projects ship real bundled cover images; the
// visualization entries use remote-only assets, so they are left out.
const REEL: string[] = PROJECTS.filter((p) => p.tags && p.tags.length > 0)
  .map((p) => p.cover)
  .slice(0, 10);

function hasSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* private mode / storage disabled — just play every time, no worse */
  }
}

export function EntranceSequence() {
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<"centre" | "docked">("centre");
  const [payphone, setPayphone] = useState(false);

  const poolRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef(0);
  const nextImg = useRef(0);

  // Client-only decision: SSR and returning visitors render nothing.
  useEffect(() => {
    if (!hasSeen()) setActive(true);
  }, []);

  const spawn = useCallback((clientX: number, clientY: number, rot: number) => {
    const host = poolRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();
    const node = document.createElement("img");
    node.src = REEL[nextImg.current % REEL.length];
    nextImg.current += 1;
    node.className = "rg-entr-node";
    node.style.left = `${clientX - r.left}px`;
    node.style.top = `${clientY - r.top}px`;
    node.style.setProperty("--rot", `${rot.toFixed(1)}deg`);
    host.appendChild(node);
    while (host.children.length > 6) host.removeChild(host.firstChild as Node);
    window.setTimeout(() => node.remove(), 1250);
  }, []);

  useEffect(() => {
    if (!active) return;

    // Lock the page behind the takeover while it plays.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const finish = () => {
      markSeen();
      setLeaving(true);
      window.setTimeout(() => setActive(false), 620);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("docked");
      setPayphone(true);
      const t = window.setTimeout(finish, 1500);
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    }

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let auto: number | undefined;
    if (!coarse) {
      const start = performance.now();
      auto = window.setInterval(() => {
        const host = poolRef.current;
        if (!host) return;
        const rr = host.getBoundingClientRect();
        const t = Math.min((performance.now() - start) / 2400, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const x = rr.left + rr.width * (0.18 + 0.64 * ease);
        const y = rr.top + rr.height * (0.46 + 0.1 * Math.sin(t * Math.PI * 2.4));
        spawn(x, y, Math.random() * 7 - 3.5);
      }, 380);
    }

    const t1 = window.setTimeout(() => {
      setPhase("docked");
      if (auto) window.clearInterval(auto);
    }, 2000);
    const t2 = window.setTimeout(() => setPayphone(true), 2900);
    const t3 = window.setTimeout(finish, 4700);

    return () => {
      if (auto) window.clearInterval(auto);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, spawn]);

  if (!active) return null;

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const now = performance.now();
    if (now - lastAt.current < 120) return;
    lastAt.current = now;
    spawn(e.clientX, e.clientY, Math.random() * 8 - 4);
  };

  const [a, b, c] = WORDMARK.split(" ");
  return (
    <div
      className={`rg-entrance${leaving ? " rg-entrance--leaving" : ""}`}
      onPointerMove={onMove}
      aria-hidden
    >
      <div className="rg-entr-pool" ref={poolRef} />

      <div className="rg-entr-wm" data-phase={phase}>
        <span>{a}</span>
        <span>{b}</span>
        <span className="rg-entr-thin">{c}</span>
      </div>

      <div className="rg-entr-payphone" data-in={payphone ? "true" : undefined}>
        <img src={HERO_URL} alt="" />
        <div className="rg-entr-scrim" />
      </div>
    </div>
  );
}
