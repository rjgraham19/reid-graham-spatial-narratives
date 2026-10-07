import { useEffect, useRef, useState } from "react";

type SvgatorPlayer = {
  play: () => void;
  seekTo?: (ms: number) => void;
  duration?: number;
};
type SvgatorRoot = SVGSVGElement & {
  svgatorPlayer?: { ready: (cb: (player: SvgatorPlayer) => void) => void };
};

/* How long to wait for the embedded player script to initialise before
   giving up on playback (the artwork itself stays). */
const PLAYER_WAIT_MS = 5000;

/**
 * Embeds an SVGator-exported SVG that carries its own <script>.
 *
 * The markup is fetched and injected into the real page DOM — not via
 * <img>, <object>, or background-image. <img> refuses to execute scripts
 * inside an SVG at all, and <object> runs them in an isolated document
 * where scroll detection can't observe the parent page.
 *
 * innerHTML doesn't execute <script> tags, so each one is recreated after
 * injection to force the browser to run it.
 *
 * Playback: this export was configured with an "on scroll into view"
 * trigger, but the emitted file contains no IntersectionObserver and no
 * autoplay flag — so nothing in it appears to actually start playback.
 * An IntersectionObserver here calls play() once the graphic scrolls into
 * view. If the file does turn out to self-start, this is harmless: play()
 * on an already-running animation is a no-op.
 *
 * Resilience: the box reserves the artwork's proportions (`aspectRatio`)
 * from first paint, so nothing below it moves when the markup arrives. If
 * the fetch fails, the same file is shown as a plain <img> (its static
 * artwork, no script). Player start-up retries are bounded. Under
 * prefers-reduced-motion the animation is skipped to its final frame
 * instead of played.
 */
export function InlineAnimatedSvg({
  src,
  className,
  aspectRatio = "16 / 9",
}: {
  src: string;
  className?: string;
  /** The artwork's proportions, reserved before it loads. */
  aspectRatio?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const abort = new AbortController();
    const container = containerRef.current;
    if (!container) return;
    setFailed(false);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    fetch(src, { signal: abort.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((markup) => {
        if (cancelled || !container) return;
        container.innerHTML = markup;

        container.querySelectorAll("script").forEach((oldScript) => {
          const newScript = document.createElement("script");
          for (const attr of Array.from(oldScript.attributes)) {
            newScript.setAttribute(attr.name, attr.value);
          }
          newScript.textContent = oldScript.textContent;
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        });

        const svg = container.querySelector("svg") as SvgatorRoot | null;
        if (!svg) return;

        const startedAt = performance.now();
        const play = () => {
          if (cancelled) return;
          if (!svg.svgatorPlayer) {
            // The embedded script may still be initialising — but not
            // forever; past the limit the artwork just stays as it is.
            if (performance.now() - startedAt < PLAYER_WAIT_MS) retry = setTimeout(play, 50);
            return;
          }
          svg.svgatorPlayer.ready((player) => {
            if (cancelled) return;
            if (reduced && player.seekTo && player.duration) player.seekTo(player.duration);
            else if (!reduced) player.play();
          });
        };

        observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              play();
              observer?.disconnect();
            }
          },
          { threshold: 0.25 },
        );
        observer.observe(svg);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      abort.abort();
      observer?.disconnect();
      if (retry) clearTimeout(retry);
    };
  }, [src]);

  return (
    <div ref={containerRef} className={className} style={{ aspectRatio }}>
      {failed && <img src={src} alt="" className="block h-full w-full" />}
    </div>
  );
}
