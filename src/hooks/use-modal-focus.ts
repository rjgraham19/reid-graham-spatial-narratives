import { useEffect } from 'react';

/** Keyboard containment and return focus, including same-origin project frames. */
export function useModalFocus(open: boolean, selector: string) {
  useEffect(() => {
    if (!open) return;
    const dialog = document.querySelector<HTMLElement>(selector);
    if (!dialog) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () => {
      const collect = (root: ParentNode): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"],iframe')].flatMap(el => {
        if (!el.getClientRects().length || el.closest('[inert],[aria-hidden="true"]')) return [];
        if (el instanceof HTMLIFrameElement) {
          try { return el.contentDocument ? collect(el.contentDocument) : [el]; } catch { return [el]; }
        }
        return [el];
      });
      return collect(dialog);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusables();
      const active = (event.target as HTMLElement)?.ownerDocument.activeElement;
      const index = items.indexOf(active as HTMLElement);
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      if (index < 0 || (!event.shiftKey && index === items.length-1) || (event.shiftKey && index === 0)) {
        event.preventDefault(); items[event.shiftKey ? items.length-1 : 0].focus();
      }
    };
    const docs = new Set<Document>([document]);
    const bindFrames = () => { for (const frame of dialog.querySelectorAll('iframe')) {
      try { if(frame.contentDocument && !docs.has(frame.contentDocument)) { docs.add(frame.contentDocument);frame.contentDocument.addEventListener('keydown',onKey); } } catch { /* Cross-origin frames retain browser navigation. */ }
    }};
    document.addEventListener('keydown',onKey);
    dialog.addEventListener('load',bindFrames,true); bindFrames();
    const timer=requestAnimationFrame(()=>focusables()[0]?.focus({preventScroll:true}));
    return () => {
      cancelAnimationFrame(timer);
      for(const doc of docs)doc.removeEventListener('keydown',onKey);
      dialog.removeEventListener('load',bindFrames,true);
      if(opener?.isConnected)opener.focus({preventScroll:true});
    };
  }, [open,selector]);
}
