import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PROJECTS, type Project } from "@/lib/projects";
import { longestWordEms, textEms } from "@/lib/title-metrics";
import { DeviceToggle, LabButton, ShortlistStar, type Device } from "./ui";

/**
 * PROJECT CREDITS — round 4: film billing, role-first.
 *
 * Every credit is a ROLE in the big type with the person's NAME as small
 * stacked grey text beside it ("REID / GRAHAM  PRODUCTION DESIGNER + …") —
 * the role is what matters; the name repeats what the site already says.
 *
 *   A  Margin labels   MY ROLE / COLLABORATORS in a narrow left margin,
 *                      names stacked against each role, fine rules between.
 *   B  Stacked groups  MY ROLE / COLLABORATORS each on their own line above
 *                      the group, everything left-aligned; collaborators
 *                      flow and wrap like a billing block.
 *
 *   Credits are set in Antonio (condensed, Google Fonts, lab-only) — round 5
 *   dropped the General Sans credit option.
 *   Your name    "name"  Reid's name stacked beside his role, like everyone.
 *                "role"  Reid's role on its own (no name).
 *   Subtitle     General Sans (live) or Antonio — tries the condensed face
 *                beyond the credits, under the General Sans title.
 *
 * Proportion lock: a two-line name stack is exactly as tall as the role's
 * capital letters, so their tops and bottoms line up — the label size is
 * derived from the role size and Antonio's cap height (measured 0.859).
 *
 * Hierarchy rule (Reid, 2026-10-07): nothing in the credits is bigger than
 * the intro subtitle — 24px desktop, 16px phone.
 *
 * "In project context" loads the REAL project page in an iframe and swaps
 * the new block into the live credits' slot; the page code is untouched.
 */

type Treatment = "current" | "B1" | "B4" | "B5";
type Variant = Exclude<Treatment, "current">;
type Content = "name" | "role";
type SubFont = "general" | "antonio" | "oswald" | "barlow";
type SubWeight = "300" | "400" | "500";
type Sub = { font: SubFont; weight: SubWeight };
type View = "compare" | "full" | "context";
type Align = "center" | "split";
type RoleAlign = "left" | "center";
type Sel = {
  treatment: Treatment;
  content: Content;
  roleAlign: RoleAlign;
  /** Scroll-in entrance on/off, and a counter that remounts it to replay. */
  motion: boolean;
  replay: number;
};
const ROLEALIGNS: [RoleAlign, string][] = [
  ["left", "Left"],
  ["center", "Centred"],
];

const VARIANTS: [Variant, string][] = [
  ["B1", "A · Margin labels"],
  ["B4", "B · Stacked groups"],
  ["B5", "C · Indented groups"],
];
const TREATMENTS: [Treatment, string][] = [["current", "Previous"], ...VARIANTS];
const CONTENTS: [Content, string][] = [
  ["name", "With my name"],
  ["role", "Without my name"],
];
const SUBFONTS: [SubFont, string][] = [
  ["general", "General Sans (previous)"],
  ["antonio", "Antonio"],
  ["oswald", "Oswald"],
  ["barlow", "Barlow Semi Cond."],
];
const SUBWEIGHTS: [SubWeight, string][] = [
  ["300", "Light"],
  ["400", "Regular"],
  ["500", "Medium"],
];

/* Condensed subtitle faces. Antonio has a single width (weights only); its
   designer's Oswald is a touch wider, Barlow Semi Condensed wider again.
   All a step up from the live 24px / 16px, since condensed caps read
   smaller. */
const SUB_FACES: Record<Exclude<SubFont, "general">, { fam: string; track: string }> = {
  antonio: { fam: `"Antonio", "Arial Narrow", sans-serif`, track: "0.03em" },
  oswald: { fam: `"Oswald", "Arial Narrow", sans-serif`, track: "0.02em" },
  barlow: { fam: `"Barlow Semi Condensed", "Arial Narrow", sans-serif`, track: "0.02em" },
};
const SUB_SIZE = { desktop: 26, tablet: 21, mobile: 17 };

const PROJECT_CHOICES: [slug: string, label: string][] = [
  ["reshuffling-the-deck", "Reshuffling the Deck"],
  ["lollapalooza", "Lollapalooza · 6 credits"],
  ["tab-renaissance", "Garden of Earthly Delights · 5 credits"],
];

/* Simulated window per device, and the width the credits slot gets inside
   it on the real page (split: the 11fr column beside the hero, after the
   page's 64px right padding and 64px gap; center: the padded page column). */
const WINDOW = { desktop: { w: 1440, h: 900 }, mobile: { w: 390, h: 844 } } as const;
function slotWidth(device: Device, align: Align) {
  if (device === "mobile") return 390 - 48;
  return align === "split" ? Math.round(((1440 - 64 - 64) * 11) / 20) : 1440 - 128;
}
const alignOf = (p: Project): Align => (p.heroPortrait ? "split" : "center");

