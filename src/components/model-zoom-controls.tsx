/** Shared magnifier controls, matching the Exchange viewer's zoom puck. */
export function ModelZoomControls({ onZoomIn, onZoomOut, onReset, disabled = false }: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset?: () => void;
  disabled?: boolean;
}) {
  const buttonClass = "flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-30 disabled:cursor-default";
  return (
    <div role="group" aria-label="Model zoom" className="flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-1.5 py-1.5 opacity-50 backdrop-blur-md transition-opacity duration-200 hover:opacity-100 focus-within:opacity-100">
      <button type="button" aria-label="Zoom in" title="Zoom in" disabled={disabled} onClick={onZoomIn} className={buttonClass}>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7" cy="7" r="5" />
          <path d="M7 4.6v4.8M4.6 7h4.8M11 11l3.5 3.5" strokeLinecap="round" />
        </svg>
      </button>
      <button type="button" aria-label="Zoom out" title="Zoom out" disabled={disabled} onClick={onZoomOut} className={buttonClass}>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7" cy="7" r="5" />
          <path d="M4.6 7h4.8M11 11l3.5 3.5" strokeLinecap="round" />
        </svg>
      </button>
      {onReset && <button type="button" aria-label="Reset view" title="Reset view" disabled={disabled} onClick={onReset} className={buttonClass}>
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M13 8A5 5 0 1 1 11.4 4.4" strokeLinecap="round" />
          <path d="M13 3v3.5H9.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>}
    </div>
  );
}
