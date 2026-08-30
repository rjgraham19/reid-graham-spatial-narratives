import { useEffect, useState } from "react";
import "./lab.css";

import { CATEGORIES } from "./data";
import { useShortlist } from "./store";
import { SectionEntrance } from "./SectionEntrance";
import { SectionNavigation } from "./SectionNavigation";
import { SectionGlass } from "./SectionGlass";
import { SectionTransitions } from "./SectionTransitions";
import { SectionType } from "./SectionType";
import { SectionImage } from "./SectionImage";
import { SectionCarousels } from "./SectionCarousels";
import { SectionWildcards } from "./SectionWildcards";
import { Shortlist } from "./Shortlist";
import { Findings } from "./Findings";

type SectionId = (typeof CATEGORIES)[number]["id"];

const VALID: SectionId[] = CATEGORIES.map((c) => c.id);

function readHash(): SectionId {
  if (typeof window === "undefined") return "entrance";
  const h = window.location.hash.replace(/^#/, "") as SectionId;
  return VALID.includes(h) ? h : "entrance";
}

export default function LabShell() {
  const [active, setActive] = useState<SectionId>("entrance");
  const { ids } = useShortlist();

  // Sync with the URL hash so a section is linkable and survives reload.
  useEffect(() => {
    setActive(readHash());
    const on = () => setActive(readHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const go = (id: SectionId) => {
    if (typeof window !== "undefined") window.location.hash = id;
    setActive(id);
    document.querySelector("[data-lab-main]")?.scrollTo?.({ top: 0 });
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const meta = CATEGORIES.find((c) => c.id === active) ?? CATEGORIES[0];

  return (
    <div data-lab>
      <div className="lab-shell">
        <aside className="lab-rail">
          <div className="lab-rail-wordmark">
            Reid Graham <span>Design</span>
            <br />
            Interaction Lab
          </div>
          <nav className="lab-rail-nav" aria-label="Lab sections">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className="lab-rail-link"
                data-active={active === c.id}
                onClick={() => go(c.id)}
                type="button"
              >
                <span className="lab-rail-num">{c.index}</span>
                <span>
                  {c.label}
                  {c.id === "shortlist" && ids.length > 0 ? ` (${ids.length})` : ""}
                </span>
              </button>
            ))}
          </nav>
          <div className="lab-rail-foot">
            Hidden route · not in site nav · nothing here is deployed. Reuses the site's real fonts,
            tokens, project data and images. Star experiments to build a shortlist.
          </div>
        </aside>

        <main className="lab-main" data-lab-main>
          <header className="lab-main-head">
            <p className="lab-kicker">
              {meta.index} / {CATEGORIES.length.toString().padStart(2, "0")} — Interaction Lab
            </p>
            <h1 className="lab-h1" style={{ marginTop: 14 }}>
              {meta.label}
            </h1>
            <p className="lab-lede">{meta.lede}</p>
          </header>

          {active === "entrance" && <SectionEntrance />}
          {active === "navigation" && <SectionNavigation />}
          {active === "glass" && <SectionGlass />}
          {active === "transitions" && <SectionTransitions />}
          {active === "type" && <SectionType />}
          {active === "image" && <SectionImage />}
          {active === "carousels" && <SectionCarousels />}
          {active === "wildcards" && <SectionWildcards />}
          {active === "shortlist" && <Shortlist onJump={(cat) => go(cat as SectionId)} />}
          {active === "findings" && <Findings />}
        </main>
      </div>
    </div>
  );
}
