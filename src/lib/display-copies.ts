/**
 * Lighter copies used where an image is shown inline at a fraction of its
 * real size; the original still opens in the lightbox.
 *
 * - YCTIWY wall elevations: 9297 × 6020 px — about 214 MB of memory once
 *   decoded — shown inline at roughly 540px wide. The display copy is
 *   1800px wide (enough for a 3× screen).
 */
import yctDrawing from "@/assets/rg/yctiwy-drawing.png";
import yctDrawingDisplay from "@/assets/rg/yctiwy-drawing-display.png";

const COPIES: Record<string, string> = {
  [yctDrawing]: yctDrawingDisplay,
};

/** The inline display copy of an image, or the image itself. */
export function displayCopy(src: string): string {
  return COPIES[src] ?? src;
}
