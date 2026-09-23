/**
 * General Sans Semibold advance widths (em, uppercase + digits + common
 * punctuation), measured from the self-hosted font. Lets the server work out
 * how wide an all-caps title will set, so titles can be sized in CSS (with
 * container-query units) before anything loads — no post-load measuring, no
 * visible jump, and no word ever breaks mid-letter or overflows its box.
 */
const GENERAL_SANS_600_ADVANCE: Record<string, number> = {
  A: 0.73, B: 0.647, C: 0.786, D: 0.727, E: 0.601, F: 0.568, G: 0.796, H: 0.763, I: 0.299,
  J: 0.624, K: 0.68, L: 0.568, M: 0.928, N: 0.765, O: 0.799, P: 0.652, Q: 0.799, R: 0.685,
  S: 0.663, T: 0.639, U: 0.734, V: 0.7, W: 0.97, X: 0.716, Y: 0.674, Z: 0.644,
  "0": 0.614, "1": 0.359, "2": 0.558, "3": 0.577, "4": 0.595, "5": 0.571, "6": 0.577,
  "7": 0.514, "8": 0.592, "9": 0.577,
  " ": 0.209, "!": 0.287, "?": 0.518, "&": 0.693, "'": 0.256, "’": 0.27, ".": 0.263,
  ",": 0.263, ":": 0.263, ";": 0.263, "-": 0.36, "–": 0.5, "—": 0.75, "/": 0.505,
  "+": 0.66, "@": 0.975, "(": 0.318, ")": 0.318,
};

/** Width of an all-caps string in General Sans Semibold at the given
 *  letter-spacing (em), in ems, with `headroom` for kerning, rounding and
 *  (on the homepage tiles) the hover scale-up. */
export function textEms(text: string, trackingEm = -0.03, headroom = 1.02) {
  let ems = 0;
  for (const ch of text.toUpperCase()) ems += (GENERAL_SANS_600_ADVANCE[ch] ?? 0.7) + trackingEm;
  return ems * headroom;
}

/** Width of the title's longest single word, in ems — what a wrapping title
 *  must fit so no word ever breaks or spills. */
export function longestWordEms(text: string, trackingEm = -0.03, headroom = 1.02) {
  return Math.max(...text.split(" ").map((w) => textEms(w, trackingEm, headroom)));
}
