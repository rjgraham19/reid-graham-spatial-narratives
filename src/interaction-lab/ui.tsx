import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useShortlist } from "./store";
import { experimentById, LAB_ALL_SRCS, type ExperimentMeta } from "./data";

/* ── Preloader ─────────────────────────────────────────────────────────
   Decodes every image the lab uses once, so no experiment — and no intro —
   ever paints a blank frame. Returns readiness so callers can gate a
   sequence on it and show a graceful loader meanwhile. */
export function useLabPreload(srcs: string[] = LAB_ALL_SRCS) {
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let alive = true;
    let done = 0;
    const total = srcs.length || 1;
    if (srcs.length === 0) {
      setReady(true);
      setProgress(1);
      return;
    }
    srcs.forEach((src) => {
      const img = new Image();
      const tick = () => {
        if (!alive) return;
        done += 1;
        setProgress(done / total);
        if (done >= total) setReady(true);
      };
      img.onload = tick;
      img.onerror = tick;
      img.src = src;
      if (img.complete) tick();
    });
    return () => {
      alive = false;
    };
  }, [srcs]);
  return { ready, progress };
}

/* ── Small lab button ─────────────────────────────────────────────── */
export function LabButton({
  children,
  variant,
  on,
  small,
  ...props
}: {
  children: ReactNode;
  variant?: "primary";
  on?: boolean;
  small?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={"lab-btn" + (small ? " lab-btn--sm" : "")}
      data-variant={variant}
      data-on={on ? "true" : undefined}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Shortlist star ───────────────────────────────────────────────── */
export function ShortlistStar({ id }: { id: string }) {
  const { has, toggle } = useShortlist();
  const active = has(id);
  return (
    <LabButton
      small
      on={active}
      aria-pressed={active}
      aria-label={active ? `Remove ${id} from shortlist` : `Add ${id} to shortlist`}
      onClick={() => toggle(id)}
    >
      <span className="lab-star">
        <svg
          viewBox="0 0 24 24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M12 2.5l2.9 6.06 6.6.86-4.85 4.55 1.22 6.53L12 17.9l-5.87 3.06 1.22-6.53L2.5 9.42l6.6-.86z" />
        </svg>
        {active ? "Shortlisted" : "Shortlist"}
      </span>
    </LabButton>
  );
}

/* ── Device toggle ───────────────────────────────────────────────── */
export type Device = "desktop" | "mobile";
export function DeviceToggle({
  value,
  onChange,
}: {
  value: Device;
  onChange: (d: Device) => void;
}) {
  return (
    <div className="lab-devtoggle" role="group" aria-label="Preview width">
      {(["desktop", "mobile"] as Device[]).map((d) => (
        <button key={d} data-active={value === d} onClick={() => onChange(d)} type="button">
          {d}
        </button>
      ))}
    </div>
  );
}

/* ── Replay key ──────────────────────────────────────────────────────
   A monotonic counter used as a React `key` to hard-remount a demo subtree,
   which restarts every CSS animation and effect inside it from a clean state
   without a page refresh. */
export function useReplay() {
  const [k, setK] = useState(0);
  const replay = useCallback(() => setK((n) => n + 1), []);
  return { replayKey: k, replay };
}

/* ── Fullscreen stage ───────────────────────────────────────────────
   Portals its children to <body>, traps nothing (Esc + on-screen controls
   always exit), and locks body scroll while open. Used by intro launches and
   any "open full screen" experiment. */
export function FullscreenStage({
  open,
  onClose,
  children,
  controls,
  hint = "Esc to exit",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  controls?: ReactNode;
  hint?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="lab-fs" role="dialog" aria-modal="true" aria-label="Full-screen experiment">
      {children}
      <div className="lab-fs-hint">{hint}</div>
      <div className="lab-fs-controls">{controls}</div>
    </div>,
    document.body,
  );
}

/* ── Experiment frame ───────────────────────────────────────────────
   The card every experiment sits in: preview stage on top, then id + platform,
   name, one-line note, meta (reference / perf), and the action row (replay,
   launch, shortlist, plus anything the experiment passes as `actions`). */
export function ExperimentFrame({
  meta,
  children,
  stageFill,
  actions,
  onReplay,
  details,
}: {
  meta: ExperimentMeta;
  children: ReactNode;
  /** "mobile" centres a phone frame; default fills the stage. */
  stageFill?: "mobile";
  actions?: ReactNode;
  onReplay?: () => void;
  /** Optional expandable documentation block (used by ENTRANCE). */
  details?: ReactNode;
}) {
  const platformLabel =
    meta.platform === "both"
      ? "Desktop + Mobile"
      : meta.platform === "desktop"
        ? "Desktop"
        : "Mobile";
  return (
    <div className="lab-exp">
      <div className="lab-exp-stage" data-fill={stageFill}>
        {children}
      </div>
      <div className="lab-exp-body">
        <div className="lab-exp-idrow">
          <span className="lab-exp-id">{meta.id}</span>
          <span className="lab-exp-plat">{platformLabel}</span>
        </div>
        <div className="lab-exp-name">{meta.name}</div>
        <p className="lab-exp-note">{meta.blurb}</p>
        <p className="lab-exp-meta">
          {meta.reference ? (
            <>
              <b>Ref</b> {meta.reference}
              <br />
            </>
          ) : null}
          {meta.perf ? (
            <>
              <b>Cost</b> {meta.perf}
            </>
          ) : null}
        </p>
        <div className="lab-exp-actions">
          {onReplay ? (
            <LabButton small onClick={onReplay} aria-label={`Replay ${meta.id}`}>
              ⟲ Replay
            </LabButton>
          ) : null}
          {actions}
          <ShortlistStar id={meta.id} />
        </div>
        {details ? (
          <details className="lab-exp-details">
            <summary>Notes</summary>
            {details}
          </details>
        ) : null}
      </div>
    </div>
  );
}

/* Convenience: resolve id → meta with a dev-time guard. Plain function, not a
   hook — safe to call inline anywhere. */
export function getMeta(id: string): ExperimentMeta {
  const m = experimentById(id);
  if (!m) throw new Error(`Interaction Lab: no experiment registered for "${id}"`);
  return m;
}

/* A phone frame wrapper for mobile-first demos shown on a desktop stage. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const id = useId();
  return (
    <div className="lab-phoneframe" aria-labelledby={id}>
      {children}
    </div>
  );
}
