import { useEffect, useRef, useState } from "react";
import designOverrides from "@/lib/design-overrides.json";
import type { DesignOverridesFile } from "@/lib/design-overrides.types";
import { useDesignStore, type DevicePreset } from "./use-design-store";
import { DESIGN_BRIDGE_SOURCE, isDesignMessage, type FrameToParent, type InteractionMode, type MoveKind } from "./protocol";
import { PropertyPanel } from "./PropertyPanel";

const PAGES: { label: string; url: string }[] = [
  { label: "You Can't Take It With You!", url: "/work/production-scenic/you-cant-take-it-with-you" },
  { label: "True West", url: "/work/production-scenic/true-west" },
  { label: "The Diary of Anne Frank", url: "/work/production-scenic/the-diary-of-anne-frank" },
  { label: "Renderings (Visualizations)", url: "/work/visualizations/renderings" },
  { label: "Connect", url: "/contact" },
];

const MODES: { id: InteractionMode; label: string }[] = [
  { id: "browse", label: "Browse" },
  { id: "content", label: "Content" },
  { id: "arrange", label: "Arrange" },
];

const DEVICE_SIZE: Record<DevicePreset, { width: number; height: string }> = {
  iphone: { width: 390, height: "844px" },
  desktop: { width: 1280, height: "100%" },
};

type PublishStatus =
  | { phase: "idle" }
  | { phase: "confirming"; branch: string; files: string[] }
  | { phase: "publishing" }
  | { phase: "done"; ok: boolean; message: string; log?: string };

