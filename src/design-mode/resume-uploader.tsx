import { useCallback, useRef, useState } from "react";
import { glassButton } from "@/components/glass-button";
import type { ResumeMeta } from "@/components/resume-viewer";

/**
 * Design Mode only — this whole module is behind an `import.meta.env.MODE
 * === "design"` gate in resume-viewer.tsx, so it's absent from `bun run dev`
 * and from every production build (Rollup never includes an unreachable
 * dynamic import branch). Drops a replacement PDF straight onto
 * public/resume.pdf via dev-resume-plugin.ts; publishing it still goes
 * through the normal git push deploy flow.
 */
export default function ResumeUploader({
  meta,
  onUpdated,
}: {
  meta: ResumeMeta;
  onUpdated: (meta: ResumeMeta) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") {
        setStatus("error");
        setError("Only PDF files are accepted.");
        return;
      }
      setStatus("uploading");
      setError("");
      try {
        const res = await fetch("/__design-mode/upload-resume", {
          method: "POST",
          headers: {
            "content-type": "application/pdf",
            "x-filename": encodeURIComponent(file.name),
          },
          body: file,
        });
        if (!res.ok) {
          setStatus("error");
          setError(await res.text());
          return;
        }
        const data = (await res.json()) as { updatedAt: string; originalFilename: string };
        onUpdated({ updatedAt: data.updatedAt, originalFilename: data.originalFilename });
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        setError((err as Error).message);
      }
    },
    [onUpdated],
  );

  const relativeUpdatedAt = meta.updatedAt
    ? new Date(meta.updatedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="mt-6 max-w-md rounded-md border border-white/15 bg-black/40 p-4 text-xs text-white/70">
      <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">Design Mode — Resume</p>
      <p className="mb-3">
        {meta.originalFilename ? (
          <>
            Active: <span className="text-white/90">{meta.originalFilename}</span>
            {relativeUpdatedAt && <> · updated {relativeUpdatedAt}</>}
          </>
        ) : (
          "No resume uploaded yet."
        )}
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) upload(file);
        }}
        className={`rounded-md border border-dashed p-4 text-center transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-white/20"
        }`}
      >
        <p className="mb-2">Drag a replacement PDF here, or</p>
        <button type="button" className={glassButton({ touch: true })} onClick={() => inputRef.current?.click()}>
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {status === "uploading" && <p className="mt-2 text-white/50">Uploading…</p>}
      {status === "error" && <p className="mt-2 text-red-400">{error}</p>}
    </div>
  );
}
