import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";

/**
 * Split into its own module — never imported directly by contact.tsx — so
 * this is the code-split boundary. Vite only fetches this chunk (and pdf.js's
 * worker) when a visitor is actually on the Connect page and the résumé
 * card mounts; every other route never pays for it.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/** First page only, sized to fit the closed-state card — regenerated from
 *  the live PDF on every render, so there's never a separate thumbnail
 *  export step to remember. */
export function ResumeThumbnail({ file, width }: { file: string; width: number }) {
  return (
    <Document file={file} loading={null} error={null} noData={null}>
      <Page
        pageNumber={1}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={null}
        error={null}
      />
    </Document>
  );
}

/** All pages, stacked for continuous scroll inside the lightbox. */
export function ResumeDocumentPages({
  file,
  width,
  onNumPages,
  onError,
}: {
  file: string;
  width: number;
  onNumPages: (n: number) => void;
  onError: () => void;
}) {
  const [numPages, setNumPages] = useState(0);

  return (
    <Document
      file={file}
      loading={null}
      error={null}
      noData={null}
      onLoadSuccess={({ numPages: n }) => {
        setNumPages(n);
        onNumPages(n);
      }}
      onLoadError={onError}
    >
      {Array.from({ length: numPages }, (_, i) => (
        <Page
          key={i}
          pageNumber={i + 1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={null}
          error={null}
          className="mb-4 last:mb-0 shadow-xl rounded-sm overflow-hidden"
        />
      ))}
    </Document>
  );
}
