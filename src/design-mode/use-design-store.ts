import { useCallback, useEffect, useRef, useState } from "react";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { AddedMediaEntry, MediaAdditionsFile, MediaOrderFile } from "@/lib/media-additions.types";
import type { ElementSnapshot, InteractionMode, MoveKind } from "./protocol";

export type DevicePreset = "iphone" | "desktop";

export type DraftState = {
  overrides: DesignOverridesFile;
  media: MediaAdditionsFile;
  mediaOrder: MediaOrderFile;
};

const DRAFT_KEY = "design-draft";
/** Rapid successive patches to the same element+scope within this window
    collapse into one history entry — one undo step per typing session or
    slider drag, not one per keystroke/tick. */
const GROUP_WINDOW_MS = 700;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function scopeForDevice(device: DevicePreset): Scope {
  return device === "iphone" ? "mobile" : "desktop";
}

function labelFor(patch: ElementOverride): string {
  if (patch.text != null) return "Text edit";
  if (patch.hidden != null) return patch.hidden ? "Hide" : "Restore";
  if (patch.src != null) return "Media replaced";
  if (patch.fontFamily != null || patch.fontSize != null || patch.fontWeight != null || patch.lineHeight != null || patch.letterSpacing != null) {
    return "Font change";
  }
  if (patch.color != null) return "Color change";
  if (patch.offsetX != null || patch.offsetY != null || patch.layoutShiftY != null) return "Move";
  if (patch.widthPct != null || patch.maxWidth != null || patch.textWidth != null) return "Resize";
  if (patch.caption != null || patch.alt != null) return "Caption edit";
  if (patch.link != null) return "Link change";
  if (patch.objectFit != null || patch.objectPositionX != null || patch.objectPositionY != null) return "Crop change";
  return "Edit";
}

/**
 * Single global editor store — overrides are keyed by self-describing IDs
 * (project.<slug>.<role>, connect.<role>, ...) so one draft/undo/save flow
 * covers every page Design Mode can reach, not just one pilot project. Media
 * additions (new blocks) share the same draft/undo/save lifecycle as
 * overrides — one history stack, one draft, one Save action for both.
 */
