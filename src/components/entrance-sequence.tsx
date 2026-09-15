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
 * fades in on the right AND a stand-in top nav (small wordmark + PROJECTS /
 * VISUALIZATIONS / CONNECT) fades in with it, so nothing lands late. It holds,
 * then the whole layer cross-fades out over the real homepage — whose real
 * nav is already in the same place — sitting underneath.
 *
 * Plays on every full load of "/" — opening the URL fresh, a refresh, or
 * re-typing the address all replay it. A module-level flag stops it from
 * replaying on client-side navigation back to the homepage within the same
 * page load (e.g. clicking the wordmark from another route). Renders the
 * black takeover from the very first frame — server-rendered and matched on
 * the client's first hydration pass — rather than deciding in a post-mount
 * effect, which used to let the real homepage flash on screen for a frame
 * before the takeover slammed on over it. Honours prefers-reduced-motion
 * (short, static path); the cursor-follow spawns are desktop-only, the auto
 * trail runs everywhere.
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
  // Lazy initializer, not a post-mount effect: this runs during the render
  // itself, on both the server and the client's first (hydrating) render —
  // so the black takeover is part of the very first HTML the browser paints,
  // instead of appearing a tick after the real homepage was already visible
  // underneath it. That gap used to be the "millisecond glitch" right before
  // the image trail starts: SSR sent the real page, the browser painted it,
  // and only then did a mount effect flip the overlay on over top of it.
  //
  // SSR always represents a fresh document load (a same-session SPA nav
  // back to "/" never re-invokes SSR, that path stays client-side), so the
  // server branch always returns true — unconditionally, without touching
  // `playedThisPageLoad` at all. That statelessness matters: if it read or
  // wrote that module-level flag here, a server process that reuses its
  // module cache across requests would have the SECOND visitor's homepage
  // load see "already played" from the FIRST visitor's request, silently
  // killing the animation for everyone after the first. The flag stays
  // exactly what it always was — a client-only, per-browser-session guard —
  // and the client branch below reproduces the server's `true` on its own
  // first hydration pass (a genuinely fresh module load gets a fresh
  // `false`), so the two agree and nothing mismatches.
  const [active, setActive] = useState(() => {
    if (typeof window === "undefined") return true;
    if (playedThisPageLoad) return false;
    playedThisPageLoad = true;
    return true;
  });
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<"centre" | "docked">("centre");
  const [payphone, setPayphone] = useState(false);

  const poolRef = useRef<HTMLDivElement>(null);
  const lastAt = useRef(0);
  const nextImg = useRef(0);
  // Gate on spawning trail images. Flipped off the instant the wordmark
  // starts docking, so nothing new can land over the incoming payphone.
  const spawnable = useRef(true);

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

        {/* Child of the wordmark so it inherits the exact "GRAHAM" width and
            the docked position — no estimated offsets to drift against the
            real row it cross-fades onto. */}
        <div className="rg-entr-disciplines" data-in={payphone ? "true" : undefined}>
          <span className="glass-button glass-button--quiet">Experiential</span>
          <span className="glass-button glass-button--quiet">Production / Scenic</span>
          <span className="glass-button glass-button--quiet">Architecture</span>
        </div>
      </div>

      <div className="rg-entr-payphone" data-in={payphone ? "true" : undefined}>
        <img src={HERO_URL} alt="" />
        <div className="rg-entr-scrim" />
      </div>

      {/* A stand-in for the real top nav, so PROJECTS / VISUALIZATIONS /
          CONNECT and the small wordmark arrive at the same moment the
          payphone does — not a beat later when the whole layer lifts. It's
          laid out like <SiteNav variant="top-transparent"> and reuses the
          real .glass-button classes, so the cross-fade to the live nav
          underneath is seamless. */}
      <div className="rg-entr-nav" data-in={payphone ? "true" : undefined}>
        <span className="rg-entr-nav-wm">
          Reid Graham <span>Design</span>
        </span>
        <span className="glass-button glass-button--quiet glass-button--touch rg-entr-nav-menu">
          Menu
        </span>
        <ul className="rg-entr-nav-links">
          <li>
            <span className="glass-button glass-button--quiet">Projects</span>
          </li>
          <li>
            <span className="glass-button glass-button--quiet">LET'S CONNECT!</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
