import { useEffect, useRef, useState, type RefObject } from "react";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import type { RecordPlayerScene } from "./record-player-scene";

export function RecordPlayerViewer({ wrapperRef, onProgress }: {
  wrapperRef: RefObject<HTMLDivElement | null>;
  onProgress: (progress: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<RecordPlayerScene | null>(null);
  const progress = useRef(0);
  const [ready, setReady] = useState(false);
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
    const stop = () => {
      control.current?.dispose();
      control.current = null;
      setReady(false);
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
    const observer = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; void start(); }, { rootMargin: "600px 0px" });
    observer.observe(el);
    const visibleObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      control.current?.setVisible(visible);
    });
    visibleObserver.observe(el);
    const preference = () => { if (media.matches) stop(); else void start(); };
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
      <img src="/models/record-player/poster.webp" alt="" width="830" height="960" loading="lazy"
        className="record-player-poster" style={{ visibility: ready ? "hidden" : "visible" }} />
      <div ref={host} className="absolute inset-0" style={{ visibility: ready ? "visible" : "hidden" }} data-record-player-canvas />
    </div>
  );
}
