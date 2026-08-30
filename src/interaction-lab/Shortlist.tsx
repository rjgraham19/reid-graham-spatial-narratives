import { useState } from "react";
import { useShortlist } from "./store";
import { LabButton } from "./ui";
import { EXPERIMENTS, CATEGORIES } from "./data";

/** Gathers every starred experiment with its identifier and a copy-list
 *  button, so the exact set to transfer can be handed back verbatim. */
export function Shortlist({ onJump }: { onJump: (cat: string) => void }) {
  const { ids, toggle, clear } = useShortlist();
  const [copied, setCopied] = useState(false);

  // Keep registry order so the list is stable regardless of star order.
  const chosen = EXPERIMENTS.filter((e) => ids.includes(e.id));

  const copyText = chosen.map((e) => `${e.id} — ${e.name} (${e.category})`).join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText || "(nothing shortlisted)");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

  return (
    <div>
      {chosen.length === 0 ? (
        <p className="lab-sl-empty">
          Nothing shortlisted yet. Star any experiment with its “Shortlist” control and it will
          gather here — your picks persist across sections and reloads.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            <LabButton variant="primary" onClick={copy}>
              {copied ? "Copied ✓" : `Copy list (${chosen.length})`}
            </LabButton>
            <LabButton onClick={clear}>Clear all</LabButton>
          </div>

          <div>
            {chosen.map((e) => (
              <div className="lab-sl-row" key={e.id}>
                <span className="lab-exp-id">{e.id}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="lab-exp-name" style={{ fontSize: "0.9rem" }}>
                    {e.name}
                  </div>
                  <div className="lab-exp-meta" style={{ marginTop: 2 }}>
                    {catLabel(e.category)} · {e.blurb}
                  </div>
                </div>
                <LabButton small onClick={() => onJump(e.category)}>
                  Open section
                </LabButton>
                <LabButton small onClick={() => toggle(e.id)} aria-label={`Remove ${e.id}`}>
                  Remove
                </LabButton>
              </div>
            ))}
          </div>

          <pre className="lab-mono" style={preStyle}>
            {copyText}
          </pre>
        </>
      )}
    </div>
  );
}

const preStyle: React.CSSProperties = {
  marginTop: 24,
  padding: "14px 16px",
  border: "1px solid var(--lab-line)",
  borderRadius: 8,
  fontSize: "0.75rem",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.6)",
  whiteSpace: "pre-wrap",
  background: "rgba(255,255,255,0.02)",
};
