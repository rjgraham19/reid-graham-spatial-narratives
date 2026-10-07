/**
 * Tile-sized copies of the Lollapalooza photo-strip images.
 *
 * The strip shows each photo as a centre-cropped square card, 192–352px
 * wide, but the originals are 1.4–5.1 MB full-size photos (15.4 MB for
 * the five). These are the same centre crops, pre-cut square at 600 and
 * 1056px (enough for the largest card on a 3× screen). The originals still
 * open in the lightbox.
 */
import djBooth from "@/assets/rg/lollapalooza-gallery-dj-booth.jpg";
import loungePath from "@/assets/rg/lollapalooza-gallery-lounge-path.jpg";
import recordInstall from "@/assets/rg/lollapalooza-gallery-record-install.jpg";
import loungeInterior from "@/assets/rg/lollapalooza-gallery-lounge-interior.jpg";
import friendsGroup from "@/assets/rg/lollapalooza-gallery-friends-group.jpg";
import djBooth600 from "@/assets/rg/strip/lollapalooza-gallery-dj-booth-sq600.jpg";
import djBooth1056 from "@/assets/rg/strip/lollapalooza-gallery-dj-booth-sq1056.jpg";
import loungePath600 from "@/assets/rg/strip/lollapalooza-gallery-lounge-path-sq600.jpg";
import loungePath1056 from "@/assets/rg/strip/lollapalooza-gallery-lounge-path-sq1056.jpg";
import recordInstall600 from "@/assets/rg/strip/lollapalooza-gallery-record-install-sq600.jpg";
import recordInstall1056 from "@/assets/rg/strip/lollapalooza-gallery-record-install-sq1056.jpg";
import loungeInterior600 from "@/assets/rg/strip/lollapalooza-gallery-lounge-interior-sq600.jpg";
import loungeInterior1056 from "@/assets/rg/strip/lollapalooza-gallery-lounge-interior-sq1056.jpg";
import friendsGroup600 from "@/assets/rg/strip/lollapalooza-gallery-friends-group-sq600.jpg";
import friendsGroup1056 from "@/assets/rg/strip/lollapalooza-gallery-friends-group-sq1056.jpg";

const THUMBS: Record<string, [small: string, large: string]> = {
  [djBooth]: [djBooth600, djBooth1056],
  [loungePath]: [loungePath600, loungePath1056],
  [recordInstall]: [recordInstall600, recordInstall1056],
  [loungeInterior]: [loungeInterior600, loungeInterior1056],
  [friendsGroup]: [friendsGroup600, friendsGroup1056],
};

/** The tile `src` and `srcset` for a strip photo; the original if unknown. */
export function stripThumb(src: string): { src: string; srcSet?: string } {
  const t = THUMBS[src];
  return t ? { src: t[0], srcSet: `${t[0]} 600w, ${t[1]} 1056w` } : { src };
}
