import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ResumeSection } from "@/components/resume-viewer";
import designOverrides from "@/lib/design-overrides.json";
import { mergeOverridesFiles, resolveText, resolveHidden, designModeStyleTag } from "@/lib/apply-overrides";
import type { DesignOverridesFile } from "@/lib/design-overrides.types";
import { designId } from "@/lib/design-ids";
import { useLiveOverrides } from "@/lib/use-live-overrides";
import { DesignFrameBridge } from "@/design-mode/frame-bridge";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Reid Graham" },
      {
        name: "description",
        content:
          "Get in touch with Reid Graham — designer working across scenic, architecture, and visualization.",
      },
      { property: "og:title", content: "Contact — Reid Graham" },
      {
        property: "og:description",
        content: "Say hello :) — reidjgraham@gmail.com",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { live, liveMedia, liveMediaOrder, onLocalPatch, onLocalReset, onSyncAll } = useLiveOverrides();
  const overridesFile = mergeOverridesFiles(designOverrides as DesignOverridesFile, live);
  const responsiveCss = designModeStyleTag(overridesFile);

  return (
    <div className="min-h-screen flex flex-col">
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
        <SiteNav />
      </div>

      <main className="flex-1 pt-32 md:pt-40 pb-16 px-6 md:px-12 lg:px-16">
        {!resolveHidden(overridesFile, designId.connect("heading")) && (
          <h1
            data-design-id={designId.connect("heading")}
            data-design-kind="heading"
            className="font-display font-black uppercase leading-[0.85] tracking-[-0.03em] text-5xl md:text-8xl"
          >
            {resolveText(overridesFile, designId.connect("heading"), "Get in touch!")}
          </h1>
        )}

        {/* Email — directly under the heading rather than buried in the
            second column below, since it's the one thing this page actually
            wants a visitor to do. */}
        <div className="mt-8 md:mt-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
            Email
          </p>
          <a
            href="mailto:reidjgraham@gmail.com"
            className="font-display font-medium text-3xl md:text-5xl tracking-tight underline underline-offset-8 decoration-foreground/25 hover:decoration-foreground transition-colors break-words"
          >
            {/* Wraps after the @ on a narrow phone instead of splitting
                mid-word ("gmail.c" / "om") the way break-all did. */}
            reidjgraham@<wbr />
            gmail.com
          </a>
        </div>

        {/* Resume + About */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
              Resume
            </p>
            <ResumeSection />
          </div>

          <div className="md:col-span-7 animate-swoop-in">
            {/* Photo and text as one deliberate pairing, not a thumbnail
                beside a label — the heading itself ("About Me :)") is what
                used to be the small eyebrow above it, so that label is gone
                rather than repeating the same words twice. Swap the file at
                public/reid-graham-portrait.jpg to replace the photo. */}
            <div className="grid grid-cols-1 sm:grid-cols-[0.85fr_1.15fr] gap-8">
              <img
                src="/reid-graham-portrait.jpg"
                alt="Reid Graham"
                className="w-full aspect-[3/4] rounded-md object-cover object-top bg-secondary"
              />
              <div>
                <h2
                  data-design-id={designId.connect("about-heading")}
                  data-design-kind="heading"
                  className="font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-4xl md:text-6xl"
                >
                  {overridesFile[designId.connect("about-heading")]?.base?.text ?? "About Me :)"}
                </h2>
                <p
                  data-design-id={designId.connect("about-description")}
                  data-design-kind="text"
                  className="mt-6 font-display font-light text-lg md:text-2xl leading-snug text-foreground/85 text-balance"
                >
                  {resolveText(
                    overridesFile,
                    designId.connect("about-description"),
                    "I'm Reid Graham, a designer based in New York City. I studied architecture at the University of Michigan, with a minor in scenic design. My foundation in theater, combined with my architectural background, fuels my desire to merge these disciplines and elevate the possibilities for immersive storytelling through the built environment.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div data-design-protected="Protected navigation">
        <SiteFooter />
      </div>
    </div>
  );
}
