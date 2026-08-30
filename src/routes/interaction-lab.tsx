import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

/**
 * INTERACTION LAB — a hidden design + motion laboratory at /interaction-lab.
 *
 * Not linked from anywhere in the public site and not part of SiteNav. It is a
 * place to build, compare and shortlist animation / navigation / glass /
 * transition / typography / image / carousel ideas before any of them are
 * moved into the real pages.
 *
 * The whole thing is code-split into one lazy chunk so it adds nothing to the
 * initial bundle of the real site. All of its styling is namespaced under
 * `[data-lab]` in src/interaction-lab/lab.css and cannot reach production
 * pages.
 */
const LabShell = lazy(() => import("@/interaction-lab/LabShell"));

export const Route = createFileRoute("/interaction-lab")({
  head: () => ({
    meta: [
      { title: "Interaction Lab — Reid Graham Design" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LabRoute,
});

function LabRoute() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#000",
            color: "rgba(255,255,255,0.5)",
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontSize: 12,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          Loading lab…
        </div>
      }
    >
      <LabShell />
    </Suspense>
  );
}
