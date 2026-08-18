import { Suspense, lazy } from "react";
import type { DesignOverridesFile, ElementOverride, Scope } from "@/lib/design-overrides.types";
import type { MediaAdditionsFile } from "@/lib/media-additions.types";

/**
 * Mounted from every page that wants Design Mode support. Outside
 * `npm run design` this resolves to nothing at build time —
 * `import.meta.env.MODE` is inlined by Vite, so in a `production`-mode
 * build the branch below is unreachable and the dynamic `import()` it
 * guards is never referenced, letting Rollup drop the module from the
 * bundle entirely rather than merely hiding it behind a runtime flag.
 */
const InnerFrameBridge =
  import.meta.env.MODE === "design" ? lazy(() => import("./inner-frame-bridge")) : null;

export function DesignFrameBridge({
  liveOverrides,
  liveMedia,
  onLocalPatch,
  onLocalReset,
  onSyncAll,
}: {
  liveOverrides: DesignOverridesFile;
  liveMedia: MediaAdditionsFile;
  onLocalPatch: (id: string, scope: Scope, patch: ElementOverride) => void;
  onLocalReset: (id: string) => void;
  onSyncAll: (overrides: DesignOverridesFile, media: MediaAdditionsFile) => void;
}) {
  if (import.meta.env.MODE !== "design" || !InnerFrameBridge) return null;
  return (
    <Suspense fallback={null}>
      <InnerFrameBridge
        liveOverrides={liveOverrides}
        liveMedia={liveMedia}
        onLocalPatch={onLocalPatch}
        onLocalReset={onLocalReset}
        onSyncAll={onSyncAll}
      />
    </Suspense>
  );
}
