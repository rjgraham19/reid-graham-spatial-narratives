import { createFileRoute, Link } from "@tanstack/react-router";
import { HERO_URL } from "@/lib/projects";
import { SiteNav } from "@/components/site-nav";
import designOverrides from "@/lib/design-overrides.json";
import { mergeOverridesFiles, designModeStyleTag } from "@/lib/apply-overrides";
import type { DesignOverridesFile } from "@/lib/design-overrides.types";
import { designId } from "@/lib/design-ids";
import { useLiveOverrides } from "@/lib/use-live-overrides";
import { DesignFrameBridge } from "@/design-mode/frame-bridge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reid Graham Design — Production/Scenic, Architecture, Visualizations" },
      {
        name: "description",
        content:
          "Reid Graham is a designer working across production/scenic design, architecture, and visualization — building rooms, sets, and speculative worlds.",
      },
      { property: "og:title", content: "Reid Graham Design" },
      {
        property: "og:description",
        content:
          "Production/scenic, architecture and visualization work exploring spatial storytelling.",
      },
      { property: "og:image", content: HERO_URL },
      { name: "twitter:image", content: HERO_URL },
    ],
  }),
  component: Home,
});

function Home() {
  const { live, liveMedia, liveMediaOrder, onLocalPatch, onLocalReset, onSyncAll } = useLiveOverrides();
  const overridesFile = mergeOverridesFiles(designOverrides as DesignOverridesFile, live);
  const responsiveCss = designModeStyleTag(overridesFile);
  const brandingId = designId.home("branding");

  return (
    <div className="relative min-h-[100svh] bg-background text-foreground">
      {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
      <DesignFrameBridge
        liveOverrides={live}
        liveMedia={liveMedia}
        liveMediaOrder={liveMediaOrder}
        onLocalPatch={onLocalPatch}
        onLocalReset={onLocalReset}
        onSyncAll={onSyncAll}
      />

      <div data-design-protected="Protected navigation">
        <SiteNav variant="top-transparent" />
      </div>
      {/* Split screen: text left, phone-booth image right (right = clickable → /contact).
          Heights are in svh so the whole split fits the space a phone actually
          shows with its address bar up — in vh the wordmark is pushed below the
          fold and the entrance reads as a page you have to scroll to see. */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[100svh]">
        {/* LEFT — text */}
        <div className="relative z-10 flex flex-col justify-end px-6 md:px-12 lg:px-16 py-10 md:py-14 pt-28 md:pt-32">
          {/* The wrapper (not the h1) carries the design ID: typography
              overrides need to reach the h1's own classes (see
              apply-overrides.ts), but *positioning* — what this element is
              actually for — applies to this wrapper so dragging moves the
              whole three-line lockup as one block via a transform, leaving
              its reserved layout space untouched rather than switching the
              header to absolute positioning. */}
          <div data-design-id={brandingId} data-design-kind="heading">
            <h1
              className="font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(3rem,9vw,8rem)] animate-title-lr"
              aria-label="Reid Graham Design"
            >
              <span className="block">Reid</span>
              <span className="block">Graham</span>
              <span className="block font-thin text-foreground/85">Design</span>
            </h1>
          </div>
        </div>

        {/* RIGHT — phone booth, clickable easter-egg → /contact */}
        <div className="relative order-first md:order-last min-h-[56svh] md:min-h-[100svh] overflow-hidden">
          <img
            src={HERO_URL}
            alt="Payphone booth in an overgrown, neon-lit environment — pick up to reach Reid"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Ambient darken toward the split line */}
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-background via-background/40 to-transparent hidden md:block" />
          <div className="absolute inset-0 md:hidden bg-background/50" />
          {/* Hit target scoped to the payphone itself. The image is a wide crop
              whose left half is the lit portal and jungle — a full-bleed link
              there meant every tap on that empty scenery navigated to /contact.
              These insets track the phone unit and its post across both the
              mobile (more horizontal crop) and desktop columns. */}
          <Link
            to="/contact"
            aria-label="Contact — pick up the phone"
            className="absolute left-[56%] right-[6%] top-[28%] bottom-[8%] block"
          />
        </div>
      </div>
    </div>
  );
}
