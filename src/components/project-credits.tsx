import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Project } from "@/lib/projects";

/**
 * Project credits — film-billing style, graduated from the Interaction Lab
 * (CREDITS-B5, "Indented groups", 2026-10-07).
 *
 *   MY ROLE
 *   ─────────────────────────────────────────────
 *            REID    PRODUCTION DESIGNER + SCENIC PAINTER
 *            GRAHAM
 *   COLLABORATORS
 *   ─────────────────────────────────────────────
 *                   ROSE    THESIS DIRECTOR
 *                   ALBAYAT
 *
 * Each credit is a ROLE in condensed white caps (Antonio) with the person's
 * name stacked small and grey beside it. Reid's role leads (24px Semibold);
 * collaborators' roles sit a step down (21px Medium); nothing is bigger
 * than the intro subtitle. On phones each name sits on one line above its
 * role.
 *
 * ALIGNMENT RULE (Reid, every screen size): MY ROLE / COLLABORATORS sit at
 * the left margin with a full-width rule under each; the credits (name +
 * role) are centred on the same centre line as the intro description
 * above; several people sit side by side as one centred group; a name is
 * exactly 7.5px from its role's text.
 *
 * Proportion lock: a two-line name stack is exactly the height of its
 * role's capitals, so their tops and bottoms line up (see `.pc-in` in
 * styles.css — the name size is derived from the role size).
 *
 * Entrance (on scroll into view, once): both labels fade up, both rules
 * draw left → right together and land at the same moment, then the credits
 * fade up group by group, at the project's reveal pace. Static under
 * prefers-reduced-motion.
 */

/** Splits a name into two balanced lines ("ROSE / ALBAYAT"). */
function stackLines(text: string): [string, string?] {
  const w = text.split(" ");
  if (w.length < 2) return [text];
  let best = 1;
  let bestMax = Infinity;
  for (let i = 1; i < w.length; i++) {
    const m = Math.max(w.slice(0, i).join(" ").length, w.slice(i).join(" ").length);
    if (m < bestMax) [best, bestMax] = [i, m];
  }
  return [w.slice(0, best).join(" "), w.slice(best).join(" ")];
}

function Name({ text }: { text: string }) {
  const [a, b] = stackLines(text);
  return (
    <span className="pc-label">
      {a}
      {b && (
        <>
          {/* Hidden on phones, where the name runs on one line. */}
          <br />
          {" "}
          {b}
        </>
      )}
    </span>
  );
}

export function ProjectCredits({ project, align }: { project: Project; align: "center" | "split" }) {
  const credits = (project.credits ?? []).filter((c) => !c.hidden);
  const mine = credits.find((c) => c.name === "Reid Graham");
  const others = credits.filter((c) => c.name !== "Reid Graham");

  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      // Fires once the block's top edge is 12% up from the bottom of the
      // screen — independent of the block's height, so it behaves the same
      // on a short landscape phone as on a tall monitor.
      { threshold: 0, rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Shrink-wrap each role to its longest rendered line. A role that wraps
  // keeps a full-width box, leaving a gap between the name and the
  // (centred) text and throwing off the pair's centring — Staging
  // Aesthetics' long role showed it. Re-run when the column width changes
  // or the webfont arrives.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const fit = () => {
      const vals = [...el.querySelectorAll<HTMLElement>(".pc-val")];
      vals.forEach((v) => (v.style.width = ""));
      for (const v of vals) {
        const range = document.createRange();
        range.selectNodeContents(v);
        const lines = [...range.getClientRects()];
        if (lines.length < 2) continue; // one line: the box already fits
        v.style.width = `${Math.ceil(Math.max(...lines.map((r) => r.width))) + 1}px`;
      }
    };
    fit();
    document.fonts?.ready.then(fit);
    let width = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [project.slug]);

  if (!mine && others.length === 0) return null;
  const beat = (i: number) => ({ "--d": `${i * 0.28}s` }) as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="pc"
      data-align={align}
      data-pace={project.revealPace ?? "quick"}
      data-in={inView || undefined}
    >
      <div className="pc-in">
        <div className="pc-s">
          {mine && (
            <div className="pc-group" data-mine style={beat(0)}>
              <p className="pc-cat">My role</p>
              <span className="pc-rule" aria-hidden />
              <div className="pc-flow">
                <span className="pc-pair">
                  <Name text={mine.name} />
                  <span className="pc-val" data-mine>
                    {mine.role}
                  </span>
                </span>
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div className="pc-group" style={beat(mine ? 1 : 0)}>
              <p className="pc-cat">Collaborators</p>
              <span className="pc-rule" aria-hidden />
              <div className="pc-flow">
                {others.map((c) => (
                  <span key={c.role + c.name} className="pc-pair" data-tier="2">
                    <Name text={c.name} />
                    <span className="pc-val">{c.role}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