export function useDesignStore(saved: DraftState) {
  const [hasDraftPrompt, setHasDraftPrompt] = useState(false);
  const [working, setWorking] = useState<DraftState>(() => clone(saved));
  const [mode, setMode] = useState<InteractionMode>("navigate");
  const [device, setDevice] = useState<DevicePreset>("desktop");
  const [selection, setSelection] = useState<ElementSnapshot | null>(null);
  const past = useRef<{ state: DraftState; label: string }[]>([]);
  const future = useRef<{ state: DraftState; label: string }[]>([]);
  const group = useRef<{ key: string; expires: number } | null>(null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DraftState;
        if (JSON.stringify(parsed) !== JSON.stringify(saved)) {
          setHasDraftPrompt(true);
          return;
        }
      } catch {
        /* ignore malformed draft */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasDraftPrompt) return;
    const unsaved = JSON.stringify(working) !== JSON.stringify(saved);
    if (unsaved) localStorage.setItem(DRAFT_KEY, JSON.stringify(working));
    else localStorage.removeItem(DRAFT_KEY);
  }, [working, saved, hasDraftPrompt]);

  const resumeDraft = useCallback(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        setWorking(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    setHasDraftPrompt(false);
  }, []);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setWorking(clone(saved));
    setHasDraftPrompt(false);
    past.current = [];
    future.current = [];
    group.current = null;
  }, [saved]);

  /**
   * All mutations funnel through here. `groupKey`, when given, lets rapid
   * successive calls (typing into a field, dragging a slider) collapse into
   * the single history entry that was open when the group started, instead
   * of pushing one entry per call. A new key, or a pause longer than
   * GROUP_WINDOW_MS, starts a fresh entry.
   */
  const mutate = useCallback((updater: (prev: DraftState) => DraftState, label: string, groupKey?: string) => {
    setWorking((prev) => {
      const now = Date.now();
      const sameGroup = groupKey && group.current && group.current.key === groupKey && group.current.expires > now;
      if (!sameGroup) {
        past.current.push({ state: prev, label });
        future.current = [];
      }
      if (groupKey) group.current = { key: groupKey, expires: now + GROUP_WINDOW_MS };
      else group.current = null;
      forceRender((t) => t + 1);
      return updater(prev);
    });
  }, []);

  const patchElement = useCallback(
    (id: string, scope: Scope, patch: ElementOverride) => {
      mutate(
        (prev) => ({
          ...prev,
          overrides: { ...prev.overrides, [id]: { ...prev.overrides[id], [scope]: { ...prev.overrides[id]?.[scope], ...patch } } },
        }),
        labelFor(patch),
        `${id}:${scope}`,
      );
    },
    [mutate],
  );

  const nudgeOrDrag = useCallback(
    (id: string, scope: Scope, kind: MoveKind, dx: number, dy: number) => {
      mutate(
        (prev) => {
          const current = prev.overrides[id]?.[scope] ?? {};
          const patch: ElementOverride =
            kind === "layout"
              ? { layoutShiftY: (current.layoutShiftY ?? 0) + dy }
              : { offsetX: (current.offsetX ?? 0) + dx, offsetY: (current.offsetY ?? 0) + dy };
          return {
            ...prev,
            overrides: { ...prev.overrides, [id]: { ...prev.overrides[id], [scope]: { ...prev.overrides[id]?.[scope], ...patch } } },
          };
        },
        "Move",
        `${id}:${scope}:move`,
      );
    },
    [mutate],
  );

  const setText = useCallback((id: string, text: string) => patchElement(id, "base", { text }), [patchElement]);
  const setHidden = useCallback((id: string, hidden: boolean) => patchElement(id, "base", { hidden }), [patchElement]);

  const resetElement = useCallback(
    (id: string) => {
      mutate((prev) => {
        if (!(id in prev.overrides)) return prev;
        const next = { ...prev.overrides };
        delete next[id];
        return { ...prev, overrides: next };
      }, "Reset");
    },
    [mutate],
  );

  const addMedia = useCallback(
    (slug: string, entry: AddedMediaEntry) => {
      mutate((prev) => ({
        ...prev,
        media: { ...prev.media, [slug]: [...(prev.media[slug] ?? []), entry] },
      }), "Add media");
    },
    [mutate],
  );

  const patchMedia = useCallback(
    (slug: string, id: string, patch: Partial<AddedMediaEntry>, label = "Edit media") => {
      mutate((prev) => {
        const list = prev.media[slug] ?? [];
        return {
          ...prev,
          media: { ...prev.media, [slug]: list.map((m) => (m.id === id ? { ...m, ...patch } : m)) },
        };
      }, label, `media:${slug}:${id}`);
    },
    [mutate],
  );

  const removeMedia = useCallback(
    (slug: string, id: string) => {
      mutate((prev) => ({
        ...prev,
        media: { ...prev.media, [slug]: (prev.media[slug] ?? []).filter((m) => m.id !== id) },
      }), "Remove media");
    },
    [mutate],
  );

  /** Sets a project's full gallery display order (hand-authored and added
      media alike) — the Reorder drag handle's endpoint. Distinct from
      `reorderMedia` below, which only swaps Design-Mode-added blocks
      relative to each other via the sidebar's Up/Down buttons. */
  const setMediaOrder = useCallback(
    (slug: string, order: string[]) => {
      mutate(
        (prev) => ({ ...prev, mediaOrder: { ...prev.mediaOrder, [slug]: order } }),
        "Reorder",
        `media-order:${slug}`,
      );
    },
    [mutate],
  );

  /** Swaps an added block with its earlier/later sibling among *other added
      blocks anchored to the same point* — existing hand-authored media stays
      exactly where it is; this only reorders Design-Mode-added ones relative
      to each other. */
  const reorderMedia = useCallback(
    (slug: string, id: string, direction: "up" | "down") => {
      mutate((prev) => {
        const list = prev.media[slug] ?? [];
        const i = list.findIndex((m) => m.id === id);
        if (i === -1) return prev;
        const j = direction === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) return prev;
        const next = [...list];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...prev, media: { ...prev.media, [slug]: next } };
      }, "Reorder media");
    },
    [mutate],
  );

  const undo = useCallback(() => {
    setWorking((current) => {
      const prev = past.current.pop();
      if (prev === undefined) return current;
      future.current.push({ state: current, label: prev.label });
      group.current = null;
      forceRender((t) => t + 1);
      return prev.state;
    });
  }, []);

  const redo = useCallback(() => {
    setWorking((current) => {
      const next = future.current.pop();
      if (next === undefined) return current;
      past.current.push({ state: current, label: next.label });
      group.current = null;
      forceRender((t) => t + 1);
      return next.state;
    });
  }, []);

  const hiddenIds = Object.entries(working.overrides)
    .filter(([, scoped]) => scoped.base?.hidden)
    .map(([id]) => id);

  const isDirty = JSON.stringify(working) !== JSON.stringify(saved);

  return {
    mode,
    setMode,
    device,
    setDevice,
    deviceScope: scopeForDevice(device),
    selection,
    setSelection,
    working,
    patchElement,
    nudgeOrDrag,
    setText,
    setHidden,
    resetElement,
    addMedia,
    patchMedia,
    removeMedia,
    reorderMedia,
    setMediaOrder,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    undoLabel: past.current.length > 0 ? past.current[past.current.length - 1].label : undefined,
    redoLabel: future.current.length > 0 ? future.current[future.current.length - 1].label : undefined,
    hiddenIds,
    isDirty,
    hasDraftPrompt,
    resumeDraft,
    discardDraft,
    markSaved: (savedState: DraftState) => {
      localStorage.removeItem(DRAFT_KEY);
      setWorking(clone(savedState));
      past.current = [];
      future.current = [];
      group.current = null;
    },
  };
}
