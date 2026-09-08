import { useEffect, useRef, useState } from 'react';
import type { TownhouseControls } from './townhouse-scene';

export function TownhouseViewer() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<TownhouseControls | null>(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!active || !host.current) return;
    let cancelled = false;
    setStatus('Loading model…');
    import('./townhouse-scene').then(async ({ createTownhouseScene }) => {
      if (cancelled || !host.current) return;
      const view = createTownhouseScene(host.current);
      controls.current = view;
      await view.load();
      if (!cancelled) { setReady(true); setStatus(''); }
    }).catch(() => {
      if (!cancelled) { controls.current?.dispose(); controls.current = null; setStatus('The 3D view could not load. You can still explore the project images below.'); }
    });
    return () => { cancelled = true; controls.current?.dispose(); controls.current = null; };
  }, [active]);
  return <section className="px-6 md:px-12 lg:px-16 py-8 md:py-10" aria-label="Interactive Townhouse model">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Spatial study</p><h2 className="text-2xl font-medium">Explore Townhouse</h2></div>
      <p className="text-sm text-muted-foreground">Concrete, glass block, and the spaces between.</p>
    </div>
    <div className="relative overflow-hidden rounded-md bg-[#050507]" style={{height:'clamp(340px, 65vh, 760px)'}}>
      {!ready && <img src="/models/townhouse-preview.png" alt="Townhouse exterior with concrete walls, glass blocks, and open terraces" className="absolute inset-0 w-full h-full object-cover" />}
      <div ref={host} className="absolute inset-0" />
      {!active && <button type="button" onClick={() => setActive(true)} className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm text-black shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4">Explore in 3D</button>}
      {status && <p role="status" className="absolute bottom-5 left-5 right-5 rounded bg-white/95 p-3 text-sm text-black">{status}</p>}
    </div>
    {ready && <div className="mt-4 flex flex-wrap items-center gap-2">
      {(['Front right','Front left','Rear right','Rear left'] as const).map(view => <button key={view} type="button" onClick={() => controls.current?.view(view)} className="rounded-full border border-current/20 px-4 py-2 text-sm hover:bg-foreground/5">{view} iso</button>)}
      <p className="text-xs text-muted-foreground sm:ml-auto">Drag to orbit · Pinch to zoom · Arrow keys to pan</p>
    </div>}
  </section>;
}
