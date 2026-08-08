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
  ...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`glass-button ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
