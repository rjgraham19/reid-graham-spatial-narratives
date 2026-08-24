import { useEffect, useRef } from "react";
import { DESKTOP_BREAKPOINT_PX } from "@/lib/apply-overrides";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { MediaAdditionsFile, MediaOrderFile } from "@/lib/media-additions.types";
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
      caption: el.dataset.designCaption || undefined,
      type: el.tagName === "VIDEO" || srcEl?.tagName === "VIDEO" ? "video" : "image",
      decorative: el.dataset.designDecorative === "1",
      link: el.dataset.designLink || undefined,
      layout: el.dataset.designLayout === "half" ? "half" : el.dataset.designLayout === "full" ? "full" : undefined,
      addedByDesignMode: el.dataset.designAdded === "1",
      mediaId: el.dataset.designMediaId || undefined,
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

/** One of the on-canvas contextual handles rendered next to a selected
    element — Move (text, Free Position), Reorder (image, content-order
    splice), Vertical Offset (image, same-row nudge). Positioned in fixed
    viewport coordinates, matching how the selection outline's own
    `getBoundingClientRect()` reads. */
type HandleKind = "move" | "reorder" | "offset";

function makeHandleEl(label: string, title: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.title = title;
  btn.style.cssText =
    "position:fixed;z-index:2147483001;width:22px;height:22px;line-height:20px;text-align:center;" +
    "border-radius:6px;background:#4f8cff;color:#fff;border:1px solid #2f6ddb;font:12px system-ui,sans-serif;" +
    "cursor:grab;display:none;padding:0;box-shadow:0 1px 4px rgba(0,0,0,0.4);user-select:none;";
  btn.dataset.designHandle = "1";
  document.body.appendChild(btn);
  return btn;
}

/** Positions a set of handle buttons along the top edge of `rect`, evenly
    spaced from the left so multiple handles never overlap each other. */
