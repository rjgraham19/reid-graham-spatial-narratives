import { useEffect, useRef, useState } from "react";
import "./true-west-groundplan.css";

const media = "/design-media/true-west/";

/** The approved composition and entrance from true-west-animation.zip:
 *  the plan stays still; both swatches fade in together while rising
 *  gently (≤40px) over 950ms, once, when the swatches come into view. */
export function TrueWestGroundplan({ animate = true }: { animate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // The swatches leave the server already hidden (data-anim="pending"), so
  // nothing has to snap them off once the page's script arrives. Hiding them
  // from script instead meant a refresh while scrolled to the drawing showed
  // them, blinked them out, then faded them back in.
  const [pending, setPending] = useState(animate);

  useEffect(() => {
    const root = ref.current;
    if (!root || !animate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !window.IntersectionObserver || !Element.prototype.animate) {
      setPending(false);
      return;
    }

    const cards = [...root.querySelectorAll<HTMLImageElement>(".tw-swatch")];
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let animations: Animation[] = [];
    const stop = () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
    };
    // Not part of the cleanup: an effect re-run (React's dev double-mount)
    // must leave the swatches hidden for the entrance, not reveal them.
    const onMotionChange = () => { if (reduced.matches) { stop(); setPending(false); } };
    reduced.addEventListener("change", onMotionChange);

    Promise.all([...root.querySelectorAll("img")].map((img) => img.decode().catch(() => {})))
      .then(() => {
        if (cancelled) return;
        if (reduced.matches) { setPending(false); return; }
        observer = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          const distance = Math.min(40, root.clientWidth * 0.025);
          // Started before the hidden state is lifted: the animation's own
          // first frame is opacity 0, so there's no instant where they show.
          animations = cards.map((card) => card.animate([
            { opacity: 0, transform: `translateY(${distance}px)` },
            { opacity: 1, transform: "translateY(0)" },
          ], { duration: 950, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }));
          setPending(false);
        }, { threshold: 0.6 });
        // Watch a swatch, not the whole drawing: the swatches hang off its
        // bottom edge, so a quarter of the drawing in view (the package's
        // trigger) still left them below the fold — the entrance played
        // out of sight and they were already still when they scrolled in.
        // Both share one row, so the first stands in for the pair.
        observer.observe(cards[0]);
      });

    return () => {
      cancelled = true;
      stop();
      reduced.removeEventListener("change", onMotionChange);
    };
  }, [animate]);

  return (
    <div ref={ref} className="tw-groundplan" data-anim={pending ? "pending" : undefined}>
      {/* Without script the entrance never runs — show the finished composition. */}
      <noscript>
        <style>{`.tw-groundplan[data-anim="pending"] .tw-swatch { opacity: 1; }`}</style>
      </noscript>
      <img className="tw-plan" src={`${media}TRUEWEST_DRAWING_4096.png`} width={4096} height={1814}
        alt="True West groundplans: suburban kitchen at left and desert kitchen at right." />
      <img className="tw-swatch tw-swatch--lush" src={`${media}CROPPED_PANTONELUSH.png`} width={1846} height={1852}
        alt="Suburbia — Artificial Lushness" />
      <img className="tw-swatch tw-swatch--west" src={`${media}CROPPED_PANTONEWEST.png`} width={1845} height={1849}
        alt="Wild West — Natural" />
    </div>
  );
}
