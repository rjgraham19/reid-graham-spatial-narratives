/**
 * Typed postMessage protocol between the Design Mode shell (parent window,
 * `/design`) and the real page it iframes (same origin, dev-only). Kept
 * intentionally small — one message type per action, no generic "run this"
 * channel.
 */
import type { ElementOverride, Scope } from "@/lib/design-overrides.types";

export const DESIGN_BRIDGE_SOURCE = "reid-portfolio-design-mode";

export type SelectionKind = "heading" | "text" | "image";

export type ElementSnapshot = {
  id: string;
  kind: SelectionKind;
  text?: string;
  caption?: string;
  rect: { top: number; left: number; width: number; height: number };
};

/** Only three real modes now — Browse, Content, Arrange. */
export type InteractionMode = "browse" | "content" | "arrange";

export type MoveKind = "free" | "layout";

export type ParentToFrame =
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "init"; interactionMode: InteractionMode }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "setInteractionMode"; interactionMode: InteractionMode }
  /** Authoritative patch echoed back after the parent store commits it — keeps
      every instance of that ID in the iframe (e.g. a caption shown twice) in sync. */
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "applyOverride"; id: string; scope: Scope; patch: ElementOverride }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "resetElement"; id: string }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "setMoveKind"; moveKind: MoveKind }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "clearSelection" };

export type FrameToParent =
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "ready" }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "select"; snapshot: ElementSnapshot }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "deselect" }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "textCommitted"; id: string; text: string }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "moved"; id: string; scope: Scope; kind: MoveKind; dx: number; dy: number }
  | { source: typeof DESIGN_BRIDGE_SOURCE; type: "unmapped"; role: string };

export function isDesignMessage(data: unknown): data is ParentToFrame | FrameToParent {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === DESIGN_BRIDGE_SOURCE
  );
}
