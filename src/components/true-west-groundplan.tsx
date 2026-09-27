import { useEffect, useRef } from "react";
import "./true-west-groundplan.css";

const media = "/design-media/true-west/";

/** The approved composition, including equal swatch-to-plan offsets. */
export function TrueWestGroundplan({ animate = true }: { animate?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !animate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !window.IntersectionObserver || !Element.prototype.animate) return;

    const cards = [...root.querySelectorAll<HTMLImageElement>(".tw-swatch")];
    let cancelled = false;
    let observer: IntersectionObserver | undefined;
    let animations: Animation[] = [];
    const show = () => cards.forEach((card) => { card.style.opacity = ""; });
    const stop = () => {
      observer?.disconnect();
      animations.forEach((animation) => animation.cancel());
      show();
    };
    const onMotionChange = () => { if (reduced.matches) stop(); };
    reduced.addEventListener("change", onMotionChange);
    cards.forEach((card) => { card.style.opacity = "0"; });

    Promise.all([...root.querySelectorAll("img")].map((img) => img.decode().catch(() => {})))
      .then(() => {
        if (cancelled) return;
        if (reduced.matches) { show(); return; }
        observer = new IntersectionObserver((entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer?.disconnect();
          show();
          const distance = Math.min(120, root.clientWidth * 0.075);
          animations = cards.map((card) => card.animate([
            { opacity: 0, transform: `translateY(${distance}px)` },
            { opacity: 1, transform: "translateY(0)" },
          ], { duration: 1200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }));
        }, { threshold: 0.25 });
        observer.observe(root);
      });

    return () => {
      cancelled = true;
      stop();
      reduced.removeEventListener("change", onMotionChange);
    };
  }, [animate]);

  return (
    <div ref={ref} className="tw-groundplan">
      <img className="tw-plan" src={`${media}TRUEWEST_DRAWING.png`} width={2048} height={906}
        alt="True West groundplans: suburban kitchen at left and desert kitchen at right." />
      <img className="tw-swatch tw-swatch--lush" src={`${media}CROPPED_PANTONELUSH.png`} width={1846} height={1852}
        alt="Suburbia — Artificial Lushness" />
      <img className="tw-swatch tw-swatch--west" src={`${media}CROPPED_PANTONEWEST.png`} width={1845} height={1849}
        alt="Wild West — Natural" />
    </div>
  );
}
