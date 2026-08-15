import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

/**
 * Design Mode shell, reachable at /design. Outside `npm run design` this is
 * inert: `import.meta.env.MODE` is inlined by Vite at build time, so in a
 * `production`-mode build the branch that imports DesignShell is
 * unreachable and Rollup never includes that module — visiting /design (or
 * /design?design=true) on the deployed site renders the plain fallback
 * below and nothing else.
 */
const DesignShell = import.meta.env.MODE === "design" ? lazy(() => import("@/design-mode/DesignShell")) : null;

export const Route = createFileRoute("/design")({
  component: DesignPage,
});

function DesignPage() {
  if (import.meta.env.MODE !== "design" || !DesignShell) {
    return (
      <div style={{ padding: 48, fontFamily: "system-ui, sans-serif" }}>
        <p>Design Mode isn't available here.</p>
        <p>
          Run <code>npm run design</code> locally to use it.
        </p>
      </div>
    );
  }
  return (
    <Suspense fallback={<div style={{ padding: 48 }}>Loading Design Mode…</div>}>
      <DesignShell />
    </Suspense>
  );
}
