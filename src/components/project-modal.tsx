import { useCallback, useEffect, useState } from "react";
import type { Project, MediaItem, Credit } from "@/lib/projects";

type Props = {
  project: Project | null;
  onClose: () => void;
};

export function ProjectModal({ project, onClose }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (delta: number) => {
      if (!project) return;
      setLightbox((cur) => {
        if (cur == null) return cur;
        const n = project.media.length;
        return (cur + delta + n) % n;
      });
    },
    [project],
  );

  // Lock scroll while open
  useEffect(() => {
    if (!project) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [project]);

  // Keyboard: ESC to close (modal or lightbox), arrows in lightbox
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox != null) closeLightbox();
        else onClose();
      }
      if (lightbox != null) {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, lightbox, closeLightbox, step, onClose]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-lg overflow-y-auto animate-reveal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      {/* Sticky close bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12 py-5 bg-background/70 backdrop-blur-md border-b border-border">
        <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/60">
          {project.subtitle}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="pill"
          aria-label="Close project"
        >
          CLOSE ✕
        </button>
      </div>

      <div
        className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="font-display font-black uppercase leading-[0.9] tracking-[-0.03em] text-4xl md:text-7xl text-balance">
          {project.title}
        </h2>

        {/* Description + credits */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-8">
            <p className="font-display font-light text-lg md:text-2xl leading-snug tracking-tight text-balance">
              {project.description}
            </p>
            {project.notes && project.notes.length > 0 && (
              <ul className="mt-8 space-y-3 text-foreground/70">
                {project.notes.map((n, i) => (
                  <li key={i} className="flex gap-4 text-sm md:text-base">
                    <span className="text-foreground/40 text-xs mt-1.5">0{i + 1}</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {project.credits && project.credits.length > 0 && (
            <div className="md:col-span-4">
              <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-5">
                Credits
              </p>
              <ul className="space-y-3">
                {project.credits.map((c: Credit) => (
                  <li key={c.role} className="text-sm">
                    <span className="text-foreground/50">{c.role}</span>
                    <br />
                    <span className="text-foreground">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Media */}
        <div className="mt-16 space-y-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50">
            Media · {project.media.length}
          </p>
          {project.media.map((m: MediaItem, i) => (
            <figure key={i} className="group">
              <button
                type="button"
                onClick={() => setLightbox(i)}
                className="block w-full overflow-hidden rounded-md bg-secondary"
                aria-label={m.caption ?? `Media ${i + 1}`}
              >
                <img
                  src={m.src}
                  alt={m.caption ?? project.title}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-700 ease-cinematic"
                />
              </button>
              {m.caption && (
                <figcaption className="mt-3 text-xs md:text-sm text-foreground/60 tracking-wide">
                  {String(i + 1).padStart(2, "0")} — {m.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

      {/* Lightbox layer (nested) */}
      {lightbox != null && (
        <div
          className="fixed inset-0 z-[110] bg-background/98 backdrop-blur-lg flex flex-col"
          onClick={(e) => {
            e.stopPropagation();
            closeLightbox();
          }}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <span className="text-[10px] tracking-[0.3em] uppercase text-foreground/60">
              {String(lightbox + 1).padStart(2, "0")} / {String(project.media.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeLightbox();
              }}
              className="pill"
            >
              CLOSE ✕
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center px-6 md:px-12 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={project.media[lightbox].src}
              alt={project.media[lightbox].caption ?? project.title}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex items-center justify-between px-6 pb-6 gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="pill"
            >
              ← PREV
            </button>
            {project.media[lightbox].caption && (
              <p className="text-xs md:text-sm text-foreground/70 text-center flex-1 px-4">
                {project.media[lightbox].caption}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="pill"
            >
              NEXT →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