function splitCredits(p: Project) {
  const credits = (p.credits ?? []).filter((c) => !c.hidden);
  return {
    mine: credits.find((c) => c.name === "Reid Graham"),
    others: credits.filter((c) => c.name !== "Reid Graham"),
  };
}

/* ── Current ───────────────────────────────────────────────────────────
   A copy of IntroCredits for the compare/full views, with its lg:/md:
   breakpoints resolved for the simulated device (those read the real
   window, not this box). Context view uses the live component itself. */
function CurrentCredits({ project, align, device }: { project: Project; align: Align; device: Device }) {
  const { mine, others } = splitCredits(project);
  if (!mine && others.length === 0) return null;
  const size = device === "mobile" ? "text-[10px]" : "text-[13px]";
  const label = `${size} tracking-[0.14em] text-foreground/50 [text-box:trim-start_cap_alphabetic]`;
  const role = `${size} tracking-[0.14em] text-foreground font-medium`;
  const collab = `${size} leading-relaxed tracking-[0.14em] text-foreground/70`;
  const collabLabel = others.length === 1 ? others[0].role : "Collaborators";
  const wrap =
    align === "center"
      ? "mx-auto max-w-4xl text-center [&_p]:text-balance"
      : device === "mobile"
        ? "text-center"
        : "text-left";
  return (
    <div className={`uppercase grid gap-y-3 ${wrap}`}>
      {mine && (
        <div>
          <p className={`${label} font-normal`}>My role</p>
          <p className={`mt-1 ${role}`}>{mine.role}</p>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <p className={`${label} font-normal`}>{collabLabel}</p>
          <p className={`mt-1 ${collab}`}>
            {others.length === 1 ? (
              <span className="text-foreground/90">{others[0].name}</span>
            ) : (
              others.map((c, i) => (
                <span key={c.role}>
                  {i > 0 && <span className="mx-2.5 text-foreground/30">|</span>}
                  <span className="text-foreground/90">{c.name}</span>, {c.role}
                </span>
              ))
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Film billing ──────────────────────────────────────────────────────
   A name stacks into two balanced lines ("ROSE / ALBAYAT") so the stack
   matches the role's cap height. On phones the break is hidden and the
   name runs on one line above its role. */
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

function Name({ text }: { text?: string }) {
  if (!text) return <span className="crb-label" />;
  const [a, b] = stackLines(text);
  return (
    <span className="crb-label">
      {a}
      {b && (
        <>
          <br />
          {" "}
          {b}
        </>
      )}
    </span>
  );
}

function Billing({
  project,
  variant,
  content,
  align,
  roleAlign = "left",
  motion = false,
}: {
  project: Project;
  variant: Variant;
  content: Content;
  align: Align;
  /** C only: "center" centres Reid's role over the credits column. */
  roleAlign?: RoleAlign;
  /** Scroll-in entrance: rules draw left → right, text fades up. */
  motion?: boolean;
}) {
  const { mine, others } = splitCredits(project);
  const myName = content === "name" ? mine?.name : undefined;
  let body: ReactNode;

  // Plays once, when the block scrolls into view. Uses the observer of the
  // document the block actually lives in, so it also works when portalled
  // into the real page's iframe.
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!motion || !el) return;
    const win = el.ownerDocument.defaultView ?? window;
    const io = new win.IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [motion]);
  // Each group / row starts a beat after the one before.
  const beat = (i: number) => ({ "--d": `${i * 0.28}s` }) as CSSProperties;

  if (variant === "B4" || variant === "B5") {
    // B4 stacks category / rule / credits; B5 hangs the category at the
    // left and indents the rule + credits beneath it (desktop only).
    body = (
      <div className="crb-s">
        {mine && (
          <div className="crb-s-group" data-mine style={beat(0)}>
            <p className="crb-cat">My role</p>
            <span className="crb-s-rule" />
            <div className="crb-s-flow">
              <span className="crb-s-pair">
                {myName && <Name text={myName} />}
                <span className="crb-val" data-mine>
                  {mine.role}
                </span>
              </span>
            </div>
          </div>
        )}
        {others.length > 0 && (
          <div className="crb-s-group" style={beat(mine ? 1 : 0)}>
            <p className="crb-cat">Collaborators</p>
            <span className="crb-s-rule" />
            <div className="crb-s-flow">
              {others.map((c) => (
                <span key={c.role + c.name} className="crb-s-pair" data-tier="2">
                  <Name text={c.name} />
                  <span className="crb-val">{c.role}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    body = (
      <div className="crb-grid">
        {mine && (
          <div className="crb-row" style={beat(0)}>
            <span className="crb-cat">My role</span>
            <Name text={myName} />
            <span className="crb-val" data-mine>
              {mine.role}
            </span>
          </div>
        )}
        {others.map((c, i) => (
          <div key={c.role + c.name} className="crb-row" data-tier="2" style={beat(i + (mine ? 1 : 0))}>
            {(i > 0 || mine) && <span className="crb-rule" data-span={i === 0 ? "full" : undefined} />}
            <span className="crb-cat">{i === 0 ? "Collaborators" : ""}</span>
            <Name text={c.name} />
            <span className="crb-val">{c.role}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="crx crb"
      data-variant={variant}
      data-align={align}
      data-role-align={roleAlign}
      data-pace={project.revealPace ?? "quick"}
      data-motion={motion || undefined}
      data-in={inView || undefined}
    >
      <div className="crb-in">{body}</div>
    </div>
  );
}

function Credits({ project, sel, align, device }: { project: Project; sel: Sel; align: Align; device: Device }) {
  return sel.treatment === "current" ? (
    <CurrentCredits project={project} align={align} device={device} />
  ) : (
    <Billing
      key={sel.replay}
      project={project}
      variant={sel.treatment}
      content={sel.content}
      align={align}
      roleAlign={sel.roleAlign}
      motion={sel.motion}
    />
  );
}

/* Shared by the lab and the iframe'd page (injected there with the block).
   The @import must stay first. Antonio (Google Fonts, OFL) is lab-only, not
   self-hosted. Font rules use three classes + !important to beat the page's
   `.intro-font *` General Sans rule. Sizes are custom properties on
   `.crb-in` so the container queries (which read `.crx`) can step them.

   --lab is DERIVED: two label lines (one line-height + one cap height) =
   one role cap height, i.e. lab = t1 × cap ÷ (lab-lh + cap). */
const CREDITS_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Antonio:wght@300..700&family=Oswald:wght@300..600&family=Barlow+Semi+Condensed:wght@300;400;500&display=swap");
.crx {
  container-type: inline-size;
  color: #f5f5f5;
  text-align: left;
  text-transform: none;
}
.crb {
  --fam: "Antonio", "Arial Narrow", sans-serif;
  --cap: 0.859;
  --lab-lh: 1.1;
  --lab-track: 0.06em;
  --val-track: 0.01em;
  --val-lh: 1.04;
  --rule: #303030;
}
/* Desktop + tablet columns: the role tops out at the subtitle's 24px. */
.crb-in {
  --t1: 24px;
  --t2: 21px;
  --pad: 16px;
  --lab: calc(var(--t1) * var(--cap) / (var(--lab-lh) + var(--cap)));
}
/* Collaborators' roles sit a step below Reid's; their name stacks re-lock
   to that smaller cap height. */
.crb-in [data-tier="2"] {
  --t1: var(--t2);
  --lab: calc(var(--t1) * var(--cap) / (var(--lab-lh) + var(--cap)));
}

.crx.crb :is(.crb-cat, .crb-label, .crb-val) {
  font-family: var(--fam) !important;
  text-transform: uppercase;
  margin: 0;
}
.crb .crb-cat, .crb .crb-label {
  font-size: var(--lab);
  font-weight: 500;
  line-height: var(--lab-lh);
  letter-spacing: var(--lab-track);
  color: #a0a0a0;
  text-box: trim-both cap alphabetic;
}
.crb .crb-cat { white-space: nowrap; }
.crb .crb-label { text-align: right; }
/* Roles: the bold white line. Reid's a step heavier than collaborators'. */
.crb .crb-val {
  font-size: var(--t1);
  font-weight: 500;
  line-height: var(--val-lh);
  letter-spacing: var(--val-track);
  color: #d8d8d8;
  text-box: trim-both cap alphabetic;
  text-wrap: balance;
}
.crb .crb-val[data-mine] { font-weight: 600; color: #f5f5f5; }

/* 1 — three columns: category | stacked name | role. Cells top-aligned so
   cap tops line up across the row; every cell placed explicitly so the
   rules can share row 1. */
.crb-grid {
  display: grid;
  grid-template-columns: max-content max-content minmax(0, 1fr);
  width: fit-content;
  max-width: 100%;
}
.crx[data-align="center"] .crb-grid { margin-inline: auto; }
.crb-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: auto;
  align-items: start;
}
.crb-row > .crb-cat { grid-area: 1 / 1; padding: var(--pad) 28px var(--pad) 0; }
.crb-row > .crb-label { grid-area: 1 / 2; padding: var(--pad) 12px var(--pad) 0; }
.crb-row > .crb-val { grid-area: 1 / 3; padding: var(--pad) 0; }
.crb-rule {
  grid-row: 1;
  grid-column: 2 / -1;
  align-self: start;
  height: 1px;
  background: var(--rule);
}
.crb-rule[data-span="full"] { grid-column: 1 / -1; }

/* 2 — stacked groups: a category line over each group, left-aligned;
   collaborators flow and wrap. */
.crb-s { width: fit-content; max-width: 100%; }
.crx[data-align="center"] .crb-s { margin-inline: auto; }
.crb-s-group + .crb-s-group { margin-top: 30px; }
.crx.crb .crb-s-group > .crb-cat { margin-bottom: 6px; }
.crb-s-rule { display: block; height: 1px; margin-bottom: 16px; background: var(--rule); }
.crb-s-flow { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px 32px; }

/* C — indented groups: the category hangs alone at the left with a full-
   width rule right under it; the credits are indented beneath the rule. */
.crb[data-variant="B5"] .crb-s {
  display: grid;
  grid-template-columns: max-content minmax(0, auto);
}
.crb[data-variant="B5"] .crb-s-group {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
}
.crx.crb[data-variant="B5"] .crb-s-group > .crb-cat { grid-area: 1 / 1; padding-right: 28px; }
.crb[data-variant="B5"] .crb-s-rule { grid-area: 2 / 1 / 3 / -1; }
.crb[data-variant="B5"] .crb-s-flow { grid-area: 3 / 2; }
/* "Centred": Reid's role sits in the middle of the credits column (the
   span the collaborators occupy) instead of starting at the indent. */
.crb[data-variant="B5"][data-role-align="center"] .crb-s-group[data-mine] .crb-s-flow { justify-content: center; }
.crb[data-variant="B5"][data-role-align="center"] .crb-s-group[data-mine] .crb-val { text-align: center; }
.crb-s-pair { display: inline-flex; align-items: flex-start; gap: 7.5px; max-width: 100%; }
.crb-s-pair > .crb-val { min-width: 0; }

/* Phones: role capped at the 16px phone subtitle. Each name moves onto one
   line above its role; in 1 the category also takes its own line. */
@container (max-width: 30rem) {
  .crb-in { --t1: 16px; --t2: 14px; --pad: 13px; --lab: 10px; }
  .crb-in [data-tier="2"] { --lab: 10px; }
  .crb .crb-label { text-align: left; }
  .crb .crb-label br { display: none; }
  .crb .crb-label:empty { display: none; }

  .crb-grid { grid-template-columns: minmax(0, 1fr); }
  .crb-row { grid-template-rows: auto auto auto; }
  .crb-row > .crb-cat { grid-area: 1 / 1; padding: var(--pad) 0 0; }
  .crb-row > .crb-cat:empty { display: none; }
  .crb-row > .crb-label { grid-area: 2 / 1; padding: var(--pad) 0 0; }
  .crb-row > .crb-val { grid-area: 3 / 1; padding: 7px 0 var(--pad); }
  .crb-row > .crb-cat:not(:empty) ~ .crb-label { padding-top: 10px; }
  .crb-row > .crb-cat:not(:empty) ~ .crb-label:empty ~ .crb-val { padding-top: 10px; }
  .crb-rule, .crb-rule[data-span="full"] { grid-column: 1 / -1; }

  .crb-s-flow { flex-direction: column; gap: 14px; }
  .crb-s-pair { flex-direction: column; gap: 7px; }
  /* C falls back to B's plain stack — no room to indent on a phone. */
  .crb[data-variant="B5"] .crb-s, .crb[data-variant="B5"] .crb-s-group { display: block; }
  .crx.crb[data-variant="B5"] .crb-s-group > .crb-cat { padding-right: 0; }
  .crb[data-variant="B5"][data-role-align="center"] .crb-s-group[data-mine] .crb-s-flow { justify-content: flex-start; }
  .crb[data-variant="B5"][data-role-align="center"] .crb-s-group[data-mine] .crb-val { text-align: left; }
}

/* Entrance (data-motion), played when the block scrolls into view
   (data-in). All categories fade up together; then every rule draws
   left → right at once, same start and same duration so they land
   together (Reid: they must finish at the exact same time) — a quick
   pencil stroke (scaleX, fading in over the first part so it starts soft);
   then the credits fade up group by group, offset by --d. Text timing matches the site's scroll reveals: quick = 0.5s +
   16px lift; slow (moody projects) = 1s + 10px on a softer curve. */
.crb[data-motion] {
  --tx-dur: 0.5s; --tx-lift: 16px; --tx-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
  --rule-dur: 0.7s; --rule-ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --rule-lag: 0.12s; --credit-lag: 0.38s;
}
.crb[data-motion][data-pace="slow"] {
  --tx-dur: 1s; --tx-lift: 10px; --tx-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --rule-dur: 0.9s; --rule-lag: 0.18s; --credit-lag: 0.5s;
}
.crb[data-motion] :is(.crb-cat, .crb-s-flow, .crb-row > .crb-label, .crb-row > .crb-val) {
  opacity: 0;
  transform: translateY(var(--tx-lift));
  transition: opacity var(--tx-dur) var(--tx-ease), transform var(--tx-dur) var(--tx-ease);
  transition-delay: 0s;
}
.crb[data-motion] :is(.crb-s-flow, .crb-row > .crb-label, .crb-row > .crb-val) {
  transition-delay: calc(var(--d, 0s) + var(--credit-lag));
}
.crb[data-motion] :is(.crb-s-rule, .crb-rule) {
  opacity: 0;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform var(--rule-dur) var(--rule-ease), opacity calc(var(--rule-dur) * 0.4) linear;
  transition-delay: var(--rule-lag);
}
.crb[data-motion][data-in] :is(.crb-cat, .crb-s-flow, .crb-row > .crb-label, .crb-row > .crb-val, .crb-s-rule, .crb-rule) {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .crb[data-motion] :is(.crb-cat, .crb-s-flow, .crb-row > .crb-label, .crb-row > .crb-val, .crb-s-rule, .crb-rule) {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
`;

/* A condensed subtitle. Used on the lab's own subtitle (.crl-sub-cond) and,
   in the iframe, on the real page's subtitle — scoped under .intro-font so
   it beats that rule; sizes there follow the page's own breakpoints. */
const subDecl = (sub: Sub) => {
  if (sub.font === "general") return "";
  const f = SUB_FACES[sub.font];
  return `font-family: ${f.fam} !important; font-weight: ${sub.weight} !important; letter-spacing: ${f.track} !important; line-height: 1.15 !important;`;
};
const subFrameCss = (slug: string, sub: Sub) => {
  const sel = `.intro-font p[data-design-id="project.${slug}.subtitle"]`;
  // The live subtitle is Antonio now; "General Sans" restores the old one.
  if (sub.font === "general")
    return `${sel} { font-family: "General Sans", ui-sans-serif, system-ui, sans-serif !important; letter-spacing: 0.02em !important; line-height: 1.3 !important; font-size: 16px !important; }
@media (min-width: 768px) { ${sel} { font-size: 20px !important; } }
@media (min-width: 1024px) { ${sel} { font-size: 24px !important; } }`;
  return `${sel} { ${subDecl(sub)} font-size: ${SUB_SIZE.mobile}px !important; }
@media (min-width: 768px) { ${sel} { font-size: ${SUB_SIZE.tablet}px !important; } }
@media (min-width: 1024px) { ${sel} { font-size: ${SUB_SIZE.desktop}px !important; } }`;
};

/* ── Title / subtitle for scale ────────────────────────────────────────
   The project's real title + subtitle at the size the page gives them
   (same formulas as .intro-title-split / .intro-title-center at a 1440px
   window, and the 36px / 16px phone sizes), so the credit hierarchy can be
   judged against them. `subtitleOnly` (compare grid) keeps just the
   subtitle — the size cap the credits answer to. */
function ScaleTitle({
  project,
  align,
  device,
  slot,
  sub,
  subtitleOnly,
}: {
  project: Project;
  align: Align;
  device: Device;
  slot: number;
  sub: Sub;
  subtitleOnly?: boolean;
}) {
  const size =
    device === "mobile"
      ? 36
      : Math.min(96, slot / (align === "split" ? longestWordEms(project.title) : textEms(project.title)));
  const centered = align === "center" || device === "mobile";
  const cond = sub.font !== "general";
  return (
    <div className="crl-title" style={{ textAlign: centered ? "center" : "left" }}>
      {!subtitleOnly && (
        <p
          className="uppercase tracking-[-0.03em] text-balance [text-box:trim-both_cap_alphabetic]"
          style={{ fontSize: size, lineHeight: device === "mobile" ? 0.95 : 0.9, fontWeight: 600 }}
        >
          {project.title}
        </p>
      )}
      <p
        className={`uppercase tracking-[0.02em] leading-[1.3] text-foreground/55 text-balance [text-box:trim-both_cap_alphabetic]${
          cond ? " crl-sub-cond" : ""
        }`}
        style={
          {
            marginTop: subtitleOnly ? 0 : 14,
            fontSize: cond ? SUB_SIZE[device] : device === "mobile" ? 16 : 24,
            fontWeight: 400,
            ...(cond
              ? {
                  "--sub-fam": SUB_FACES[sub.font as Exclude<SubFont, "general">].fam,
                  "--sub-w": sub.weight,
                  "--sub-track": SUB_FACES[sub.font as Exclude<SubFont, "general">].track,
                }
              : {}),
          } as CSSProperties
        }
      >
        {project.subtitle}
      </p>
      <p className="crl-title-gap">description</p>
    </div>
  );
}

/* ── Block stage (full width) ─────────────────────────────────────────── */
function Stage({ project, sel, sub, device }: { project: Project; sel: Sel; sub: Sub; device: Device }) {
  const align = alignOf(project);
  const w = slotWidth(device, align);
  return (
    <div className="crl-stage">
      <div className="crl-slot intro-font" style={{ width: w }}>
        <ScaleTitle project={project} align={align} device={device} slot={w} sub={sub} />
        <Credits project={project} sel={sel} align={align} device={device} />
      </div>
      <p className="crl-cap">
        {w}px credits column · {device === "mobile" ? "390px phone" : "1440px window"} ·{" "}
        {align === "split" ? "beside the portrait hero" : "centred intro"} · actual size
      </p>
    </div>
  );
}

/* ── Compare cell ──────────────────────────────────────────────────────
   Lays the block out at the real column width (so it wraps exactly as on
   the page) and zooms the whole cell down if the lab column is narrower. */
function CompareCell({
  project,
  sel,
  sub,
  device,
  label,
  active,
  onPick,
}: {
  project: Project;
  sel: Sel;
  sub: Sub;
  device: Device;
  label: string;
  active: boolean;
  onPick: () => void;
}) {
  const align = alignOf(project);
  const w = slotWidth(device, align);
  const pad = 28;
  const ref = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(w + pad * 2);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const zoom = Math.min(1, avail / (w + pad * 2));
  return (
    <div className="crl-cell" data-active={active || undefined}>
      <button type="button" className="crl-cell-head" data-active={active} onClick={onPick}>
        {label}
        {zoom < 0.995 ? <span> · shown at {Math.round(zoom * 100)}%</span> : null}
      </button>
      <div ref={ref} className="crl-cell-stage">
        <div style={{ zoom, padding: pad }}>
          <div className="crl-slot crl-slot--cell intro-font" style={{ width: w }}>
            <ScaleTitle project={project} align={align} device={device} slot={w} sub={sub} subtitleOnly />
            <Credits project={project} sel={sel} align={align} device={device} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── In project context ──────────────────────────────────────────────── */

/* The live IntroCredits grid: the parent of the "My role" label. Only
   returned once React has hydrated it, so nothing we add trips hydration. */
function findLiveCredits(doc: Document): HTMLElement | null {
  // The graduated ProjectCredits block (live since 2026-10-07), or the old
  // IntroCredits grid (the parent of its "My role" label).
  const label = [...doc.querySelectorAll<HTMLElement>(".intro-trial p")].find(
    (p) => p.textContent?.trim().toLowerCase() === "my role",
  );
  const grid = doc.querySelector<HTMLElement>(".pc:not([data-lab-credits-host] .pc)") ?? label?.parentElement?.parentElement;
  if (!grid) return null;
  return Object.keys(grid).some((k) => k.startsWith("__reactFiber")) ? grid : null;
}

const FRAME_CSS = `
[data-lab-credits-original="hide"] { display: none !important; }
/* the localhost-only review strip at the foot of project pages */
.fixed.bottom-4.z-\\[200\\] { display: none !important; }
`;

function ContextFrame({ project, sel, sub, device }: { project: Project; sel: Sel; sub: Sub; device: Device }) {
  const { w: W, h: H } = WINDOW[device];
  const align = alignOf(project);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [avail, setAvail] = useState<number>(W);
  const [live, setLive] = useState<{ grid: HTMLElement; host: HTMLElement } | null>(null);
  const src = `/work/${project.hub}/${project.slug}`;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Once the page has loaded and hydrated: add a host right after the live
  // credits, then bring the credits into view inside the frame.
  useEffect(() => {
    setLive(null);
    const frame = frameRef.current;
    if (!frame) return;
    let alive = true;
    let timer = 0;
    const attempt = () => {
      if (!alive) return;
      const doc = frame.contentDocument;
      const grid = doc ? findLiveCredits(doc) : null;
      if (!doc || !grid) {
        timer = window.setTimeout(attempt, 150);
        return;
      }
      if (!doc.getElementById("lab-credits-frame-css")) {
        const style = doc.createElement("style");
        style.id = "lab-credits-frame-css";
        style.textContent = CREDITS_CSS + FRAME_CSS;
        doc.head.appendChild(style);
      }
      const host = doc.createElement("div");
      host.setAttribute("data-lab-credits-host", "");
      grid.after(host);
      setLive({ grid, host });
      timer = window.setTimeout(() => {
        const win = frame.contentWindow;
        const target = host.offsetHeight > 0 ? host : grid;
        if (!win) return;
        const r = target.getBoundingClientRect();
        if (r.bottom > H - 60) win.scrollTo({ top: win.scrollY + r.bottom - (H - 100) });
      }, 250);
    };
    frame.addEventListener("load", attempt);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      frame.removeEventListener("load", attempt);
    };
  }, [src, device, H]);

  // Swap: hide the live credits whenever a new treatment is shown.
  useEffect(() => {
    if (!live) return;
    if (sel.treatment === "current") live.grid.removeAttribute("data-lab-credits-original");
    else live.grid.setAttribute("data-lab-credits-original", "hide");
  }, [live, sel.treatment]);

  // Subtitle font: restyle the real page's own subtitle in place.
  useEffect(() => {
    const doc = live?.host.ownerDocument;
    if (!doc) return;
    let style = doc.getElementById("lab-sub-css");
    if (!style) {
      style = doc.createElement("style");
      style.id = "lab-sub-css";
      doc.head.appendChild(style);
    }
    style.textContent = subFrameCss(project.slug, sub);
  }, [live, sub, project.slug]);

  const scale = Math.min(1, avail / W);
  return (
    <div ref={wrapRef} className="crl-context">
      <div className="crl-frame" style={{ width: W * scale, height: H * scale }}>
        <iframe
          key={`${src}-${device}`}
          ref={frameRef}
          src={src}
          title={`${project.title} — project page`}
          style={{ width: W, height: H, transform: `scale(${scale})` }}
        />
      </div>
      <p className="crl-cap">
        The real page at a {W}px window{scale < 1 ? `, shown at ${Math.round(scale * 100)}%` : ""} — scroll inside
        it. {live ? "" : "Loading…"}{" "}
        <a href={src} target="_blank" rel="noreferrer">
          Open page ↗
        </a>
      </p>
      {live && sel.treatment !== "current"
        ? createPortal(
            <Billing
              key={sel.replay}
              project={project}
              variant={sel.treatment}
              content={sel.content}
              align={align}
              roleAlign={sel.roleAlign}
              motion={sel.motion}
            />,
            live.host,
          )
        : null}
    </div>
  );
}

/* ── Section ──────────────────────────────────────────────────────────── */
const NOTES: Record<Treatment, string> = {
  current:
    "Current — the live intro credits: small grey labels over the credit, all caps, 13px desktop / 10px phone, collaborators on one line.",
  B1: "A · Margin labels — MY ROLE and COLLABORATORS in a narrow left margin; each name stacked small and grey against its role; fine rules between.",
  B4: "B · Stacked groups — MY ROLE and COLLABORATORS each on their own line with a fine rule right under it, then the credits; all left-aligned, collaborators flow and wrap.",
  B5: "C · Indented groups — MY ROLE and COLLABORATORS hang alone at the left with a full-width rule right under them; the credits are indented beneath. Phones fall back to B.",
};
const SIZES =
  "Credits in Antonio. Roles are the bold white line: yours 24px desktop / 16px phone (never above the subtitle), collaborators' a step down at 21px / 14px. Names are locked to the role — a two-line name is exactly the height of the role's capitals. On phones each name sits on one line above its role.";

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="crl-group">
      <span className="crl-k">{label}</span>
      <div className="lab-devtoggle" role="group" aria-label={label}>
        {options.map(([v, l]) => (
          <button key={v} data-active={value === v} onClick={() => onChange(v)} type="button">
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectionCredits() {
  const [sel, setSel] = useState<Sel>({
    treatment: "B5",
    content: "role",
    roleAlign: "center",
    motion: true,
    replay: 0,
  });
  const [sub, setSub] = useState<Sub>({ font: "antonio", weight: "400" });
  const [view, setView] = useState<View>("compare");
  const [device, setDevice] = useState<Device>("desktop");
  const [slug, setSlug] = useState(PROJECT_CHOICES[0][0]);
  const project = PROJECTS.find((p) => p.slug === slug) ?? PROJECTS[0];
  const patch = (p: Partial<Sel>) => setSel((s) => ({ ...s, ...p }));
  const same = (s: Sel) =>
    s.treatment === sel.treatment && (s.treatment === "current" || s.content === sel.content);

  return (
    <>
      <style>{CREDITS_CSS + css}</style>
      <div className="crl-bar">
        <div className="crl-row">
          <ToggleGroup label="Layout" value={sel.treatment} options={TREATMENTS} onChange={(t) => patch({ treatment: t })} />
          {view !== "compare" && sel.treatment !== "current" && (
            <ToggleGroup label="Your name" value={sel.content} options={CONTENTS} onChange={(c) => patch({ content: c })} />
          )}
          {sel.treatment === "B5" && (
            <ToggleGroup label="Your role" value={sel.roleAlign} options={ROLEALIGNS} onChange={(a) => patch({ roleAlign: a })} />
          )}
          <ToggleGroup
            label="Motion"
            value={sel.motion ? "on" : "off"}
            options={[
              ["on", "On"],
              ["off", "Off"],
            ]}
            onChange={(m) => patch({ motion: m === "on", replay: sel.replay + 1 })}
          />
          {sel.motion && (
            <LabButton small onClick={() => patch({ replay: sel.replay + 1 })}>
              ⟲ Replay
            </LabButton>
          )}
          <ToggleGroup label="Subtitle" value={sub.font} options={SUBFONTS} onChange={(font) => setSub((s) => ({ ...s, font }))} />
          {sub.font !== "general" && (
            <ToggleGroup label="Weight" value={sub.weight} options={SUBWEIGHTS} onChange={(weight) => setSub((s) => ({ ...s, weight }))} />
          )}
        </div>
        <div className="crl-row">
          <ToggleGroup
            label="View"
            value={view}
            options={[
              ["compare", "Compare"],
              ["full", "Full width"],
              ["context", "In project context"],
            ]}
            onChange={setView}
          />
          <div className="crl-group">
            <span className="crl-k">Width</span>
            <DeviceToggle value={device} onChange={setDevice} />
          </div>
          <ToggleGroup label="Project" value={slug} options={PROJECT_CHOICES} onChange={setSlug} />
          <span className="crl-stars">
            {VARIANTS.map(([v]) => (
              <Fragment key={v}>
                <span className="lab-mono">CREDITS-{v}</span> <ShortlistStar id={`CREDITS-${v}`} />
              </Fragment>
            ))}
          </span>
        </div>
      </div>

      <p className="crl-hint">
        {view === "compare"
          ? "Current, then each layout with and without your name — all under the subtitle at its real size. Click a heading to pick one, then switch to Full width or In project context."
          : NOTES[sel.treatment]}{" "}
        {sel.treatment !== "current" || view === "compare" ? SIZES : null}
      </p>

      {view === "compare" && (
        <div className="crl-compare" data-device={device}>
          <section className="crl-var">
            <h3 className="crl-var-head">Previous credits</h3>
            <div className="crl-matrix" data-single>
              <CompareCell
                project={project}
                sel={{ ...sel, treatment: "current", content: "name" }}
                sub={sub}
                device={device}
                label="Before 2026-10-07"
                active={sel.treatment === "current"}
                onPick={() => patch({ treatment: "current" })}
              />
            </div>
          </section>
          {VARIANTS.map(([v, vLabel]) => (
            <section key={v} className="crl-var">
              <h3 className="crl-var-head">{vLabel}</h3>
              <div className="crl-matrix">
                {CONTENTS.map(([c, cLabel]) => {
                  const s: Sel = { ...sel, treatment: v, content: c };
                  return (
                    <CompareCell
                      key={c}
                      project={project}
                      sel={s}
                      sub={sub}
                      device={device}
                      label={cLabel}
                      active={same(s)}
                      onPick={() => setSel(s)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {view === "full" && <Stage project={project} sel={sel} sub={sub} device={device} />}

      {view === "context" && <ContextFrame project={project} sel={sel} sub={sub} device={device} />}
    </>
  );
}

const css = `
.crl-bar { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; flex-direction: column; gap: 10px; padding: 12px 0; background: rgba(0,0,0,0.86); backdrop-filter: blur(10px); border-bottom: 1px solid var(--lab-line); }
.crl-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 20px; }
.crl-group { display: inline-flex; align-items: center; gap: 8px; }
.crl-k { font-family: var(--font-mono, monospace); font-size: 0.55rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--lab-dimmer); }
.crl-stars { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lab-dim); }
.crl-hint { margin: 16px 0 32px; max-width: 78ch; font-size: 0.85rem; line-height: 1.6; color: var(--lab-dim); }

.crl-compare { display: flex; flex-direction: column; gap: 48px; }
.crl-var-head { margin: 0 0 14px; font-family: var(--font-mono, monospace); font-size: 0.66rem; font-weight: 400; letter-spacing: 0.18em; text-transform: uppercase; color: hsl(0 0% 98%); }
.crl-matrix { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.crl-matrix[data-single] { grid-template-columns: minmax(0, 1fr); max-width: calc(50% - 8px); }
.crl-cell { min-width: 0; }
.crl-cell-head { display: block; margin: 0 0 8px; padding: 0; background: none; border: none; cursor: pointer; font-family: var(--font-mono, monospace); font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--lab-dimmer); text-align: left; }
.crl-cell-head span { color: var(--lab-dimmer); opacity: 0.7; }
.crl-cell-head[data-active="true"] { color: hsl(0 0% 98%); }
.crl-cell-stage { background: #000; border: 1px solid var(--lab-line); overflow: hidden; }
.crl-cell[data-active] .crl-cell-stage { border-color: var(--lab-line-strong); }

.crl-stage { background: #000; border: 1px solid var(--lab-line); padding: 120px 0 18px; overflow: hidden; }
.crl-slot { max-width: calc(100% - 32px); margin: 0 auto 104px; outline: 1px dashed rgba(255,255,255,0.07); outline-offset: 12px; }
.crl-slot.crl-slot--cell { max-width: none; margin: 0; outline-offset: 10px; }
.crl-title { color: #f5f5f5; }
.crl-title :where(p) { margin: 0; }
.crl-title p.crl-sub-cond { font-family: var(--sub-fam) !important; font-weight: var(--sub-w) !important; letter-spacing: var(--sub-track) !important; line-height: 1.15 !important; }
.crl-title .crl-title-gap { margin: 28px 0; padding: 6px 0; font-family: var(--font-mono, monospace) !important; font-size: 0.55rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--lab-dimmer); text-align: inherit; border-block: 1px dashed rgba(255,255,255,0.08); }
.crl-cap { margin: 0; padding: 0 16px; font-family: var(--font-mono, monospace); font-size: 0.55rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lab-dimmer); text-align: center; }
.crl-cap a { color: var(--lab-dim); text-decoration: underline; text-underline-offset: 3px; }

.crl-context { width: 100%; }
.crl-frame { position: relative; margin: 0 auto 12px; overflow: hidden; outline: 1px solid var(--lab-line); background: #000; }
.crl-frame iframe { display: block; border: 0; transform-origin: 0 0; background: #000; }

@media (max-width: 900px) {
  .crl-matrix { grid-template-columns: minmax(0, 1fr); }
  .crl-matrix[data-single] { max-width: none; }
}
`;
