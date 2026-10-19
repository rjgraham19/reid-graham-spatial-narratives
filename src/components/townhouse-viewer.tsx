import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AssetFrame, ASSET_STAGE_CLASS } from '@/components/asset-frame';
import { ModelToggle, ModelViewControls, type CompassView } from '@/components/model-view-controls';
import { ModelZoomControls } from '@/components/model-zoom-controls';
import type { TownhouseControls } from './townhouse-scene';

/* Compass labels map onto the scene's own corner names: front is south,
   right is east, so front-right reads as SE and so on. */
const TARGETS = {
  NE: 'Rear right',
  NW: 'Rear left',
  SE: 'Front right',
  SW: 'Front left',
} as const satisfies Record<CompassView, string>;

/** Give up after this long and show the preview image (with a retry). */
const LOAD_TIMEOUT_MS = 30_000;

/** Embedded in the page and live from the start, the same way as the
 *  Lollapalooza model: it loads a little ahead of scroll, fades in when
 *  ready, and can be dragged straight away. The view row (shared with
 *  LollaViewer) is on show from the start, inactive until the model is in.
 *  No popup and no click to open it. */
export function TownhouseViewer({ intro }: { intro?: ReactNode } = {}) {
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<TownhouseControls | null>(null);
  const [ready, setReady] = useState(false);
  const [siteShown, setSiteShown] = useState(true);
  const [failed, setFailed] = useState(false);
  // Bumped by "Try again" to re-run the load effect from scratch.
  const [attempt, setAttempt] = useState(0);

  // Any failure (no WebGL, failed download, or the time limit) tears down
  // whatever was half-built and shows the preview image instead.
  useEffect(() => {
    if (!stage.current || !host.current) return;
    let live = true;
    let timer: number | undefined;
    const hostEl = host.current;
    const fail = () => {
      if (!live) return;
      live = false;
      window.clearTimeout(timer);
      controls.current?.dispose();
      controls.current = null;
      hostEl.replaceChildren();
      setFailed(true);
    };
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        timer = window.setTimeout(fail, LOAD_TIMEOUT_MS);
        import('./townhouse-scene')
          .then(async ({ createTownhouseScene }) => {
            if (!live) return;
            const view = createTownhouseScene(hostEl);
            controls.current = view;
            await view.load();
            if (!live) return;
            window.clearTimeout(timer);
            setReady(true);
          })
          .catch(fail);
      },
      { rootMargin: '600px 0px' },
    );
    near.observe(stage.current);
    // The scene only paints on change; repaint whenever it scrolls back in,
    // in case the browser dropped the picture while it was off screen.
    const back = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) controls.current?.redraw();
    });
    back.observe(stage.current);
    return () => {
      live = false;
      window.clearTimeout(timer);
      near.disconnect();
      back.disconnect();
      controls.current?.dispose();
      controls.current = null;
    };
  }, [attempt]);

  const retry = () => {
    setFailed(false);
    setReady(false);
    setSiteShown(true);
    setAttempt((n) => n + 1);
  };

  return (
    <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10" aria-label="Interactive Townhouse model">
      <AssetFrame
        label="Explore in 3D"
        aspect={4 / 3}
        ariaLabel="Townhouse 3D model"
        reserveControls
        intro={intro}
        controls={
          !failed && (
            <ModelViewControls disabled={!ready} onView={(v) => controls.current?.view(TARGETS[v])}>
              <ModelZoomControls
                disabled={!ready}
                onZoomIn={() => controls.current?.zoom('in')}
                onZoomOut={() => controls.current?.zoom('out')}
              />
            </ModelViewControls>
          )
        }
      >
        <div ref={stage} className={`${ASSET_STAGE_CLASS} bg-[#050507]`} style={{ cursor: ready ? 'grab' : undefined }}>
          {/* Hidden until fully loaded, then faded in. */}
          <div
            ref={host}
            className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
            style={{ opacity: ready && !failed ? 1 : 0 }}
          />

          {!failed && (
            <div className="absolute right-3 top-3 z-10 cursor-default rounded-md text-white backdrop-blur-md">
              <ModelToggle label="Site" on={siteShown} disabled={!ready}
                onToggle={() => setSiteShown(controls.current?.toggleSite() ?? true)} />
            </div>
          )}

          {failed && (
            <img
              src="/models/townhouse-preview.webp"
              alt="Townhouse exterior with concrete walls, glass blocks, and open terraces"
              decoding="async"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
          )}

          {!ready && !failed && (
            <p role="status" className="pointer-events-none absolute bottom-4 left-4 font-display text-[11px] font-extralight uppercase tracking-[0.14em] text-white/60">
              Loading model…
            </p>
          )}
          {failed && (
            <div className="absolute bottom-4 left-4 flex items-center gap-3 font-display text-[11px] font-extralight uppercase tracking-[0.14em] text-white/75">
              <span role="status">3D view unavailable</span>
              <button
                type="button"
                onClick={retry}
                className="underline underline-offset-4 text-white hover:text-white/80"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </AssetFrame>
    </section>
  );
}
