import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { responsiveMedia } from '@/lib/responsive-media';
import { mediaInsets } from '@/lib/media-insets';

/** Preserve the source file; reserve layout for the visible subject only.
 * Opposite-color cards and deliberately fixed/cropped stages retain their file edge.
 * CSS resolves the enclosing light-zone without client measurement or layout shift.
 */
/** The full-width guess responsiveMedia falls back on. */
const WIDE = '(max-width: 767px) calc(100vw - 48px), (max-width: 1555px) 90vw, 1400px';

export function SubjectImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const m = props.src ? mediaInsets[props.src] : undefined;
  const c = props.className ?? '';
  /* A lazy image is laid out before it loads, so `auto` lets the browser
     pick the copy that matches its real on-screen width — half-width pairs
     and small insets no longer pull the full-width file. Browsers without
     `auto` use the full-width guess after the comma, as before. */
  const sizes = props.sizes ?? (props.loading === 'lazy' ? `auto, ${WIDE}` : undefined);
  /* Safeguards for the wider (90% / 1400px) footprint, on images that fill
     their column (w-full h-auto) and whose size we know: never shown wider
     than the file itself (so a small original stays sharp rather than
     stretching), and never taller than ~85% of the screen (so a tall image
     never needs scrolling to see whole). Either cap centres the image.
     Half-width pairs skip both caps: capping one of a pair would narrow it
     and break the pair's shared edges, and at half width (≤ ~700px) every
     file is big enough and even a tall drawing stays within the screen. */
  const half = (props as Record<string, unknown>)['data-design-layout'] === 'half';
  const capped = (w: number, h: number): CSSProperties | undefined =>
    !half && /\bw-full\b/.test(c) && /\bh-auto\b/.test(c)
      ? { maxWidth: `min(${w}px, calc(85svh * ${w / h}))`, marginInline: 'auto' }
      : undefined;
  const nw = Number(props.width), nh = Number(props.height);
  if (!m || m.background === 'none' || !c.includes('h-auto') || /aspect-|max-h-|absolute/.test(c)) {
    const cap = nw > 0 && nh > 0 ? capped(nw, nh) : undefined;
    return <img {...props} {...responsiveMedia(props.src, sizes)} style={cap ? { ...cap, ...props.style } : props.style} />;
  }
  const { top, right, bottom, left } = m.insets;
  const visibleWidth = 1-left-right;
  const visibleHeight = 1-top-bottom;
  return <span className={`optical-frame optical-${m.background} ${c}`} style={{
    ...capped(m.width * visibleWidth, m.height * visibleHeight),
    '--file-ratio': m.width/m.height,
    '--subject-ratio': m.width*visibleWidth/(m.height*visibleHeight),
    '--bleed-width': `${100/visibleWidth}%`,
    '--bleed-left': `${-100*left/visibleWidth}%`,
    '--bleed-top': `${-100*top/visibleHeight}%`,
  } as CSSProperties}>
    <img {...props} {...responsiveMedia(props.src, sizes)} className="optical-bitmap" width={m.width} height={m.height} />
  </span>;
}
