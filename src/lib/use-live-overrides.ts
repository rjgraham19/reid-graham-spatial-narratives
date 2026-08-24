import { useCallback, useState } from "react";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { MediaAdditionsFile, MediaOrderFile } from "@/lib/media-additions.types";

/**
 * Holds this page's in-memory, unsaved Design Mode edits — both property
 * overrides and added media blocks. Pure state, no editor UI — safe for any
 * route to import. Costs nothing in production: nothing ever calls the
 * setters outside `npm run design`, so the state simply never changes.
 */
export function useLiveOverrides() {
  const [live, setLive] = useState<DesignOverridesFile>({});
  const [liveMedia, setLiveMedia] = useState<MediaAdditionsFile>({});
  const [liveMediaOrder, setLiveMediaOrder] = useState<MediaOrderFile>({});

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

  /** Full replace — used to mirror the parent shell's authoritative working
      state after Undo/Redo/Discard/Resume/media changes, none of which know
      which individual fields changed, only the end result. */
  const onSyncAll = useCallback((overrides: DesignOverridesFile, media: MediaAdditionsFile, mediaOrder: MediaOrderFile) => {
    setLive(overrides);
    setLiveMedia(media);
    setLiveMediaOrder(mediaOrder);
  }, []);

  return { live, liveMedia, liveMediaOrder, onLocalPatch, onLocalReset, onSyncAll };
}
