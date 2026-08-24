/**
 * Typed postMessage protocol between the Design Mode shell (parent window,
 * `/design`) and the real page it iframes (same origin, dev-only). Kept
 * intentionally small — one message type per action, no generic "run this"
 * channel.
 */
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { MediaAdditionsFile } from "@/lib/media-additions.types";

export const DESIGN_BRIDGE_SOURCE = "reid-portfolio-design-mode";

export type SelectionKind = "heading" | "text" | "image";

export type ElementSnapshot = {
  id: string;
  kind: SelectionKind;
  text?: string;
  caption?: string;
  rect: { top: number; left: number; width: number; height: number };
  /** Present for images/video — the media inspector reads these. */
  media?: {
    role: string;
    project: string;
    src: string;
    filename: string;
    alt?: string;
    caption?: string;
    type?: "image" | "video";
    decorative?: boolean;
    link?: string;
    layout?: "full" | "half";
    addedByDesignMode: boolean;
    /** Raw id inside the project's media-additions array — distinct from
        `id` above (the composed "project.<slug>.media.<rawId>" designId
        used for selection/overrides). store.patchMedia needs this exact
        raw id to find the entry; passing the composed id silently matches
        nothing. Only set for addedByDesignMode media. */
    mediaId?: string;
  };
};

/** Exactly two real modes — Navigate (the site behaves normally) and Edit
    (everything supported is selectable, with contextual controls). */
export type InteractionMode = "navigate" | "edit";

/** "layout" nudges the image's own row (Vertical Offset); "free" is an
    arbitrary transform offset (used for text placement). Chosen per-drag by
    which contextual handle was grabbed, not by a global mode toggle. */
export type MoveKind = "free" | "layout";

export type ParentToFrame =
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "init"; interactionMode: InteractionMode }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "setInteractionMode"; interactionMode: InteractionMode }
  /** Authoritative patch echoed back after the parent store commits it — keeps
      every instance of that ID in the iframe (e.g. a caption shown twice) in sync. */
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "applyOverride"; id: string; scope: Scope; patch: ElementOverride }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "resetElement"; id: string }
  /** Full replace of the frame's live state (overrides + media additions +
      media order) with the parent's authoritative working state — the single
      source of truth for Undo/Redo/Discard/Resume/media-add/media-edit/
      reorder, none of which tell the frame which individual fields changed,
      only the end result. */
  | {
      source: typeof DESIGN_BRIDGE_SOURCE;
      type: "syncState";
      overrides: DesignOverridesFile;
      media: MediaAdditionsFile;
      mediaOrder: Record<string, string[]>;
    }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "clearSelection" };

export type FrameToParent =
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "ready" }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "select"; snapshot: ElementSnapshot }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "deselect" }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "textCommitted"; id: string; text: string }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "moved"; id: string; scope: Scope; kind: MoveKind; dx: number; dy: number }
  /** Emitted when a Reorder-handle drag is dropped on a new position — carries
      the gallery's complete new id order for that project slug. */
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "reorderMedia"; slug: string; order: string[] }
  /** A selected image was removed via the Delete/Backspace key inside the canvas. */
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "deleteSelected" }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "unmapped"; role: string }
  /** Ctrl/Cmd+Z etc. pressed while focus is inside the canvas iframe — key
      events don't cross the iframe boundary, so the frame has to ask. */
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "requestUndo" }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "requestRedo" };

export function isDesignMessage(data: unknown): data is ParentToFrame | FrameToParent {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === DESIGN_BRIDGE_SOURCE
  );
}
