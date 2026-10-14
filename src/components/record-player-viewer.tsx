import { useEffect, useRef, useState, type RefObject } from "react";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import type { RecordPlayerScene } from "./record-player-scene";

export function RecordPlayerViewer({ wrapperRef, onProgress, onModeChange }: {
  wrapperRef: RefObject<HTMLDivElement | null>;
  onProgress: (progress: number) => void;
  /** "static" when the scroll animation can't run — reduced motion is on,
   *  or the scene failed — so the page can drop the tall scroll runway it
   *  only needs for the animation. "animated" otherwise. */
  onModeChange?: (mode: "animated" | "static") => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<RecordPlayerScene | null>(null);
  const progress = useRef(0);
  const [ready, setReady] = useState(false);
  // True when the model won't run at all (reduced motion or a failure) —
  // only then does the still image stand in for it.
  const [isStatic, setIsStatic] = useState(false);
  const modeCb = useRef(onModeChange);
  modeCb.current = onModeChange;
  useScrollProgress(wrapperRef, (p) => {
    progress.current = p;
    control.current?.seek(p);
    onProgress(p);
  });
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let starting = false;
    let near = false;
    let visible = false;
    let failed = false;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const report = () => {
      const still = media.matches || failed;
      setIsStatic(still);
      modeCb.current?.(still ? "static" : "animated");
    };
    report(); // decided on mount, before the visitor reaches the section
    const stop = () => {
      control.current?.dispose();
      control.current = null;
      setReady(false);
      report();
    };
    const start = async () => {
      if (cancelled || starting || control.current || !near || media.matches || failed) return;
      starting = true;
      try {
        const { createRecordPlayerScene } = await import("./record-player-scene");
        if (cancelled || media.matches) return;
        const scene = createRecordPlayerScene(el, () => { failed = true; stop(); });
        control.current = scene;
        scene.seek(progress.current);
        scene.setVisible(visible);
        await scene.load();
        if (!cancelled && control.current === scene) setReady(true);
      } catch (error) {
        console.warn("Record-player still fallback:", error);
        if (!cancelled) { failed = true; stop(); }
      } finally {
        starting = false;
        if (!cancelled && !media.matches && !control.current && !failed) void start();
      }
    };
    /* 600px of lead time wasn't reliably enough: the model itself is small,
       but it drags in a whole loading chain behind it — a JS chunk, the
       Draco decoder and its wasm, two textures, then the glb — and on a
       real connection that chain can still be running by the time the
       scrub section actually reaches the viewport, leaving the static
       poster (which used to be an actual video here) visible for a beat
       once scrolling starts. This section is guaranteed to be part of the
       current page — unlike genuinely below-the-fold content on a page a
       visitor might never scroll to, there's no bandwidth saved by staying
       lazy here — so the margin is wide enough that the observer fires
       essentially on mount instead of waiting for the visitor to scroll
       within reach of it. prefers-reduced-motion (below) still skips
       loading it at all for anyone who has that set. */
    const observer = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; void start(); }, { rootMargin: "4000px 0px" });
    observer.observe(el);
    const visibleObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      control.current?.setVisible(visible);
    });
    visibleObserver.observe(el);
    const preference = () => {
      if (media.matches) stop();
      else {
        report();
        void start();
      }
    };
    media.addEventListener("change", preference);
    return () => {
      cancelled = true;
      observer.disconnect();
      visibleObserver.disconnect();
      media.removeEventListener("change", preference);
      control.current?.dispose();
      control.current = null;
    };
  }, []);
  return (
    <div className="record-player-stage" role="img" aria-label="Magenta and silver Lollapalooza record player, animated by scrolling">
      {/* No stand-in picture while the model loads (the soft front-view
          still read as a blurry placeholder) — just the page background and
          a thin loading line, then the model fades in. The still is kept
          only for when the model won't run at all. */}
      {isStatic && !ready && (
        <img src="/models/record-player/poster.webp" alt="" width="830" height="960" loading="lazy" className="record-player-poster" />
      )}
      {!isStatic && <div aria-hidden className="record-player-loading" style={{ opacity: ready ? 0 : 1 }} />}
      <div ref={host} className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none" style={{ opacity: ready ? 1 : 0 }} data-record-player-canvas />
    </div>
  );
}
