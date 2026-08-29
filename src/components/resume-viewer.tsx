import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { glassButton, CloseMark, trackSheen } from "@/components/glass-button";
import resumeMetaJson from "@/lib/resume-meta.json";

export type ResumeMeta = { updatedAt: string | null; originalFilename: string | null };

/** Measures a container's width so pages render at the exact size they're
 *  displayed at — sharp canvases, no upscaled blur. No react-pdf dependency,
 *  so it lives here rather than in the lazy-loaded chunk. */
function useElementWidth<T extends HTMLElement>(): [React.RefCallback<T>, number] {
  const [el, setEl] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    observer.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, [el]);

  return [setEl, width];
}

const ResumeThumbnail = lazy(() =>
  import("@/components/resume-pdf-internal").then((m) => ({ default: m.ResumeThumbnail })),
);
const ResumeDocumentPages = lazy(() =>
  import("@/components/resume-pdf-internal").then((m) => ({ default: m.ResumeDocumentPages })),
);

const isDesignMode = import.meta.env.MODE === "design";
const ResumeUploader = isDesignMode ? lazy(() => import("@/design-mode/resume-uploader")) : null;

declare global {
  interface Window {
    umami?: { track: (event: string) => void };
  }
}

/** Fires a best-effort, non-blocking analytics event. The download itself
 *  never depends on this succeeding — Umami isn't configured yet (no script
 *  is loaded), so today this is a no-op hook that's ready for when it is. */
function trackResumeDownload() {
  try {
    window.umami?.track("resume_download");
  } catch {
    // Analytics must never block or break the download.
  }
}

function resumeUrl(meta: ResumeMeta): string {
  return meta.updatedAt ? `/resume.pdf?v=${encodeURIComponent(meta.updatedAt)}` : "/resume.pdf";
}

/** Catches chunk-load failures (e.g. offline, network hiccup fetching the
 *  lazy react-pdf chunk) that Suspense alone doesn't handle. */
class PdfErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ComingSoonCard() {
  return (
    <div
      className="block w-full max-w-xl aspect-[8.5/11] bg-white text-black rounded-md shadow-2xl overflow-hidden animate-swoop-in p-8 md:p-10 flex flex-col"
      aria-label="Resume coming soon"
    >
      <p className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl">Reid Graham</p>
      <p className="mt-1 text-xs tracking-[0.2em] uppercase text-black/60">Designer · New York City / Chicago</p>
      <div className="mt-auto">
        <p className="text-[10px] tracking-[0.3em] uppercase text-black/40">Resume coming soon</p>
      </div>
    </div>
  );
}

function ThumbnailFallback() {
  return (
    <div className="w-full h-full bg-white p-8 md:p-10 flex flex-col">
      <p className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl">Reid Graham</p>
      <p className="mt-1 text-xs tracking-[0.2em] uppercase text-black/60">Designer · New York City / Chicago</p>
      <p className="mt-auto text-[10px] tracking-[0.3em] uppercase text-black/40">Resume</p>
    </div>
  );
}

/** Every visitor gets the same suggested filename regardless of the served
 *  path/query string, so the file lands in their Downloads folder clearly
 *  identified as Reid's résumé. */
const DOWNLOAD_FILENAME = "REIDGRAHAM_RESUME.pdf";

function DownloadLink({ href, className, onClick }: { href: string; className: string; onClick?: () => void }) {
  return (
    <a href={href} download={DOWNLOAD_FILENAME} aria-label="Download resume PDF" className={className} onClick={onClick}>
      Download PDF
    </a>
  );
}

function OpenNewTabLink({ href, className }: { href: string; className: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Open resume PDF in a new tab" className={className}>
      Open in new tab
    </a>
  );
}

export function ResumeSection() {
  const [meta, setMeta] = useState<ResumeMeta>(resumeMetaJson as ResumeMeta);
  const [zoom, setZoom] = useState(false);
  const [, setNumPages] = useState<number | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [thumbRef, thumbWidth] = useElementWidth<HTMLDivElement>();
  const [docRef, docWidth] = useElementWidth<HTMLDivElement>();

  const hasResume = meta.updatedAt != null;
  const url = resumeUrl(meta);

  const close = useCallback(() => {
    setZoom(false);
    setPreviewFailed(false);
    cardRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, close]);

  // Blocks the Contact page from scrolling behind the viewer without moving
  // it, so its scroll position is exactly where it was once this restores
  // the original value on close.
  useEffect(() => {
    if (!zoom) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [zoom]);

  return (
    <div>
      {!hasResume ? (
        <ComingSoonCard />
      ) : (
        <button
          ref={cardRef}
          type="button"
          onClick={() => setZoom(true)}
          className="group relative block w-full max-w-xl aspect-[8.5/11] bg-white text-black rounded-md shadow-2xl overflow-hidden animate-swoop-in text-left transition-transform duration-300 hover:scale-[1.015] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          aria-label="Enlarge resume"
        >
          <div ref={thumbRef} className="absolute inset-0">
            <PdfErrorBoundary fallback={<ThumbnailFallback />}>
              <Suspense fallback={<div className="w-full h-full bg-white animate-pulse" />}>
                {thumbWidth > 0 && <ResumeThumbnail file={url} width={thumbWidth} />}
              </Suspense>
            </PdfErrorBoundary>
          </div>
        </button>
      )}

      {hasResume && (
        <div className="mt-4 flex flex-wrap gap-3">
          <DownloadLink href={url} className={glassButton({ touch: true })} onClick={trackResumeDownload} />
          <OpenNewTabLink href={url} className={glassButton({ quiet: true, touch: true })} />
        </div>
      )}

      {isDesignMode && ResumeUploader && (
        <Suspense fallback={null}>
          <ResumeUploader meta={meta} onUpdated={setMeta} />
        </Suspense>
      )}

      {zoom && hasResume && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Resume"
          onClick={close}
        >
          {/* Fixed to the viewport, not the scrolling content, so it stays
              reachable no matter how far down a long resume is scrolled. */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            onMouseMove={trackSheen}
            className={glassButton({
              touch: true,
              sheen: true,
              className: "fixed top-4 right-4 md:top-6 md:right-6 z-[110]",
            })}
            aria-label="Close resume"
          >
            <CloseMark />
          </button>

          <div className="h-full overflow-y-auto overscroll-contain px-6 md:px-16 py-20 flex flex-col items-center">
            <div ref={docRef} className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
              {previewFailed ? (
                <div className="bg-white rounded-md shadow-2xl p-10 text-center text-black/70">
                  Preview unavailable — use Download below.
                </div>
              ) : (
                <PdfErrorBoundary
                  fallback={
                    <div className="bg-white rounded-md shadow-2xl p-10 text-center text-black/70">
                      Preview unavailable — use Download below.
                    </div>
                  }
                >
                  <Suspense fallback={<div className="w-full aspect-[8.5/11] bg-white/90 rounded-sm animate-pulse" />}>
                    {docWidth > 0 && (
                      <ResumeDocumentPages
                        file={url}
                        width={docWidth}
                        onNumPages={setNumPages}
                        onError={() => setPreviewFailed(true)}
                      />
                    )}
                  </Suspense>
                </PdfErrorBoundary>
              )}
            </div>

            <div className="mt-8 shrink-0 flex flex-wrap justify-center gap-3" onClick={(e) => e.stopPropagation()}>
              <DownloadLink href={url} className={glassButton({ touch: true })} onClick={trackResumeDownload} />
              <OpenNewTabLink href={url} className={glassButton({ quiet: true, touch: true })} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