export default function DesignShell() {
  const [page, setPage] = useState(PAGES[0]);
  const savedOverrides = designOverrides as DesignOverridesFile;
  const store = useDesignStore(savedOverrides);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [moveKind, setMoveKind] = useState<MoveKind>("layout");
  const [publish, setPublish] = useState<PublishStatus>({ phase: "idle" });

  const postToFrame = (msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  };

  useEffect(() => {
    postToFrame({ source: DESIGN_BRIDGE_SOURCE, type: "setInteractionMode", interactionMode: store.mode });
  }, [store.mode]);

  useEffect(() => {
    postToFrame({ source: DESIGN_BRIDGE_SOURCE, type: "setMoveKind", moveKind });
  }, [moveKind]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || !isDesignMessage(e.data)) return;
      const msg = e.data as FrameToParent;
      if (msg.type === "ready") {
        postToFrame({ source: DESIGN_BRIDGE_SOURCE, type: "init", interactionMode: store.mode });
      } else if (msg.type === "select") {
        store.setSelection(msg.snapshot);
      } else if (msg.type === "deselect") {
        store.setSelection(null);
      } else if (msg.type === "textCommitted") {
        store.setText(msg.id, msg.text);
      } else if (msg.type === "moved") {
        store.nudgeOrDrag(msg.id, msg.scope, msg.kind, msg.dx, msg.dy);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.mode]);

  const save = async () => {
    setSaving("saving");
    try {
      const res = await fetch("/__design-mode/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ overrides: store.working }),
      });
      if (!res.ok) throw new Error(await res.text());
      store.markSaved(store.working);
      setSaving("saved");
      // The site reads design-overrides.json at module load; reload the
      // frame so it re-fetches the file that was just written, proving the
      // saved values (not just the live in-memory preview) render.
      if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
      setTimeout(() => setSaving("idle"), 2000);
    } catch {
      setSaving("error");
    }
  };

  const openPublishConfirm = async () => {
    try {
      const res = await fetch("/__design-mode/git-status");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { branch: string; files: string[] };
      if (data.files.length === 0) {
        setPublish({ phase: "done", ok: true, message: "Nothing to publish — working tree is clean." });
        return;
      }
      setPublish({ phase: "confirming", branch: data.branch, files: data.files });
    } catch (err) {
      setPublish({ phase: "done", ok: false, message: `Couldn't check git status: ${(err as Error).message}` });
    }
  };

  const confirmPublish = async () => {
    setPublish({ phase: "publishing" });
    try {
      const res = await fetch("/__design-mode/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Design Mode: approved changes" }),
      });
      const data = (await res.json()) as { ok: boolean; message: string; log?: string };
      setPublish({ phase: "done", ok: data.ok, message: data.message, log: data.log });
    } catch (err) {
      setPublish({ phase: "done", ok: false, message: `Publish failed: ${(err as Error).message}` });
    }
  };

  if (store.hasDraftPrompt) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.modal}>
          <p style={{ marginBottom: 16 }}>
            You have unsaved Design Mode changes from a previous session.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.primaryBtn} onClick={store.resumeDraft}>Resume Draft</button>
            <button style={styles.btn} onClick={store.discardDraft}>Discard Draft</button>
          </div>
        </div>
      </div>
    );
  }

  const size = DEVICE_SIZE[store.device];
  const inCanvasChrome = store.mode !== "browse";

  return (
    <div style={styles.root}>
      {/* The toolbar stays visible in all three modes — Browse included —
          so switching back to Content or Arrange is never a dead end. */}
      <header style={styles.toolbar}>
        <div style={styles.toolbarGroup}>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => store.setMode(m.id)}
              style={{ ...styles.tab, ...(store.mode === m.id ? styles.tabActive : {}) }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={styles.toolbarGroup}>
          <button style={styles.btn} onClick={() => store.setDevice("iphone")} disabled={store.device === "iphone"}>
            iPhone
          </button>
          <button style={styles.btn} onClick={() => store.setDevice("desktop")} disabled={store.device === "desktop"}>
            Desktop
          </button>
          <span style={styles.badge}>
            Editing: {store.deviceScope === "mobile" ? "Mobile" : "Desktop"}
          </span>
        </div>

        <div style={styles.toolbarGroup}>
          <button style={styles.btn} onClick={store.undo} disabled={!store.canUndo}>Undo</button>
          <button style={styles.btn} onClick={store.redo} disabled={!store.canRedo}>Redo</button>
          {store.isDirty && <span style={styles.unsavedDot} title="Unsaved changes" />}
          <button style={styles.primaryBtn} onClick={save} disabled={saving === "saving"}>
            {saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : "Save Approved Changes"}
          </button>
          {/* Deliberately separate from Save, in a different color, with its
              own confirmation — this is the only action that pushes to
              GitHub and triggers a live Cloudflare deploy. */}
          <button
            style={{ ...styles.publishBtn, ...(store.isDirty ? styles.publishBtnDisabled : {}) }}
            onClick={openPublishConfirm}
            disabled={store.isDirty}
            title={store.isDirty ? "Save Approved Changes first" : "Push to GitHub and deploy"}
          >
            Publish to Live Site
          </button>
        </div>
      </header>

      <div style={styles.body}>
        {inCanvasChrome && (
          <aside style={styles.leftPanel}>
            <div style={styles.panelSection}>
              <div style={styles.panelHeading}>Pages</div>
              {PAGES.map((p) => (
                <div
                  key={p.url}
                  onClick={() => setPage(p)}
                  style={{ ...styles.pageItem, ...(page.url === p.url ? styles.pageItemActive : {}), cursor: "pointer" }}
                >
                  {p.label}
                </div>
              ))}
            </div>
            <div style={styles.panelSection}>
              <div style={styles.panelHeading}>Deleted Items</div>
              {store.hiddenIds.length === 0 && (
                <div style={styles.muted}>Nothing hidden.</div>
              )}
              {store.hiddenIds.map((id) => (
                <div key={id} style={styles.hiddenItem}>
                  <span style={{ wordBreak: "break-all" }}>{id}</span>
                  <button style={styles.linkBtn} onClick={() => store.setHidden(id, false)}>
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main style={styles.canvasArea}>
          <div
            style={{
              width: store.device === "iphone" ? size.width : "100%",
              maxWidth: store.device === "iphone" ? size.width : 1280,
              height: store.device === "iphone" ? size.height : "100%",
              margin: "0 auto",
              border: store.device === "iphone" ? "8px solid #222" : "1px solid #333",
              borderRadius: store.device === "iphone" ? 24 : 4,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <iframe
              ref={iframeRef}
              src={page.url}
              title="Design Mode canvas"
              style={{ width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </main>

        {inCanvasChrome && (
          <aside style={styles.rightPanel}>
            {store.mode === "arrange" && store.selection?.kind === "image" && (
              <div style={styles.panelSection}>
                <div style={styles.panelHeading}>Move behaviour</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    style={{ ...styles.chip, ...(moveKind === "layout" ? styles.chipActive : {}) }}
                    onClick={() => setMoveKind("layout")}
                  >
                    Move with Layout
                  </button>
                  <button
                    style={{ ...styles.chip, ...(moveKind === "free" ? styles.chipActive : {}) }}
                    onClick={() => setMoveKind("free")}
                  >
                    Free Position
                  </button>
                </div>
              </div>
            )}
            <PropertyPanel
              selection={store.selection}
              working={store.working}
              deviceScope={store.deviceScope}
              onPatch={(id, scope, patch) => {
                store.patchElement(id, scope, patch);
                postToFrame({ source: DESIGN_BRIDGE_SOURCE, type: "applyOverride", id, scope, patch });
              }}
              onReset={(id) => {
                store.resetElement(id);
                postToFrame({ source: DESIGN_BRIDGE_SOURCE, type: "resetElement", id });
              }}
              onHide={(id) => {
                store.setHidden(id, true);
                postToFrame({ source: DESIGN_BRIDGE_SOURCE, type: "applyOverride", id, scope: "base", patch: { hidden: true } });
              }}
            />
          </aside>
        )}
      </div>

      {publish.phase === "confirming" && (
        <div style={styles.centerScreen}>
          <div style={styles.modal}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Publish to the live site?</p>
            <p style={{ marginBottom: 12, color: "#aaa" }}>
              This pushes branch <code>{publish.branch}</code> to GitHub, which triggers a live Cloudflare
              deploy within a minute or two. This affects the public website.
            </p>
            <p style={{ marginBottom: 6, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>
              {publish.files.length} file{publish.files.length === 1 ? "" : "s"} will be committed
            </p>
            <div style={styles.fileList}>
              {publish.files.map((f) => (
                <div key={f} style={{ fontFamily: "monospace", fontSize: 11 }}>{f}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button style={styles.publishBtn} onClick={confirmPublish}>Publish</button>
              <button style={styles.btn} onClick={() => setPublish({ phase: "idle" })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {publish.phase === "publishing" && (
        <div style={styles.centerScreen}>
          <div style={styles.modal}>
            <p>Publishing — committing and pushing to GitHub…</p>
          </div>
        </div>
      )}

      {publish.phase === "done" && (
        <div style={styles.centerScreen}>
          <div style={styles.modal}>
            <p style={{ marginBottom: 8, fontWeight: 600, color: publish.ok ? "#7cd992" : "#ff8f8f" }}>
              {publish.ok ? "Published" : "Publish failed"}
            </p>
            <p style={{ marginBottom: 12, color: "#ccc" }}>{publish.message}</p>
            {publish.log && (
              <pre style={styles.log}>{publish.log}</pre>
            )}
            <button style={styles.btn} onClick={() => setPublish({ phase: "idle" })}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { position: "fixed", inset: 0, background: "#0b0b0c", color: "#eee", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif", fontSize: 13, zIndex: 999999 },
  toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #222", gap: 16 },
  toolbarGroup: { display: "flex", alignItems: "center", gap: 8 },
  tab: { background: "transparent", color: "#aaa", border: "1px solid #333", borderRadius: 6, padding: "6px 12px", cursor: "pointer" },
  tabActive: { background: "#4f8cff", color: "#fff", borderColor: "#4f8cff" },
  btn: { background: "#1a1a1c", color: "#eee", border: "1px solid #333", borderRadius: 6, padding: "6px 10px", cursor: "pointer" },
  primaryBtn: { background: "#4f8cff", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer" },
  badge: { fontSize: 11, color: "#9fb8ff", border: "1px solid #33456f", padding: "3px 8px", borderRadius: 999 },
  unsavedDot: { width: 8, height: 8, borderRadius: "50%", background: "#ffb84f", display: "inline-block" },
  body: { flex: 1, display: "flex", minHeight: 0 },
  leftPanel: { width: 240, borderRight: "1px solid #222", padding: 12, overflowY: "auto" },
  rightPanel: { width: 280, borderLeft: "1px solid #222", padding: 12, overflowY: "auto" },
  canvasArea: { flex: 1, overflow: "auto", padding: 24, display: "flex" },
  panelSection: { marginBottom: 20 },
  panelHeading: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 8 },
  pageItem: { padding: "6px 8px", borderRadius: 6, fontSize: 12 },
  pageItemActive: { background: "#1a2a4a", color: "#9fb8ff" },
  muted: { color: "#666" },
  hiddenItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", gap: 8 },
  linkBtn: { background: "none", border: "none", color: "#4f8cff", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
  centerScreen: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", zIndex: 1000000 },
  modal: { background: "#1a1a1c", border: "1px solid #333", borderRadius: 8, padding: 24, color: "#eee", maxWidth: 420, maxHeight: "70vh", overflowY: "auto" },
  chip: { flex: 1, background: "#1a1a1c", color: "#aaa", border: "1px solid #333", borderRadius: 999, padding: "6px 8px", fontSize: 11, cursor: "pointer" },
  chipActive: { background: "#4f8cff", color: "#fff", borderColor: "#4f8cff" },
  publishBtn: { background: "#d9622b", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 600 },
  publishBtnDisabled: { background: "#4a352a", color: "#8a7565", cursor: "not-allowed" },
  fileList: { background: "#0f0f10", border: "1px solid #2a2a2a", borderRadius: 6, padding: 8, maxHeight: 160, overflowY: "auto" },
  log: { background: "#0f0f10", border: "1px solid #2a2a2a", borderRadius: 6, padding: 8, fontSize: 10, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto", marginBottom: 12 },
};
