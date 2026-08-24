import { useEffect, useRef, useState } from "react";
import designOverrides from "@/lib/design-overrides.json";
import designMediaAdditions from "@/lib/design-media-additions.json";
import designMediaOrder from "@/lib/design-media-order.json";
import type { DesignOverridesFile } from "@/lib/design-overrides.types";
import type { AddedMediaEntry, MediaAdditionsFile, MediaLayout, MediaOrderFile } from "@/lib/media-additions.types";
import { useDesignStore, type DevicePreset, type DraftState } from "./use-design-store";
import { DESIGN_BRIDGE_SOURCE, isDesignMessage, type FrameToParent, type InteractionMode } from "./protocol";
import { PropertyPanel } from "./PropertyPanel";
import { uploadMediaFile, mediaTypeFor, type StagedUpload } from "./media-client";

const PAGES: { label: string; url: string; slug?: string }[] = [
  { label: "Home", url: "/" },
  { label: "Lollapalooza", url: "/work/production-scenic/lollapalooza", slug: "lollapalooza" },
  { label: "You Can't Take It With You!", url: "/work/production-scenic/you-cant-take-it-with-you", slug: "you-cant-take-it-with-you" },
  { label: "True West", url: "/work/production-scenic/true-west", slug: "true-west" },
  { label: "The Diary of Anne Frank", url: "/work/production-scenic/the-diary-of-anne-frank", slug: "the-diary-of-anne-frank" },
  { label: "Reshuffling the Deck", url: "/work/production-scenic/reshuffling-the-deck", slug: "reshuffling-the-deck" },
  { label: "TaB: Renaissance", url: "/work/production-scenic/tab-renaissance", slug: "tab-renaissance" },
  { label: "Field House", url: "/work/architecture/field-house", slug: "field-house" },
  { label: "Townhouse", url: "/work/architecture/townhouse", slug: "townhouse" },
  { label: "The Exchange Facility", url: "/work/architecture/the-exchange-facility", slug: "the-exchange-facility" },
  { label: "Staging Aesthetics", url: "/work/architecture/staging-aesthetics", slug: "staging-aesthetics" },
  { label: "Renderings", url: "/work/visualizations/renderings", slug: "renderings" },
  { label: "Construction Drafting", url: "/work/visualizations/construction-drafting", slug: "construction-drafting" },
  { label: "Physical Models", url: "/work/visualizations/physical-models", slug: "physical-models" },
  { label: "Illustration", url: "/work/visualizations/illustration", slug: "illustration" },
  { label: "Connect", url: "/contact" },
];

