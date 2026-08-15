import { useCallback, useState } from "react";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";

/**
 * Holds this page's in-memory, unsaved Design Mode edits. Pure state, no
 * editor UI — safe for any route to import. Costs nothing in production:
 * nothing ever calls the setters outside `npm run design`, so the state
 * simply never changes.
 */
export function useLiveOverrides() {
  const [live, setLive] = useState<DesignOverridesFile>({});

  const onLocalPatch = useCallback((id: string, scope: Scope, patch: ElementOverride) => {
    setLive((prev) => ({
      ...prev,
      [id]: { ...prev[id], [scope]: { ...prev[id]?.[scope], ...patch } },
    }));
  }, []);

  const onLocalReset = useCallback((id: string) => {
    setLive((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return { live, onLocalPatch, onLocalReset };
}
