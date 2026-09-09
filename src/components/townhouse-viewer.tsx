import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseMark, glassButton, trackSheen } from '@/components/glass-button';
import type { TownhouseControls } from './townhouse-scene';

/* Compass labels map onto the scene's own corner names: front is south,
   right is east, so front-right reads as SE and so on. */
const VIEWS = [
  { label: 'NE', target: 'Rear right' },
  { label: 'NW', target: 'Rear left' },
  { label: 'SE', target: 'Front right' },
  { label: 'SW', target: 'Front left' },
] as const;

export function TownhouseViewer() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<TownhouseControls | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);

  // The scene only exists while the popup is open — mounted on open,
  // torn down on close so nothing keeps a WebGL context in the background.
  useEffect(() => {
    if (!open || !host.current) return;
    let cancelled = false;
    setReady(false);
    setStatus('Loading model…');
    import('./townhouse-scene')
      .then(async ({ createTownhouseScene }) => {
        if (cancelled || !host.current) return;
        const view = createTownhouseScene(host.current);
        controls.current = view;
        await view.load();
        if (!cancelled) {
          setReady(true);
          setStatus('');
        }
      })
      .catch(() => {
        if (!cancelled) {
          controls.current?.dispose();
          controls.current = null;
          setStatus('The 3D view could not load.');
        }
      });
    return () => {
      cancelled = true;
      controls.current?.dispose();
      controls.current = null;
    };
  }, [open]);

  // While the popup is up: freeze the page behind it and let Esc close it,
  // so a scroll or pinch meant for the model never reaches the page.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10" aria-label="Interactive Townhouse model">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Spatial study</p>
          <h2 className="text-2xl font-medium">Explore Townhouse</h2>
        </div>
        <p className="text-sm text-muted-foreground">Concrete, glass block, and the spaces between.</p>
      </div>

      <div className="relative overflow-hidden rounded-md bg-[#050507]" style={{ height: 'clamp(340px, 65vh, 760px)' }}>
        <img
          src="/models/townhouse-preview.png"
          alt="Townhouse exterior with concrete walls, glass blocks, and open terraces"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-md bg-white px-6 py-3 text-sm font-medium text-black shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Explore in 3D
        </button>
      </div>

      {open &&
        createPortal(
          <div
            /* Above the fixed site nav (z-110) so the model view is
               unobstructed, unlike the image lightbox which sits under it.
               The perimeter carries a soft vignette so the dark margin
               reads as a frame around the model, and clicking it closes. */
            className="fixed inset-0 z-[130] flex flex-col animate-fade-in-fast"
            style={{ background: 'radial-gradient(ellipse at center, #0c0c0f 0%, #000 78%)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Townhouse 3D model"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center justify-between px-6 py-5">
              <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/70">Townhouse — 3D</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                onMouseMove={trackSheen}
                className={`lightbox-close ${glassButton({ touch: true, sheen: true })}`}
                aria-label="Close"
              >
                <CloseMark />
              </button>
            </div>

            {/* The dark margin around the model is the click-out zone; the
                model itself stops the click so a drag never closes it. */}
            <div className="relative flex-1">
              <div
                ref={host}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-4 overflow-hidden rounded-md bg-[#050507] shadow-[0_0_120px_rgba(0,0,0,0.85)] sm:inset-8 md:inset-14"
              />

              {!ready && (
                <p
                  role="status"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-foreground/70"
                >
                  {status || 'Loading model…'}
                </p>
              )}

              {ready && (
                <div
                  className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-12 md:bottom-[4.5rem]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {VIEWS.map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => controls.current?.view(v.target)}
                      className="rounded-md border border-white/25 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/10"
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}
