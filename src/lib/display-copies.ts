/**
 * Lighter copies used where an image is shown inline at a fraction of its
 * real size; the original still opens in the lightbox.
 *
 * - YCTIWY wall elevations: 9297 × 6020 px — about 214 MB of memory once
 *   decoded — shown inline at roughly 540px wide. The display copy is
 *   1800px wide (enough for a 3× screen), cropped to the drawing with a
 *   slim even margin (the export carried wide black bands, 4–17% a side).
 * - YCTIWY sketch: cropped the same way, 1400px wide.
 */
import yctDrawing from "@/assets/rg/yctiwy-drawing.png";
import yctDrawingDisplay from "@/assets/rg/yctiwy-drawing-display.png";
import yctSketch from "@/assets/rg/yctiwy-sketch.png";
import yctSketchDisplay from "@/assets/rg/yctiwy-sketch-display.png";

const COPIES: Record<string, string> = {
  [yctDrawing]: yctDrawingDisplay,
  [yctSketch]: yctSketchDisplay,
};

/** The inline display copy of an image, or the image itself. */
export function displayCopy(src: string): string {
  return COPIES[src] ?? src;
}
