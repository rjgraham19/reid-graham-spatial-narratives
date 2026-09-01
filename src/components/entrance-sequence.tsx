import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { PROJECTS, HERO_URL } from "@/lib/projects";

/**
 * Homepage entrance sequence.
 *
 * Black takeover: the wordmark wipes in left-to-right, centred and large. A
 * self-running trail drops project images every ~380ms clustered around the
 * wordmark (on desktop it also follows the cursor — pointer hidden), so it
 * reads with no input on any device. At 2.0s the trail hard-stops and clears,
 * the wordmark glides centre -> its left resting spot; at 2.9s the payphone
 * fades in on the right over an already-clean frame. It holds, then the whole
 * layer cross-fades out over the real homepage sitting underneath.
 *
 * Plays on every full load of "/" — opening the URL fresh, a refresh, or
 * re-typing the address all replay it. A module-level flag stops it from
 * replaying on client-side navigation back to the homepage within the same
 * page load (e.g. clicking the wordmark from another route). Renders nothing
 * on the server / first hydration frame, so there is no hydration mismatch.
 * Honours prefers-reduced-motion (short, static path); the cursor-follow
 * spawns are desktop-only, the auto trail runs everywhere.
 */

const WORDMARK = "REID GRAHAM DESIGN";

// Resets on every real document load; survives SPA route changes. Keeps the
// takeover to once per page load, not once per mount of this component.
let playedThisPageLoad = false;

// Discipline-tagged projects ship real bundled cover images; the
// visualization entries use remote-only assets, so they are left out.
const REEL: string[] = PROJECTS.filter((p) => p.tags && p.tags.length > 0)
  .map((p) => p.cover)
  .slice(0, 10);

export function EntranceSequence() {
  const [active, setActive] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<"centre" | "docked">("centre");
  const [payphone, setPayphone] = useState(false);

  const poolRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef(0);
  const nextImg = useRef(0);
  // Gate on spawning trail images. Flipped off the instant the wordmark
  // starts docking, so nothing new can land over the incoming payphone.
  const spawnable = useRef(true);

  // Client-only decision: SSR renders nothing; an SPA nav back to "/" within
  // the same page load renders nothing; a fresh document load plays it.
  useEffect(() => {
    if (!playedThisPageLoad) {
      playedThisPageLoad = true;
      setActive(true);
    }
  }, []);

  const spawn = useCallback((clientX: number, clientY: number, rot: number) => {
    if (!spawnable.current) return;
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
    spawnable.current = true;

    // Hard-stop the trail: no more spawns, and fade out whatever is still
    // on screen fast, so the payphone comes in over a clean frame.
    const endTrail = () => {
      spawnable.current = false;
      const host = poolRef.current;
      if (!host) return;
      Array.from(host.children).forEach((child) => {
        const el = child as HTMLElement;
        el.style.animation = "none";
        el.style.transition = "opacity 0.28s linear";
        el.style.opacity = "0";
        window.setTimeout(() => el.remove(), 320);
      });
    };

    const finish = () => {
      setLeaving(true);
      window.setTimeout(() => setActive(false), 620);
    };

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      spawnable.current = false;
      setPhase("docked");
      setPayphone(true);
      const t = window.setTimeout(finish, 1500);
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    }

    // The self-running trail plays on every device — on a touch screen it is
    // the whole show (there is no cursor to follow). Images cluster around
    // the centred wordmark, then this stops the moment the wordmark docks.
    const start = performance.now();
    const auto = window.setInterval(() => {
      const host = poolRef.current;
      if (!host) return;
      const rr = host.getBoundingClientRect();
      const t = Math.min((performance.now() - start) / 2000, 1);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = rr.left + rr.width * (0.28 + 0.44 * ease);
      const y = rr.top + rr.height * (0.42 + 0.12 * Math.sin(t * Math.PI * 2.4));
      spawn(x, y, Math.random() * 7 - 3.5);
    }, 380);

    const t1 = window.setTimeout(() => {
      window.clearInterval(auto);
      endTrail();
      setPhase("docked");
    }, 2000);
    const t2 = window.setTimeout(() => setPayphone(true), 2900);
    const t3 = window.setTimeout(finish, 4700);

    return () => {
      window.clearInterval(auto);
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