const MODES: { id: InteractionMode; label: string }[] = [
  { id: "navigate", label: "Navigate" },
  { id: "edit", label: "Edit" },
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

function newMediaId(): string {
  return `media-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function DesignShell() {
  const [page, setPage] = useState(PAGES[0]);
  const savedDraft: DraftState = {
    overrides: designOverrides as DesignOverridesFile,
    media: designMediaAdditions as MediaAdditionsFile,
    mediaOrder: designMediaOrder as MediaOrderFile,
  };
  const store = useDesignStore(savedDraft);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publish, setPublish] = useState<PublishStatus>({ phase: "idle" });
  const [addMediaOpen, setAddMediaOpen] = useState(false);

  const postToFrame = (msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
  };

  useEffect(() => {
    postToFrame({ source: DESIGN_BRIDGE_SOURCE, type: "setInteractionMode", interactionMode: store.mode });
  }, [store.mode]);

  // The single source of truth for what the canvas renders. Undo, Redo,
  // Discard Draft, Resume Draft, and every media add/replace/reorder all
  // replace `store.working` wholesale without knowing which individual
  // fields changed — mirroring the whole thing into the iframe on every
  // change (rather than only echoing individually-patched fields) is what
  // makes all of those actually visible in the canvas.
  useEffect(() => {
    postToFrame({
      source: DESIGN_BRIDGE_SOURCE,
      type: "syncState",
      overrides: store.working.overrides,
      media: store.working.media,
      mediaOrder: store.working.mediaOrder,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.working]);

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
      } else if (msg.type === "requestUndo") {
        store.undo();
      } else if (msg.type === "requestRedo") {
        store.redo();
      } else if (msg.type === "reorderMedia") {
        store.setMediaOrder(msg.slug, msg.order);
      } else if (msg.type === "deleteSelected") {
        deleteSelectedMedia();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.mode, store.selection]);

  // Shortcuts for when focus is in the shell itself (toolbar, property
  // panel) — key events from inside the canvas iframe are a separate
  // document and arrive as "requestUndo"/"requestRedo" messages instead.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const typing = target?.isContentEditable || target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (typing) return;
      if (mod && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (e.ctrlKey && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        store.redo();
        return;
      }
      // Keyboard delete for the selected image — only fires when focus is in
      // the shell itself (toolbar, property panel) and never while typing;
      // the equivalent for focus inside the canvas iframe is wired in
      // inner-frame-bridge.tsx and arrives as a "deleteSelected" message.
      if ((e.key === "Delete" || e.key === "Backspace") && store.mode === "edit" && store.selection?.kind === "image") {
        e.preventDefault();
        deleteSelectedMedia();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.mode, store.selection]);

  const save = async () => {
    setSaving("saving");
    try {
      const res = await fetch("/__design-mode/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          overrides: store.working.overrides,
          media: store.working.media,
          mediaOrder: store.working.mediaOrder,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        overrides: DesignOverridesFile;
        media: MediaAdditionsFile;
        mediaOrder: MediaOrderFile;
      };
      // The server may have rewritten staged src paths to their approved
      // /design-media/... location — adopt that as the new saved baseline
      // rather than the pre-save draft, or the next edit's Undo could step
      // back to a staged path that no longer exists.
      store.markSaved({ overrides: data.overrides, media: data.media, mediaOrder: data.mediaOrder });
      setSaving("saved");
      if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
      setTimeout(() => setSaving("idle"), 2000);
    } catch (err) {
      setSaving("error");
      window.alert(`Save failed: ${(err as Error).message}`);
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

  // Added media (uploaded through Design Mode) can be structurally removed
  // outright — its whole entry, caption included, is one object, so Undo
  // restores it exactly as it was. Hand-authored media (from projects.ts)
  // can't be spliced out of the source data, so "delete" there reuses the
  // existing Hide flag — Undo un-hides it, which preserves everything
  // (order, offsets, caption) since nothing was actually removed.
  const deleteSelectedMedia = () => {
    const sel = store.selection;
    if (!sel?.media) return;
    if (sel.media.addedByDesignMode && sel.media.mediaId && page.slug) {
      store.removeMedia(page.slug, sel.media.mediaId);
    } else {
      store.setHidden(sel.id, true);
    }
    store.setSelection(null);
  };

  const replaceSelectedMedia = async (file: File) => {
    const sel = store.selection;
    if (!sel?.media) return;
    try {
      const staged = await uploadMediaFile(file);
      if (sel.media.addedByDesignMode && sel.media.mediaId && page.slug) {
        store.patchMedia(page.slug, sel.media.mediaId, { src: staged.url, filename: staged.filename }, "Media replaced");
      } else {
        store.patchElement(sel.id, "base", { src: staged.url });
      }
    } catch (err) {
      window.alert((err as Error).message);
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
  const inCanvasChrome = store.mode !== "navigate";
  const selMedia = store.selection?.media;

  return (
    <div style={styles.root}>
      {/* The toolbar stays visible in both modes — Navigate included — so
          switching back to Edit is never a dead end. */}
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
          <button
            style={{ ...styles.btn, opacity: store.canUndo ? 1 : 0.4, cursor: store.canUndo ? "pointer" : "default" }}
            onClick={store.undo}
            disabled={!store.canUndo}
            title="Ctrl/Cmd+Z"
          >
            {store.canUndo ? `Undo ${store.undoLabel}` : "Undo"}
          </button>
          <button
            style={{ ...styles.btn, opacity: store.canRedo ? 1 : 0.4, cursor: store.canRedo ? "pointer" : "default" }}
            onClick={store.redo}
            disabled={!store.canRedo}
            title="Ctrl/Cmd+Shift+Z"
          >
            {store.canRedo ? `Redo ${store.redoLabel}` : "Redo"}
          </button>
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

            {page.slug && (
              <div style={styles.panelSection}>
                <div style={styles.panelHeading}>Media</div>
                <button style={styles.btn} onClick={() => setAddMediaOpen(true)}>+ Add Media</button>
                {(store.working.media[page.slug] ?? []).length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    {(store.working.media[page.slug] ?? []).map((m) => {
                      const invalid = m.type === "image" && !m.decorative && !m.alt?.trim() && !m.caption?.trim();
                      return (
                      <div key={m.id} style={styles.hiddenItem}>
                        <span style={{ wordBreak: "break-all", fontSize: 11 }}>
                          {invalid && <span title="Missing caption, alt text, or Decorative — Save will fail" style={{ color: "#ffb84f" }}>⚠ </span>}
                          {m.filename ?? m.id} ({m.layout})
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={styles.linkBtn} onClick={() => store.reorderMedia(page.slug!, m.id, "up")}>↑</button>
                          <button style={styles.linkBtn} onClick={() => store.reorderMedia(page.slug!, m.id, "down")}>↓</button>
                          <button style={styles.linkBtn} onClick={() => store.removeMedia(page.slug!, m.id)}>Remove</button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
              // The "desktop" scope this canvas edits isn't just a label —
              // designModeStyleTag() emits a real `@media (min-width:768px)`
              // rule, the exact same one the live site itself uses, and the
              // iframe's own physical width is what that query is evaluated
              // against. With the page sidebar + property panel open, the
              // canvas area can easily be narrower than 768px even at a
              // normal laptop window size, which silently made every
              // "desktop"-scoped edit (including font family/size) apply to
              // a media query that never matched anything on screen — not a
              // font-loading bug, a viewport-mismatch bug. Forcing a 768px
              // floor (with horizontal scroll on `canvasArea` as the
              // fallback on a narrow window) guarantees Desktop-mode edits
              // are always previewed at a width where the desktop query is
              // actually in effect.
              // A couple of px above the 768 breakpoint itself, not exactly
              // on it — the wrapper's own 1px border eats into the iframe's
              // content width, and landing exactly on the boundary is the
              // one width where the query silently fails again.
              minWidth: store.device === "iphone" ? undefined : 772,
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
            {selMedia && (
              <div style={styles.panelSection}>
                <div style={styles.muted}>
                  Drag the grip handle to reorder, or the vertical-arrows
                  handle to offset within a side-by-side row — both appear on
                  the image itself once selected.
                </div>
              </div>
            )}

            {selMedia && (
              <div style={styles.panelSection}>
                <div style={styles.panelHeading}>Media</div>
                <img src={selMedia.src} alt="" style={{ width: "100%", borderRadius: 6, marginBottom: 8, background: "#000" }} />
                <div style={styles.inspectorRow}><span>Role</span><span>{selMedia.role}</span></div>
                <div style={styles.inspectorRow}><span>Project</span><span>{selMedia.project || "—"}</span></div>
                <div style={styles.inspectorRow}><span>ID</span><span style={{ wordBreak: "break-all" }}>{store.selection?.id}</span></div>
                <div style={styles.inspectorRow}><span>Source</span><span style={{ wordBreak: "break-all" }}>{selMedia.src}</span></div>
                <div style={styles.inspectorRow}><span>Filename</span><span>{selMedia.filename}</span></div>
                {selMedia.layout && <div style={styles.inspectorRow}><span>Layout</span><span>{selMedia.layout}</span></div>}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <label style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) replaceSelectedMedia(f);
                        e.target.value = "";
                      }}
                      id="replace-media-input"
                    />
                    <span
                      style={{ ...styles.btn, display: "block", textAlign: "center", cursor: "pointer" }}
                      onClick={() => document.getElementById("replace-media-input")?.click()}
                    >
                      Replace Image
                    </span>
                  </label>
                  <button
                    style={{ ...styles.btn, flex: 1, color: "#ff8f8f", border: "1px solid #4a2a2a" }}
                    onClick={deleteSelectedMedia}
                    title="Delete key / Backspace also works while an image is selected"
                  >
                    Delete Image
                  </button>
                </div>
                {selMedia.addedByDesignMode && selMedia.layout && selMedia.mediaId && page.slug && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <button
                      style={{ ...styles.chip, ...(selMedia.layout === "full" ? styles.chipActive : {}) }}
                      onClick={() => store.patchMedia(page.slug!, selMedia.mediaId!, { layout: "full" }, "Layout change")}
                    >
                      Full Width
                    </button>
                    <button
                      style={{ ...styles.chip, ...(selMedia.layout === "half" ? styles.chipActive : {}) }}
                      onClick={() => store.patchMedia(page.slug!, selMedia.mediaId!, { layout: "half" }, "Layout change")}
                    >
                      Half Width
                    </button>
                  </div>
                )}

                {selMedia.addedByDesignMode && selMedia.mediaId && page.slug && (
                  <div style={{ marginTop: 12 }}>
                    <label style={styles.fieldLabel}>Caption</label>
                    <textarea
                      style={styles.textarea}
                      rows={2}
                      value={selMedia.caption ?? ""}
                      onChange={(e) =>
                        store.patchMedia(page.slug!, selMedia.mediaId!, { caption: e.target.value || undefined }, "Caption edit")
                      }
                    />
                    {selMedia.type === "image" && (
                      <>
                        <label style={styles.fieldLabel}>
                          Alt text {selMedia.decorative ? "(skipped — decorative)" : "(required unless decorative)"}
                        </label>
                        <input
                          style={styles.input}
                          value={selMedia.alt ?? ""}
                          disabled={selMedia.decorative}
                          onChange={(e) =>
                            store.patchMedia(page.slug!, selMedia.mediaId!, { alt: e.target.value || undefined }, "Alt text edit")
                          }
                        />
                        <label style={{ ...styles.fieldLabel, display: "flex", alignItems: "center", gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={!!selMedia.decorative}
                            onChange={(e) =>
                              store.patchMedia(
                                page.slug!,
                                selMedia.mediaId!,
                                { decorative: e.target.checked, alt: e.target.checked ? undefined : selMedia.alt },
                                "Decorative toggle",
                              )
                            }
                          />
                          Decorative (no meaningful content — skip alt text)
                        </label>
                        {!selMedia.decorative && !selMedia.alt?.trim() && !selMedia.caption?.trim() && (
                          <p style={{ color: "#ffb84f", fontSize: 12, marginTop: 4 }}>
                            This image needs a caption, alt text, or "Decorative" checked before Save will accept it.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <PropertyPanel
              selection={store.selection}
              working={store.working.overrides}
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

      {addMediaOpen && page.slug && (
        <AddMediaModal
          slug={page.slug}
          insertAfterId={store.selection?.media && !store.selection.media.addedByDesignMode ? store.selection.id : undefined}
          onClose={() => setAddMediaOpen(false)}
          onAdd={(entry) => {
            store.addMedia(page.slug!, entry);
            setAddMediaOpen(false);
          }}
        />
      )}

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

function AddMediaModal({
  slug,
  insertAfterId,
  onClose,
  onAdd,
}: {
  slug: string;
  insertAfterId?: string;
  onClose: () => void;
  onAdd: (entry: AddedMediaEntry) => void;
}) {
  const [staged, setStaged] = useState<StagedUpload | null>(null);
  const [type, setType] = useState<"image" | "video">("image");
  const [layout, setLayout] = useState<MediaLayout>("full");
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [decorative, setDecorative] = useState(false);
  const [link, setLink] = useState("");
  const [placement, setPlacement] = useState<"end" | "after">(insertAfterId ? "after" : "end");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const result = await uploadMediaFile(file);
      setStaged(result);
      setType(mediaTypeFor(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const canAdd = staged && (type !== "image" || decorative || alt.trim() || caption.trim());

  return (
    <div style={styles.centerScreen} onClick={onClose}>
      <div style={{ ...styles.modal, width: 420 }} onClick={(e) => e.stopPropagation()}>
        <p style={{ fontWeight: 600, marginBottom: 12 }}>Add Media — {slug}</p>

        {!staged ? (
          <div
            style={styles.dropTarget}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
          >
            <p style={{ marginBottom: 8, color: "#aaa", fontSize: 12 }}>
              {uploading ? "Uploading…" : "Drop a .png, .jpg, .jpeg, or .mp4 here, or choose a file"}
            </p>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            {error && <p style={{ color: "#ff8f8f", fontSize: 12, marginTop: 8 }}>{error}</p>}
          </div>
        ) : (
          <>
            {type === "image" ? (
              <img src={staged.url} alt="" style={{ width: "100%", borderRadius: 6, marginBottom: 10, background: "#000" }} />
            ) : (
              <video src={staged.url} controls style={{ width: "100%", borderRadius: 6, marginBottom: 10, background: "#000" }} />
            )}

            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              <button style={{ ...styles.chip, flex: 1, ...(layout === "full" ? styles.chipActive : {}) }} onClick={() => setLayout("full")}>
                Full Width
              </button>
              <button style={{ ...styles.chip, flex: 1, ...(layout === "half" ? styles.chipActive : {}) }} onClick={() => setLayout("half")}>
                Half Width
              </button>
            </div>

            <label style={styles.fieldLabel}>Caption</label>
            <textarea style={styles.textarea} rows={2} value={caption} onChange={(e) => setCaption(e.target.value)} />

            {type === "image" && (
              <>
                <label style={styles.fieldLabel}>Alt text {decorative ? "(skipped — decorative)" : "(required)"}</label>
                <input style={styles.input} value={alt} onChange={(e) => setAlt(e.target.value)} disabled={decorative} />
                <label style={{ ...styles.fieldLabel, display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="checkbox" checked={decorative} onChange={(e) => setDecorative(e.target.checked)} />
                  Decorative (no meaningful content — skip alt text)
                </label>
              </>
            )}

            <label style={styles.fieldLabel}>Link (optional)</label>
            <input style={styles.input} placeholder="/work/... or https://…" value={link} onChange={(e) => setLink(e.target.value)} />

            {insertAfterId && (
              <div style={{ marginTop: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input type="radio" checked={placement === "after"} onChange={() => setPlacement("after")} />
                  Insert after the selected image
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <input type="radio" checked={placement === "end"} onChange={() => setPlacement("end")} />
                  Add at the end of the section
                </label>
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16, alignItems: "center" }}>
          <button
            style={{ ...styles.primaryBtn, ...(canAdd ? {} : styles.primaryBtnDisabled) }}
            disabled={!canAdd}
            onClick={() => {
              if (!staged) return;
              onAdd({
                id: newMediaId(),
                type,
                src: staged.url,
                caption: caption.trim() || undefined,
                alt: type === "image" ? (decorative ? undefined : alt.trim() || undefined) : undefined,
                decorative: type === "image" ? decorative : undefined,
                layout,
                insertAfterId: placement === "after" ? insertAfterId : undefined,
                link: link.trim() || undefined,
                filename: staged.filename,
              });
            }}
          >
            Add to Page
          </button>
          <button style={styles.btn} onClick={onClose}>Cancel</button>
        </div>
        {staged && !canAdd && (
          <p style={{ color: "#ffb84f", fontSize: 12, marginTop: 8 }}>
            Add a caption, alt text, or check "Decorative" to enable Add to Page.
          </p>
        )}
      </div>
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
  primaryBtnDisabled: { background: "#33415c", color: "#8a94a6", cursor: "not-allowed" },
  badge: { fontSize: 11, color: "#9fb8ff", border: "1px solid #33456f", padding: "3px 8px", borderRadius: 999 },
  unsavedDot: { width: 8, height: 8, borderRadius: "50%", background: "#ffb84f", display: "inline-block" },
  body: { flex: 1, display: "flex", minHeight: 0 },
  leftPanel: { width: 240, borderRight: "1px solid #222", padding: 12, overflowY: "auto" },
  rightPanel: { width: 300, borderLeft: "1px solid #222", padding: 12, overflowY: "auto" },
  canvasArea: { flex: 1, overflow: "auto", padding: 24, display: "flex" },
  panelSection: { marginBottom: 20 },
  panelHeading: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 8 },
  pageItem: { padding: "6px 8px", borderRadius: 6, fontSize: 12 },
  pageItemActive: { background: "#1a2a4a", color: "#9fb8ff" },
  muted: { color: "#666" },
  hiddenItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", gap: 8 },
  linkBtn: { background: "none", border: "none", color: "#4f8cff", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" },
  centerScreen: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", zIndex: 1000000 },
  modal: { background: "#1a1a1c", border: "1px solid #333", borderRadius: 8, padding: 24, color: "#eee", maxWidth: 420, maxHeight: "80vh", overflowY: "auto" },
  chip: { flex: 1, background: "#1a1a1c", color: "#aaa", border: "1px solid #333", borderRadius: 999, padding: "6px 8px", fontSize: 11, cursor: "pointer" },
  chipActive: { background: "#4f8cff", color: "#fff", borderColor: "#4f8cff" },
  publishBtn: { background: "#d9622b", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 600 },
  publishBtnDisabled: { background: "#4a352a", color: "#8a7565", cursor: "not-allowed" },
  fileList: { background: "#0f0f10", border: "1px solid #2a2a2a", borderRadius: 6, padding: 8, maxHeight: 160, overflowY: "auto" },
  log: { background: "#0f0f10", border: "1px solid #2a2a2a", borderRadius: 6, padding: 8, fontSize: 10, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto", marginBottom: 12 },
  inspectorRow: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, padding: "3px 0", borderBottom: "1px solid #1e1e1e" },
  dropTarget: { border: "1px dashed #444", borderRadius: 8, padding: 20, textAlign: "center" },
  fieldLabel: { display: "block", fontSize: 11, color: "#888", marginTop: 8, marginBottom: 4 },
  textarea: { width: "100%", background: "#0f0f10", color: "#eee", border: "1px solid #333", borderRadius: 6, padding: 6, fontSize: 12, resize: "vertical" as const },
  input: { width: "100%", background: "#0f0f10", color: "#eee", border: "1px solid #333", borderRadius: 6, padding: 6, fontSize: 12 },
};
