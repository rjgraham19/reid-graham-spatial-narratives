import { useEffect, useRef } from "react";
import { DESKTOP_BREAKPOINT_PX } from "@/lib/apply-overrides";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { MediaAdditionsFile } from "@/lib/media-additions.types";
import {
  DESIGN_BRIDGE_SOURCE,
  isDesignMessage,
  type ElementSnapshot,
  type FrameToParent,
  type InteractionMode,
  type MoveKind,
  type ParentToFrame,
  type SelectionKind,
} from "./protocol";
import { ensureFontLoadedByLabel } from "./fonts";

function post(msg: FrameToParent) {
  window.parent.postMessage(msg, window.location.origin);
}

function currentScope(): "mobile" | "desktop" {
  return window.innerWidth < DESKTOP_BREAKPOINT_PX ? "mobile" : "desktop";
}

/**
 * Reads the offset actually in effect right now, from computed style rather
 * than from in-memory override state. The element's current position can
 * come from a saved value (the CSS-tag rule, present from page load) or an
 * unsaved one (also the CSS-tag rule, once `onLocalPatch` re-renders it) —
 * either way this is the single source of truth for "where a new drag
 * starts from." Reading only the in-memory `live` state here previously
 * missed a saved-but-not-yet-touched-this-session offset entirely, so a
 * drag on an already-positioned image started from 0 instead of from where
 * it actually was, discarding the saved value in the same motion.
 */
function currentOffset(target: HTMLElement, kind: MoveKind): { x: number; y: number } {
  if (kind === "layout") {
    const figure = target.closest("figure") as HTMLElement | null;
    const marginTop = figure ? parseFloat(getComputedStyle(figure).marginTop) : 0;
    return { x: 0, y: Number.isFinite(marginTop) ? marginTop : 0 };
  }
  const transform = getComputedStyle(target).transform;
  if (!transform || transform === "none") return { x: 0, y: 0 };
  const match = /matrix\(([^)]+)\)/.exec(transform);
  if (!match) return { x: 0, y: 0 };
  const parts = match[1].split(",").map((n) => parseFloat(n.trim()));
  return { x: parts[4] || 0, y: parts[5] || 0 };
}

function snapshotFor(el: HTMLElement): ElementSnapshot {
  const kind = (el.dataset.designKind ?? "text") as SelectionKind;
  const rect = el.getBoundingClientRect();
  const base: ElementSnapshot = {
    id: el.dataset.designId!,
    kind,
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
  };
  if (kind === "image") {
    const media = el.tagName === "IMG" || el.tagName === "VIDEO" ? el : el.querySelector("img,video");
    const srcEl = media as (HTMLImageElement | HTMLVideoElement) | null;
    const src = srcEl?.getAttribute("src") ?? "";
    base.caption = (srcEl as HTMLImageElement | null)?.alt;
    base.media = {
      role: el.dataset.designRole ?? "image",
      project: el.dataset.designProject ?? "",
      src,
      filename: src.split("/").pop() ?? src,
      alt: (srcEl as HTMLImageElement | null)?.alt,
      link: el.dataset.designLink || undefined,
      layout: el.dataset.designLayout === "half" ? "half" : el.dataset.designLayout === "full" ? "full" : undefined,
      addedByDesignMode: el.dataset.designAdded === "1",
    };
  } else {
    base.text = el.textContent ?? "";
  }
  return base;
}

/** Nearest ancestor that actually clips content — the thing responsible for
    an image "disappearing" once dragged past its own box. */
function findClippingAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if (style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden") {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

type GuideOverlay = { v: HTMLDivElement; h: HTMLDivElement };

function makeGuides(): GuideOverlay {
  const mk = (axis: "v" | "h") => {
    const d = document.createElement("div");
    d.style.position = "fixed";
    d.style.background = "#4f8cff";
    d.style.zIndex = "2147483000";
    d.style.pointerEvents = "none";
    d.style.display = "none";
    if (axis === "v") {
      d.style.width = "1px";
      d.style.top = "0";
      d.style.bottom = "0";
    } else {
      d.style.height = "1px";
      d.style.left = "0";
      d.style.right = "0";
    }
    document.body.appendChild(d);
    return d;
  };
  return { v: mk("v"), h: mk("h") };
}

const SNAP_THRESHOLD = 7;

/**
 * Mounted only inside the Design Mode canvas iframe. Delegates all click /
 * drag / keyboard handling for `[data-design-id]` elements. Text and
 * position edits update the parent's store (undo/redo, draft, save) but
 * every element's rendered value comes from `liveOverrides`, owned by the
 * page component one level up — so two on-page instances of the same ID
 * (e.g. a caption shown in the grid and again in the lightbox) always agree,
 * without the bridge ever touching them via raw DOM writes.
 */
export default function InnerFrameBridge({
  liveOverrides,
  liveMedia: _liveMedia,
  onLocalPatch,
  onLocalReset,
  onSyncAll,
}: {
  liveOverrides: DesignOverridesFile;
  liveMedia: MediaAdditionsFile;
  onLocalPatch: (id: string, scope: Scope, patch: ElementOverride) => void;
  onLocalReset: (id: string) => void;
  onSyncAll: (overrides: DesignOverridesFile, media: MediaAdditionsFile) => void;
}) {
  const modeRef = useRef<InteractionMode>("browse");
  const moveKindRef = useRef<MoveKind>("layout");
  const selectedRef = useRef<HTMLElement | null>(null);
  const clipFixRef = useRef<{ el: HTMLElement; overflow: string; position: string; zIndex: string } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    /** Cumulative value already committed before this drag started — the
        live preview must start from here, not from zero, or a second drag
        on an already-moved element visually "resets" while the stored
        value keeps adding on top of what the user can no longer see. */
    baseX: number;
    baseY: number;
    dx: number;
    dy: number;
    target: HTMLElement;
    kind: MoveKind;
    scope: "mobile" | "desktop";
  } | null>(null);
  const guidesRef = useRef<GuideOverlay | null>(null);
  // `liveOverrides` isn't read directly here — a drag/nudge's starting point
  // comes from `currentOffset()` (computed style) instead, since that's the
  // one place guaranteed to reflect whatever's actually on screen, saved or
  // not. The prop still documents that this component's writes flow through
  // the page's live-override state, not raw DOM mutation.
  void liveOverrides;
  void _liveMedia;

  useEffect(() => {
    if (window.self === window.top) return; // only active embedded in the Design Mode canvas
    guidesRef.current = makeGuides();

    const restoreClipFix = () => {
      const fix = clipFixRef.current;
      if (!fix) return;
      fix.el.style.overflow = fix.overflow;
      fix.el.style.position = fix.position;
      fix.el.style.zIndex = fix.zIndex;
      clipFixRef.current = null;
    };

    const clearHighlight = (el: HTMLElement | null) => {
      if (el) el.style.outline = "";
      restoreClipFix();
    };

    const select = (el: HTMLElement) => {
      clearHighlight(selectedRef.current);
      selectedRef.current = el;
      el.style.outline = "2px solid #4f8cff";
      el.style.outlineOffset = "2px";

      // Temporarily let a selected image escape a clipping ancestor (the
      // hover/scale button wrapper) so dragging it doesn't turn it black —
      // reverted the moment selection changes.
      if (el.dataset.designKind === "image") {
        const ancestor = findClippingAncestor(el);
        if (ancestor) {
          clipFixRef.current = {
            el: ancestor,
            overflow: ancestor.style.overflow,
            position: ancestor.style.position,
            zIndex: ancestor.style.zIndex,
          };
          ancestor.style.overflow = "visible";
          if (!ancestor.style.position) ancestor.style.position = "relative";
          ancestor.style.zIndex = "40";
        }
      }

      post({ source: DESIGN_BRIDGE_SOURCE, type: "select", snapshot: snapshotFor(el) });
    };

    const deselect = () => {
      clearHighlight(selectedRef.current);
      selectedRef.current = null;
      post({ source: DESIGN_BRIDGE_SOURCE, type: "deselect" });
    };

    let unmappedTimer: number | undefined;
    const flashUnmapped = (target: HTMLElement) => {
      window.clearTimeout(unmappedTimer);
      const label = document.createElement("div");
      label.textContent = `No Design Mode mapping — <${target.tagName.toLowerCase()}> on ${window.location.pathname}`;
      label.style.cssText =
        "position:fixed;z-index:2147483000;background:#3a1a1a;color:#ffb4b4;font:11px monospace;padding:4px 8px;border-radius:4px;pointer-events:none;";
      const rect = target.getBoundingClientRect();
      label.style.top = `${Math.max(0, rect.top - 24)}px`;
      label.style.left = `${rect.left}px`;
      document.body.appendChild(label);
      unmappedTimer = window.setTimeout(() => label.remove(), 1500);
    };

    const onClick = (e: MouseEvent) => {
      if (modeRef.current === "browse") return;
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-design-id]");
      const protectedEl = (e.target as HTMLElement).closest<HTMLElement>("[data-design-protected]");
      if (protectedEl && !target) {
        e.preventDefault();
        e.stopPropagation();
        flashUnmapped(protectedEl);
        return;
      }
      if (!target) {
        deselect();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      select(target);
    };

    const beginTextEdit = (target: HTMLElement) => {
      const before = target.textContent ?? "";
      target.contentEditable = "true";
      target.style.cursor = "text";
      target.focus();
      const range = document.createRange();
      range.selectNodeContents(target);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      const finish = (commit: boolean) => {
        target.contentEditable = "false";
        target.style.cursor = "";
        target.removeEventListener("blur", onBlur);
        target.removeEventListener("keydown", onKey);
        if (!commit) {
          target.textContent = before;
          return;
        }
        const text = target.textContent ?? "";
        onLocalPatch(target.dataset.designId!, "base", { text });
        post({ source: DESIGN_BRIDGE_SOURCE, type: "textCommitted", id: target.dataset.designId!, text });
      };
      const onBlur = () => finish(true);
      const onKey = (ke: KeyboardEvent) => {
        if (ke.key === "Escape") {
          ke.stopPropagation();
          finish(false);
        }
      };
      target.addEventListener("blur", onBlur);
      target.addEventListener("keydown", onKey);
    };

    const onDblClick = (e: MouseEvent) => {
      if (modeRef.current !== "content" && modeRef.current !== "arrange") return;
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-design-id]");
      if (!target) {
        const raw = e.target as HTMLElement;
        if (!raw.closest("[data-design-protected]") && raw.textContent?.trim()) flashUnmapped(raw);
        return;
      }
      if (target.dataset.designKind === "image") return;
      e.preventDefault();
      beginTextEdit(target);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (modeRef.current !== "arrange" || !selectedRef.current) return;
      if (selectedRef.current.isContentEditable) return;
      if (!selectedRef.current.contains(e.target as Node) && e.target !== selectedRef.current) return;
      e.preventDefault();
      const target = selectedRef.current;
      const kind: MoveKind = target.dataset.designKind === "image" ? moveKindRef.current : "free";
      const scope = currentScope();
      const base = currentOffset(target, kind);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: base.x,
        baseY: base.y,
        dx: 0,
        dy: 0,
        target,
        kind,
        scope,
      };
    };

    const hideGuides = () => {
      if (!guidesRef.current) return;
      guidesRef.current.v.style.display = "none";
      guidesRef.current.h.style.display = "none";
    };

    const snapCandidatesFor = (target: HTMLElement) => {
      const parent = target.closest("figure")?.parentElement ?? target.parentElement;
      const parentRect = parent?.getBoundingClientRect();
      const verticals: number[] = [];
      const horizontals: number[] = [];
      if (parentRect) {
        verticals.push(parentRect.left, parentRect.right, (parentRect.left + parentRect.right) / 2);
      }
      verticals.push(window.innerWidth / 2);
      if (parent) {
        for (const sib of Array.from(parent.children)) {
          if (sib === target || !(sib instanceof HTMLElement)) continue;
          const r = sib.getBoundingClientRect();
          horizontals.push(r.top, r.bottom, (r.top + r.bottom) / 2);
        }
      }
      return { verticals, horizontals };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const rawDx = e.clientX - drag.startX;
      const rawDy = e.clientY - drag.startY;

      if (drag.kind === "free") {
        // Preview always starts from what's already committed (baseX/baseY),
        // not from zero — otherwise a second drag on an already-moved
        // element looks like it resets, while the stored value keeps adding
        // on top of a position the user can no longer see.
        let tx = drag.baseX + rawDx;
        let ty = drag.baseY + rawDy;

        if (!e.altKey) {
          // The element currently renders at (tx, ty) from its unmoved
          // layout position, via the inline transform we're about to set —
          // compute the box that transform would produce and snap that.
          const layoutRect = drag.target.getBoundingClientRect();
          const priorTransform = drag.target.style.transform;
          // getBoundingClientRect reflects whatever transform is already
          // applied; back it out so `layoutRect` is the untransformed box.
          const priorMatch = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(priorTransform);
          const priorX = priorMatch ? Number(priorMatch[1]) : 0;
          const priorY = priorMatch ? Number(priorMatch[2]) : 0;
          const left = layoutRect.left - priorX;
          const right = layoutRect.right - priorX;
          const top = layoutRect.top - priorY;
          const bottom = layoutRect.bottom - priorY;

          const movedLeft = left + tx;
          const movedRight = right + tx;
          const movedTop = top + ty;
          const movedBottom = bottom + ty;
          const movedCenterX = (movedLeft + movedRight) / 2;
          const movedCenterY = (movedTop + movedBottom) / 2;
          const { verticals, horizontals } = snapCandidatesFor(drag.target);

          let snappedX: number | null = null;
          for (const v of verticals) {
            for (const edge of [movedLeft, movedRight, movedCenterX]) {
              if (Math.abs(edge - v) <= SNAP_THRESHOLD) {
                tx += v - edge;
                snappedX = v;
                break;
              }
            }
            if (snappedX != null) break;
          }
          let snappedY: number | null = null;
          for (const h of horizontals) {
            for (const edge of [movedTop, movedBottom, movedCenterY]) {
              if (Math.abs(edge - h) <= SNAP_THRESHOLD) {
                ty += h - edge;
                snappedY = h;
                break;
              }
            }
            if (snappedY != null) break;
          }

          if (guidesRef.current) {
            if (snappedX != null) {
              guidesRef.current.v.style.left = `${snappedX}px`;
              guidesRef.current.v.style.display = "block";
            } else {
              guidesRef.current.v.style.display = "none";
            }
            if (snappedY != null) {
              guidesRef.current.h.style.top = `${snappedY}px`;
              guidesRef.current.h.style.display = "block";
            } else {
              guidesRef.current.h.style.display = "none";
            }
          }
        } else {
          hideGuides();
        }

        drag.target.style.transform = `translate(${tx}px, ${ty}px)`;
        drag.dx = tx - drag.baseX;
        drag.dy = ty - drag.baseY;
      } else {
        // Move with Layout: nudge margin-top on the figure ancestor so the
        // page actually reflows while dragging, not just visually shifts.
        // Same base-relative logic — start from what's already committed.
        const figure = drag.target.closest("figure") as HTMLElement | null;
        const newMarginTop = drag.baseY + rawDy;
        if (figure) figure.style.marginTop = `${newMarginTop}px`;
        drag.dx = 0;
        drag.dy = newMarginTop - drag.baseY;
      }
    };

    const onMouseUp = () => {
      const drag = dragRef.current;
      dragRef.current = null;
      hideGuides();
      if (drag) {
        if (drag.kind === "free") drag.target.style.transform = "";
        else {
          const figure = drag.target.closest("figure") as HTMLElement | null;
          if (figure) figure.style.marginTop = "";
        }
      }
      if (!drag || (drag.dx === 0 && drag.dy === 0)) return;
      const id = drag.target.dataset.designId!;
      // drag.dx/dy are already deltas relative to baseX/baseY, so adding
      // them to the pre-drag committed value (also baseX/baseY, by
      // construction) reconstructs exactly what the user just saw on screen.
      onLocalPatch(
        id,
        drag.scope,
        drag.kind === "layout"
          ? { layoutShiftY: drag.baseY + drag.dy }
          : { offsetX: drag.baseX + drag.dx, offsetY: drag.baseY + drag.dy },
      );
      post({
        source: DESIGN_BRIDGE_SOURCE,
        type: "moved",
        id,
        scope: drag.scope,
        kind: drag.kind,
        dx: drag.dx,
        dy: drag.dy,
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        deselect();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !selectedRef.current?.isContentEditable && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        post({ source: DESIGN_BRIDGE_SOURCE, type: e.shiftKey ? "requestRedo" : "requestUndo" });
        return;
      }
      if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        post({ source: DESIGN_BRIDGE_SOURCE, type: "requestRedo" });
        return;
      }
      if (modeRef.current !== "arrange" || !selectedRef.current || selectedRef.current.isContentEditable) return;
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === "ArrowLeft") dx = -step;
      else if (e.key === "ArrowRight") dx = step;
      else if (e.key === "ArrowUp") dy = -step;
      else if (e.key === "ArrowDown") dy = step;
      else return;
      e.preventDefault();
      const target = selectedRef.current;
      const id = target.dataset.designId!;
      const kind: MoveKind = target.dataset.designKind === "image" ? moveKindRef.current : "free";
      const scope = currentScope();
      const base = currentOffset(target, kind);
      onLocalPatch(
        id,
        scope,
        kind === "layout" ? { layoutShiftY: base.y + dy } : { offsetX: base.x + dx, offsetY: base.y + dy },
      );
      post({ source: DESIGN_BRIDGE_SOURCE, type: "moved", id, scope, kind, dx, dy });
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !isDesignMessage(e.data)) return;
      const msg = e.data as ParentToFrame;
      if (msg.type === "init" || msg.type === "setInteractionMode") {
        modeRef.current = msg.interactionMode;
        document.body.dataset.designMode = msg.interactionMode;
        if (msg.interactionMode === "browse") deselect();
      } else if (msg.type === "clearSelection") {
        deselect();
      } else if (msg.type === "setMoveKind") {
        moveKindRef.current = msg.moveKind;
      } else if (msg.type === "applyOverride") {
        if (msg.patch.fontFamily) ensureFontLoadedByLabel(document, msg.patch.fontFamily);
        onLocalPatch(msg.id, msg.scope, msg.patch);
      } else if (msg.type === "resetElement") {
        onLocalReset(msg.id);
      } else if (msg.type === "syncState") {
        onSyncAll(msg.overrides, msg.media);
      }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("dblclick", onDblClick, true);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("message", onMessage);

    post({ source: DESIGN_BRIDGE_SOURCE, type: "ready" });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDblClick, true);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("message", onMessage);
      guidesRef.current?.v.remove();
      guidesRef.current?.h.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Editable/protected hover affordances — pure CSS, mode-scoped via a body class.
  return (
    <style>{`
      /* Some page compositions (e.g. a title overlaid on its hero image)
         set pointer-events:none on the text's own container so ordinary
         clicks fall through to the image below it — intentional on the
         public site, but it also swallows Design Mode's own click handling
         in Content/Arrange, making that text unselectable and impossible to
         double-click into. An explicit "auto" directly on the tagged
         element re-enables clicks for it specifically without touching the
         production pointer-events behavior anywhere else (only these two
         body-scoped selectors exist at all, and only inside npm run design). */
      body[data-design-mode="content"] [data-design-id],
      body[data-design-mode="arrange"] [data-design-id] {
        pointer-events: auto !important;
      }
      body[data-design-mode="content"] [data-design-id][data-design-kind="text"]:hover,
      body[data-design-mode="content"] [data-design-id][data-design-kind="heading"]:hover,
      body[data-design-mode="arrange"] [data-design-id]:hover {
        outline: 1.5px dashed rgba(79,140,255,0.6);
        outline-offset: 2px;
        cursor: pointer;
      }
      body[data-design-mode="content"] [data-design-protected]:hover,
      body[data-design-mode="arrange"] [data-design-protected]:hover {
        outline: 1.5px dashed rgba(255,140,79,0.6);
        outline-offset: 2px;
        cursor: not-allowed;
      }
    `}</style>
  );
}
