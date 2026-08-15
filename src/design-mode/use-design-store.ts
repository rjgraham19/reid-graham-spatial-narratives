import { useCallback, useEffect, useRef, useState } from "react";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { ElementSnapshot, InteractionMode, MoveKind } from "./protocol";

export type DevicePreset = "iphone" | "desktop";

const DRAFT_KEY = "design-draft";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function scopeForDevice(device: DevicePreset): Scope {
  return device === "iphone" ? "mobile" : "desktop";
}

/**
 * Single global editor store — overrides are keyed by self-describing IDs
 * (project.<slug>.<role>, connect.<role>, ...) so one draft/undo/save flow
 * covers every page Design Mode can reach, not just one pilot project.
 */
export function useDesignStore(savedOverrides: DesignOverridesFile) {
  const [hasDraftPrompt, setHasDraftPrompt] = useState(false);
  const [working, setWorking] = useState<DesignOverridesFile>(() => clone(savedOverrides));
  const [mode, setMode] = useState<InteractionMode>("browse");
  const [device, setDevice] = useState<DevicePreset>("desktop");
  const [selection, setSelection] = useState<ElementSnapshot | null>(null);
  const past = useRef<DesignOverridesFile[]>([]);
  const future = useRef<DesignOverridesFile[]>([]);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DesignOverridesFile;
        if (JSON.stringify(parsed) !== JSON.stringify(savedOverrides)) {
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
    const unsaved = JSON.stringify(working) !== JSON.stringify(savedOverrides);
    if (unsaved) localStorage.setItem(DRAFT_KEY, JSON.stringify(working));
    else localStorage.removeItem(DRAFT_KEY);
  }, [working, savedOverrides, hasDraftPrompt]);

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
    setWorking(clone(savedOverrides));
    setHasDraftPrompt(false);
  }, [savedOverrides]);

  const commit = useCallback((next: DesignOverridesFile) => {
    setWorking((prev) => {
      past.current.push(prev);
      future.current = [];
      forceRender((t) => t + 1);
      return next;
    });
  }, []);

  const patchElement = useCallback(
    (id: string, scope: Scope, patch: ElementOverride) => {
      setWorking((prev) => {
        past.current.push(prev);
        future.current = [];
        forceRender((t) => t + 1);
        return { ...prev, [id]: { ...prev[id], [scope]: { ...prev[id]?.[scope], ...patch } } };
      });
    },
    [],
  );

  const nudgeOrDrag = useCallback(
    (id: string, scope: Scope, kind: MoveKind, dx: number, dy: number) => {
      setWorking((prev) => {
        const current = prev[id]?.[scope] ?? {};
        const patch: ElementOverride =
          kind === "layout"
            ? { layoutShiftY: (current.layoutShiftY ?? 0) + dy }
            : { offsetX: (current.offsetX ?? 0) + dx, offsetY: (current.offsetY ?? 0) + dy };
        past.current.push(prev);
        future.current = [];
        forceRender((t) => t + 1);
        return { ...prev, [id]: { ...prev[id], [scope]: { ...prev[id]?.[scope], ...patch } } };
      });
    },
    [],
  );

  const setText = useCallback(
    (id: string, text: string) => patchElement(id, "base", { text }),
    [patchElement],
  );

  const setHidden = useCallback(
    (id: string, hidden: boolean) => patchElement(id, "base", { hidden }),
    [patchElement],
  );

  const resetElement = useCallback(
    (id: string) => {
      setWorking((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        past.current.push(prev);
        future.current = [];
        forceRender((t) => t + 1);
        return next;
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setWorking((current) => {
      const prev = past.current.pop();
      if (prev === undefined) return current;
      future.current.push(current);
      forceRender((t) => t + 1);
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setWorking((current) => {
      const next = future.current.pop();
      if (next === undefined) return current;
      past.current.push(current);
      forceRender((t) => t + 1);
      return next;
    });
  }, []);

  const hiddenIds = Object.entries(working)
    .filter(([, scoped]) => scoped.base?.hidden)
    .map(([id]) => id);

  const isDirty = JSON.stringify(working) !== JSON.stringify(savedOverrides);

  return {
    mode,
    setMode,
    device,
    setDevice,
    deviceScope: scopeForDevice(device),
    selection,
    setSelection,
    working,
    commit,
    patchElement,
    nudgeOrDrag,
    setText,
    setHidden,
    resetElement,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    hiddenIds,
    isDirty,
    hasDraftPrompt,
    resumeDraft,
    discardDraft,
    markSaved: (saved: DesignOverridesFile) => {
      localStorage.removeItem(DRAFT_KEY);
      setWorking(clone(saved));
      past.current = [];
      future.current = [];
    },
  };
}
