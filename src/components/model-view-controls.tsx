import type { ReactNode } from "react";
import { ASSET_CONTROL_CLASS } from "@/components/asset-frame";

export type CompassView = "NE" | "NW" | "SE" | "SW";
const VIEWS: CompassView[] = ["NE", "NW", "SE", "SW"];

/** The row under an "Explore in 3D" stage: the four corner views, then any
 *  model-specific switches (Lolla's Gable) after a thin divider. Shared by
 *  LollaViewer and TownhouseViewer so the two read as the same control.
 *  Shown from the start; `disabled` only until the model is ready. */
export function ModelViewControls({
  onView,
  disabled = false,
  children,
}: {
  onView: (view: CompassView) => void;
  disabled?: boolean;
  /** Extra switches — use `ModelToggle`. */
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center" role="group" aria-label="Model views">
      {VIEWS.map((v) => (
        <button
          key={v}
          type="button"
          disabled={disabled}
          onClick={() => onView(v)}
          aria-label={`${v} isometric view`}
          className={ASSET_CONTROL_CLASS}
        >
          {v}
        </button>
      ))}
      {children && (
        <>
          <span aria-hidden className="mx-2 h-4 w-px bg-foreground/20" />
          {children}
        </>
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
      className={`${ASSET_CONTROL_CLASS} gap-2`}
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
