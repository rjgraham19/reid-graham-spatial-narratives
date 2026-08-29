import { useCallback, useRef, useState } from "react";
import { designId } from "@/lib/design-ids";
import type { MediaItem } from "@/lib/projects";

/**
 * A bare-bones, one-at-a-time image carousel for phones: native horizontal
 * scroll-snap, so the swipe is the browser's own and there's no gesture code
 * to get wrong. Each slide is the full column width and the image sits at its
 * natural aspect ratio (`h-auto object-contain`) rather than being boxed or
 * cropped — the point being to make detailed source assets actually legible
 * on a small screen, where the desktop "row of tiles" collapses them to
 * thumbnails.
 *
 * Tapping a slide calls `onOpen(index)` with the item's original
 * `project.media` index, so it feeds the same lightbox as every other image
 * on the page. A horizontal drag scrolls instead of tapping — the browser
 * distinguishes the two.
 *
 * Desktop keeps its existing layout; this is rendered only inside a
 * `md:hidden` wrapper by the caller.
 */
export function SwipeGallery({
  slug,
  items,
  onOpen,
  slideClassName = "",
}: {
  slug: string;
  items: { item: MediaItem; index: number }[];
  onOpen: (index: number) => void;
  /** Extra classes on each slide button — e.g. a white card for line drawings. */
  slideClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive((prev) => (prev === i ? prev : Math.max(0, Math.min(items.length - 1, i))));
  }, [items.length]);

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(({ item: m, index: i }) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={m.caption ?? "Open image"}
            className={`w-full shrink-0 snap-start ${slideClassName}`}
          >
            <img
              data-design-id={designId.projectMedia(slug, m.id!)}
              data-design-kind="image"
              src={m.src}
              alt={m.caption ?? ""}
              loading="lazy"
              className="h-auto w-full object-contain"
            />
          </button>
        ))}
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                i === active ? "bg-foreground" : "bg-foreground/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