function layoutHandles(rect: DOMRect, handles: HTMLButtonElement[]) {
  handles.forEach((h, i) => {
    h.style.top = `${Math.max(2, rect.top - 26)}px`;
    h.style.left = `${rect.left + i * 26}px`;
  });
}

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
  liveMediaOrder: _liveMediaOrder,
  onLocalPatch,
  onLocalReset,
  onSyncAll,
}: {
  liveOverrides: DesignOverridesFile;
  liveMedia: MediaAdditionsFile;
  liveMediaOrder: MediaOrderFile;
  onLocalPatch: (id: string, scope: Scope, patch: ElementOverride) => void;
  onLocalReset: (id: string) => void;
  onSyncAll: (overrides: DesignOverridesFile, media: MediaAdditionsFile, mediaOrder: MediaOrderFile) => void;
}) {
  const modeRef = useRef<InteractionMode>("navigate");
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
  const reorderRef = useRef<{
    target: HTMLElement;
    container: HTMLElement;
    siblings: HTMLElement[];
    startIndex: number;
    hoverIndex: number;
  } | null>(null);
  const guidesRef = useRef<GuideOverlay | null>(null);
  const handlesRef = useRef<Record<HandleKind, HTMLButtonElement> | null>(null);
  const insertionLineRef = useRef<HTMLDivElement | null>(null);
  // `liveOverrides` isn't read directly here — a drag/nudge's starting point
  // comes from `currentOffset()` (computed style) instead, since that's the
  // one place guaranteed to reflect whatever's actually on screen, saved or
  // not. `liveMedia`/`liveMediaOrder` aren't read directly either — reorder
  // reads sibling order straight from the DOM. The props still document that
  // this component's writes flow through the page's live-override state,
  // not raw DOM mutation.
  void liveOverrides;
  void _liveMedia;
  void _liveMediaOrder;

  useEffect(() => {
    if (window.self === window.top) return; // only active embedded in the Design Mode canvas
    guidesRef.current = makeGuides();

    const insertionLine = document.createElement("div");
    insertionLine.style.cssText =
      "position:fixed;z-index:2147483000;height:3px;background:#4f8cff;border-radius:2px;pointer-events:none;display:none;" +
      "box-shadow:0 0 0 3px rgba(79,140,255,0.25);";
    document.body.appendChild(insertionLine);
    insertionLineRef.current = insertionLine;

    const moveHandle = makeHandleEl("⠿", "Drag to move");
    const reorderHandle = makeHandleEl("⠿", "Drag to reorder within the gallery");
    const offsetHandle = makeHandleEl("⇕", "Drag to offset vertically within this row — double-click to reset");
    handlesRef.current = { move: moveHandle, reorder: reorderHandle, offset: offsetHandle };

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

    const hideHandles = () => {
      moveHandle.style.display = "none";
      reorderHandle.style.display = "none";
      offsetHandle.style.display = "none";
    };

    const positionHandles = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      if (el.dataset.designKind === "image") {
        moveHandle.style.display = "none";
        reorderHandle.style.display = "block";
        offsetHandle.style.display = "block";
        layoutHandles(rect, [reorderHandle, offsetHandle]);
      } else {
        reorderHandle.style.display = "none";
        offsetHandle.style.display = "none";
        moveHandle.style.display = "block";
        layoutHandles(rect, [moveHandle]);
      }
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

      positionHandles(el);
      post({ source: DESIGN_BRIDGE_SOURCE, type: "select", snapshot: snapshotFor(el) });
    };

    const deselect = () => {
      clearHighlight(selectedRef.current);
      selectedRef.current = null;
      hideHandles();
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
      if (modeRef.current !== "edit") return;
      // A click landing on one of the floating handle buttons (appended to
      // document.body, outside any [data-design-id]) must not fall through
      // to the deselect branch below — this listener runs in the capture
      // phase, before the click ever reaches the button itself.
      if ((e.target as HTMLElement)?.closest?.("[data-design-handle]")) return;
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
      if (modeRef.current !== "edit") return;
      if ((e.target as HTMLElement)?.closest?.("[data-design-handle]")) return;
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

    // Drag handling is intentionally handle-only, not "grab the selected
    // element anywhere" — a raw grab-anywhere model fought with click-to-
    // select and double-click-to-edit-text, which is exactly the kind of
    // ambiguity the Navigate/Edit consolidation is meant to remove.
    const startDrag = (e: MouseEvent, kind: MoveKind) => {
      const target = selectedRef.current;
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      const scope = currentScope();
      const base = currentOffset(target, kind);
      dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: base.x, baseY: base.y, dx: 0, dy: 0, target, kind, scope };
    };

    const startReorder = (e: MouseEvent) => {
      const target = selectedRef.current;
      if (!target) return;
      const container = target.closest("figure")?.parentElement;
      if (!container) return;
      const siblings = Array.from(container.children)
        .filter((c): c is HTMLElement => c instanceof HTMLElement && c.tagName === "FIGURE")
        .map((fig) => fig.querySelector<HTMLElement>("[data-design-id][data-design-kind='image']"))
        .filter((el): el is HTMLElement => !!el);
      const startIndex = siblings.indexOf(target);
      if (startIndex === -1) return;
      e.preventDefault();
      e.stopPropagation();
      reorderRef.current = { target, container, siblings, startIndex, hoverIndex: startIndex };
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
      if (reorderRef.current) {
        const ro = reorderRef.current;
        const line = insertionLineRef.current;
        // Find which sibling gap the pointer is nearest to, by midpoint.
        let hoverIndex = ro.siblings.length;
        for (let i = 0; i < ro.siblings.length; i++) {
          const r = ro.siblings[i].getBoundingClientRect();
          if (e.clientY < r.top + r.height / 2) {
            hoverIndex = i;
            break;
          }
        }
        ro.hoverIndex = hoverIndex;
        if (line) {
          const refEl = ro.siblings[hoverIndex] ?? ro.siblings[ro.siblings.length - 1];
          const r = refEl.getBoundingClientRect();
          const atEnd = hoverIndex >= ro.siblings.length;
          line.style.top = `${atEnd ? r.bottom + 4 : r.top - 4}px`;
          line.style.left = `${r.left}px`;
          line.style.width = `${r.width}px`;
          line.style.display = "block";
        }
        ro.target.style.opacity = "0.5";
        return;
      }

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
        // Vertical Offset: nudge margin-top on the figure ancestor so the
        // row actually reflows while dragging (a lowered image can't
        // overlap the next section — the row's own auto height grows with
        // it), not just visually shifts. Snaps back toward 0 (aligned with
        // its natural position) so realigning a staggered pair is easy
        // without forcing it.
        const figure = drag.target.closest("figure") as HTMLElement | null;
        let newMarginTop = drag.baseY + rawDy;
        const snappedToZero = Math.abs(newMarginTop) <= SNAP_THRESHOLD;
        if (snappedToZero) newMarginTop = 0;
        if (figure) figure.style.marginTop = `${newMarginTop}px`;
        if (guidesRef.current) {
          if (snappedToZero && figure) {
            const r = figure.getBoundingClientRect();
            guidesRef.current.h.style.top = `${r.top - newMarginTop}px`;
            guidesRef.current.h.style.display = "block";
          } else {
            guidesRef.current.h.style.display = "none";
          }
        }
        drag.dx = 0;
        drag.dy = newMarginTop - drag.baseY;
      }
      if (selectedRef.current) positionHandles(selectedRef.current);
    };

    const onMouseUp = () => {
      if (reorderRef.current) {
        const ro = reorderRef.current;
        reorderRef.current = null;
        ro.target.style.opacity = "";
        if (insertionLineRef.current) insertionLineRef.current.style.display = "none";
        if (ro.hoverIndex !== ro.startIndex && ro.hoverIndex !== ro.startIndex + 1) {
          const next = ro.siblings.filter((s) => s !== ro.target);
          const insertAt = ro.hoverIndex > ro.startIndex ? ro.hoverIndex - 1 : ro.hoverIndex;
          next.splice(insertAt, 0, ro.target);
          const slug = ro.target.dataset.designProject ?? "";
          const order = next.map((el) => {
            const id = el.dataset.designId ?? "";
            const prefix = `project.${slug}.media.`;
            return id.startsWith(prefix) ? id.slice(prefix.length) : id;
          });
          post({ source: DESIGN_BRIDGE_SOURCE, type: "reorderMedia", slug, order });
        }
        if (selectedRef.current) positionHandles(selectedRef.current);
        return;
      }

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
      if (drag && selectedRef.current) positionHandles(selectedRef.current);
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

    const onHandleMouseDown = (kind: HandleKind) => (e: MouseEvent) => {
      if (kind === "reorder") startReorder(e);
      else startDrag(e, kind === "offset" ? "layout" : "free");
    };
    const onOffsetDblClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = selectedRef.current;
      if (!target) return;
      const scope = currentScope();
      const base = currentOffset(target, "layout");
      if (base.y === 0) return;
      onLocalPatch(target.dataset.designId!, scope, { layoutShiftY: 0 });
      post({ source: DESIGN_BRIDGE_SOURCE, type: "moved", id: target.dataset.designId!, scope, kind: "layout", dx: 0, dy: -base.y });
    };
    moveHandle.addEventListener("mousedown", onHandleMouseDown("move"));
    reorderHandle.addEventListener("mousedown", onHandleMouseDown("reorder"));
    offsetHandle.addEventListener("mousedown", onHandleMouseDown("offset"));
    offsetHandle.addEventListener("dblclick", onOffsetDblClick);

    const onScrollOrResize = () => {
      if (selectedRef.current) positionHandles(selectedRef.current);
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
      if (modeRef.current !== "edit" || !selectedRef.current || selectedRef.current.isContentEditable) return;
      // Keyboard delete for the selected image — never fires while typing
      // (guarded above by the isContentEditable check) and only for images.
      if ((e.key === "Delete" || e.key === "Backspace") && selectedRef.current.dataset.designKind === "image") {
        e.preventDefault();
        post({ source: DESIGN_BRIDGE_SOURCE, type: "deleteSelected" });
        deselect();
        return;
      }
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
      const kind: MoveKind = target.dataset.designKind === "image" ? "layout" : "free";
      const scope = currentScope();
      const base = currentOffset(target, kind);
      onLocalPatch(
        id,
        scope,
        kind === "layout" ? { layoutShiftY: base.y + dy } : { offsetX: base.x + dx, offsetY: base.y + dy },
      );
      post({ source: DESIGN_BRIDGE_SOURCE, type: "moved", id, scope, kind, dx, dy });
      positionHandles(target);
    };

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !isDesignMessage(e.data)) return;
      const msg = e.data as ParentToFrame;
      if (msg.type === "init" || msg.type === "setInteractionMode") {
        modeRef.current = msg.interactionMode;
        document.body.dataset.designMode = msg.interactionMode;
        if (msg.interactionMode === "navigate") deselect();
      } else if (msg.type === "clearSelection") {
        deselect();
      } else if (msg.type === "applyOverride") {
        if (msg.patch.fontFamily) ensureFontLoadedByLabel(document, msg.patch.fontFamily);
        onLocalPatch(msg.id, msg.scope, msg.patch);
      } else if (msg.type === "resetElement") {
        onLocalReset(msg.id);
      } else if (msg.type === "syncState") {
        // Undo/Redo/Discard/Resume can bring a fontFamily choice back into
        // view without ever passing through "applyOverride" (which is the
        // only other place a font gets preloaded) — preload here too, or
        // the CSS re-applies while the font file was never (re)requested.
        for (const scoped of Object.values(msg.overrides)) {
          for (const patch of Object.values(scoped)) {
            if (patch.fontFamily) ensureFontLoadedByLabel(document, patch.fontFamily);
          }
        }
        onSyncAll(msg.overrides, msg.media, msg.mediaOrder);
      }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("dblclick", onDblClick, true);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("message", onMessage);

    post({ source: DESIGN_BRIDGE_SOURCE, type: "ready" });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDblClick, true);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("message", onMessage);
      // Clears a lingering selection outline this instance applied directly
      // to a page element — style state that lives outside React, so it
      // would otherwise survive this component being torn down and re-init'd
      // (e.g. dev-mode Fast Refresh) with a fresh, unaware `selectedRef`.
      clearHighlight(selectedRef.current);
      guidesRef.current?.v.remove();
      guidesRef.current?.h.remove();
      insertionLineRef.current?.remove();
      moveHandle.remove();
      reorderHandle.remove();
      offsetHandle.remove();
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
         in Edit mode, making that text unselectable and impossible to
         double-click into. An explicit "auto" directly on the tagged
         element re-enables clicks for it specifically without touching the
         production pointer-events behavior anywhere else (only these two
         body-scoped selectors exist at all, and only inside npm run design). */
      body[data-design-mode="edit"] [data-design-id] {
        pointer-events: auto !important;
      }
      body[data-design-mode="edit"] [data-design-id][data-design-kind="text"]:hover,
      body[data-design-mode="edit"] [data-design-id][data-design-kind="heading"]:hover,
      body[data-design-mode="edit"] [data-design-id][data-design-kind="image"]:hover {
        outline: 1.5px dashed rgba(79,140,255,0.6);
        outline-offset: 2px;
        cursor: pointer;
      }
      body[data-design-mode="edit"] [data-design-protected]:hover {
        outline: 1.5px dashed rgba(255,140,79,0.6);
        outline-offset: 2px;
        cursor: not-allowed;
      }
    `}</style>
  );
}
