import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * A small glass tile, for controls that sit on top of a page rather than in
 * it — currently the project panel's Back and Close.
 *
 * The surface is deliberately colourless: a dark, translucent, blurred pane
 * that takes its tint from whatever it happens to be sitting over. On the
 * Lollapalooza panel that's the magenta perimeter, so the tile reads faintly
 * magenta; anywhere else it reads as smoked black. Giving the tile a colour
 * of its own would mean restyling it for every project that gets a tinted
 * surround, which is exactly what this avoids.
 *
 * Shape, reflection, depth and the press response all live in `.glass-button`
 * in styles.css — the top-edge highlight needs a pseudo-element, so the
 * styling can't be expressed in utilities alone.
 *
 * Everything else is passed straight through, so it stays an ordinary button:
 * onClick, aria-label, type and positioning classes all behave as usual.
 */
export function GlassButton({
  children,
  className = "",
  type = "button",
  quiet = false,
  icon = false,
  ...props
}: {
  children: ReactNode;
  /** Dims the label until hover. For nav, where a row of full-strength
   *  labels competes with the page. */
  quiet?: boolean;
  /** Square, for a single mark rather than a label. */
  icon?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={glassButton({ quiet, icon, className })} {...props}>
      {children}
    </button>
  );
}

/**
 * The back mark, drawn rather than typed. The `←` glyph is a shaft with a
 * point on it, which at this size reads as a dash; a bare chevron is what
 * belongs on a cut-glass control. As SVG its weight doesn't shift with the
 * font, and `currentColor` keeps it with the label through hover and press.
 *
 * Exported so the panel's Back control and the full page's Back link can't
 * drift apart.
 */
export function BackChevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 8 14"
      width="6"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6.5 1 1.5 7l5 6" />
    </svg>
  );
}

/**
 * The same surface, as a class string, for the things that have to be real
 * links — router `Link`s and `<a>`s. Wrapping TanStack's Link would mean
 * re-plumbing its generics for no gain, and an anchor styled as a button is
 * still an anchor: middle-click, cmd-click and "open in new tab" all keep
 * working, which they wouldn't through a <button>.
 */
export function glassButton({
  quiet = false,
  touch = false,
  icon = false,
  className = "",
}: { quiet?: boolean; touch?: boolean; icon?: boolean; className?: string } = {}) {
  return [
    "glass-button",
    quiet ? "glass-button--quiet" : "",
    touch ? "glass-button--touch" : "",
    icon ? "glass-button--icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/** The close mark. Drawn for the same reason as the chevron — a glyph's
 *  weight shifts with the font, and this one has to sit square. */
export function CloseMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M1.5 1.5 10.5 10.5M10.5 1.5 1.5 10.5" />
    </svg>
  );
}
