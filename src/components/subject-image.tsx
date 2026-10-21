import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { responsiveMedia } from '@/lib/responsive-media';
import { mediaInsets } from '@/lib/media-insets';

/** Preserve the source file; reserve layout for the visible subject only.
 * Opposite-color cards and deliberately fixed/cropped stages retain their file edge.
 * CSS resolves the enclosing light-zone without client measurement or layout shift.
 */
/** The full-width guess responsiveMedia falls back on. */
const WIDE = '(max-width: 767px) calc(100vw - 48px), (max-width: 1200px) 85vw, 1000px';

export function SubjectImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const m = props.src ? mediaInsets[props.src] : undefined;
  const c = props.className ?? '';
  /* A lazy image is laid out before it loads, so `auto` lets the browser
     pick the copy that matches its real on-screen width — half-width pairs
     and small insets no longer pull the full-width file. Browsers without
     `auto` use the full-width guess after the comma, as before. */
  const sizes = props.sizes ?? (props.loading === 'lazy' ? `auto, ${WIDE}` : undefined);
  if (!m || m.background === 'none' || !c.includes('h-auto') || /aspect-|max-h-|absolute/.test(c)) return <img {...props} {...responsiveMedia(props.src, sizes)} />;
  const { top, right, bottom, left } = m.insets;
  const visibleWidth = 1-left-right;
  const visibleHeight = 1-top-bottom;
  return <span className={`optical-frame optical-${m.background} ${c}`} style={{
    '--file-ratio': m.width/m.height,
    '--subject-ratio': m.width*visibleWidth/(m.height*visibleHeight),
    '--bleed-width': `${100/visibleWidth}%`,
    '--bleed-left': `${-100*left/visibleWidth}%`,
    '--bleed-top': `${-100*top/visibleHeight}%`,
  } as CSSProperties}>
    <img {...props} {...responsiveMedia(props.src, sizes)} className="optical-bitmap" width={m.width} height={m.height} />
  </span>;
}
