import { useState, type ReactNode } from "react";

// Same lightweight surface and typography as Exchange's zone navigation.
const MODEL_CONTROL_CLASS = "rounded-md border border-foreground/20 bg-background/30 px-4 py-2.5 text-sm font-light transition-colors hover:bg-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--asset-accent)] disabled:opacity-30 disabled:cursor-default";

export type CompassView = "NE" | "NW" | "SE" | "SW";
const VIEWS: CompassView[] = ["NE", "NW", "SE", "SW"];

/** The row under an "Explore in 3D" stage: the four corner views, then any
 *  model-specific controls after a thin divider. Shared by
 *  LollaViewer and TownhouseViewer so the two read as the same control.
 *  Shown from the start; `disabled` only until the model is ready. */
export function ModelViewControls({
  onView,
  disabled = false,
  views = VIEWS,
  children,
}: {
  onView: (view: CompassView) => void;
  disabled?: boolean;
  views?: readonly CompassView[];
  /** Extra switches — use `ModelToggle`. */
  children?: ReactNode;
}) {
  const [selected,setSelected] = useState<CompassView | null>(null);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Model views">
      {views.map((v) => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          onClick={() => { setSelected(v); onView(v); }}
          aria-pressed={selected === v}
          aria-label={`${v} isometric view`}
          className={MODEL_CONTROL_CLASS}
          style={selected === v ? { background: "var(--asset-accent)", borderColor: "var(--asset-accent)", color: "black" } : undefined}
        >
          {v}
        </button>
      ))}
      {children && (
        <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
          <span aria-hidden className="mx-2 hidden h-4 w-px bg-foreground/20 sm:block" />
          {children}
        </div>
      )}
    </div>
  );
}

/** An on/off switch in the same row — a state to leave on or off rather
 *  than another view, so it's a switch, not a preset button. */
export function ModelToggle({
  label,
  on,
  onToggle,
  disabled = false,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={`${MODEL_CONTROL_CLASS} flex items-center gap-2`}
    >
      {label}
      <span
        aria-hidden
        className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 motion-reduce:transition-none"
        style={{ background: on ? "var(--asset-accent)" : "rgba(255,255,255,0.25)" }}
      >
        <span
          className="inline-block h-3 w-3 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none"
          style={{ transform: on ? "translateX(14px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}
