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
        content: "Say hello :) — reidgraham@gmail.com",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { live, liveMedia, onLocalPatch, onLocalReset, onSyncAll } = useLiveOverrides();
  const overridesFile = mergeOverridesFiles(designOverrides as DesignOverridesFile, live);
  const responsiveCss = designModeStyleTag(overridesFile);

  return (
    <div className="min-h-screen flex flex-col">
      {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
      <DesignFrameBridge
        liveOverrides={live}
        liveMedia={liveMedia}
        onLocalPatch={onLocalPatch}
        onLocalReset={onLocalReset}
        onSyncAll={onSyncAll}
      />

      <div data-design-protected="Protected navigation">
        <SiteNav />
      </div>

      <main className="flex-1 pt-32 md:pt-40 pb-16 px-6 md:px-12 lg:px-16">
        {!resolveHidden(overridesFile, designId.connect("eyebrow")) && (
          <p
            data-design-id={designId.connect("eyebrow")}
            data-design-kind="text"
            className="text-[10px] tracking-[0.35em] uppercase text-accent mb-6"
          >
            {resolveText(overridesFile, designId.connect("eyebrow"), "The studio is open")}
          </p>
        )}

        {!resolveHidden(overridesFile, designId.connect("heading")) && (
          <h1
            data-design-id={designId.connect("heading")}
            data-design-kind="heading"
            className="font-display font-black uppercase leading-[0.85] tracking-[-0.03em] text-5xl md:text-8xl"
          >
            {resolveText(overridesFile, designId.connect("heading"), "Get in touch")}
          </h1>
        )}

        {/* Resume + info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          {/* Resume swoop-in */}
          <div className="md:col-span-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
              Resume
            </p>
            <ResumeSection />
          </div>

          {/* Email + About Me */}
          <div className="md:col-span-6 space-y-16">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
                Email
              </p>
              <a
                href="mailto:reidgraham@gmail.com"
                className="font-serif italic text-3xl md:text-5xl underline underline-offset-8 decoration-accent/40 hover:text-accent transition-colors break-all"
              >
                reidgraham@gmail.com
              </a>
            </div>

            <div className="animate-swoop-in">
              <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
                About Me
              </p>
              <h2
                data-design-id={designId.connect("about-heading")}
                data-design-kind="heading"
                className="font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-4xl md:text-6xl"
              >
                {overridesFile[designId.connect("about-heading")]?.base?.text ?? (
                  <>
                    Hi <span className="text-accent">:)</span>
                  </>
                )}
              </h2>
              <p
                data-design-id={designId.connect("about-description")}
                data-design-kind="text"
                className="mt-6 font-display font-light text-lg md:text-2xl leading-snug text-foreground/85 max-w-xl text-balance"
              >
                {resolveText(
                  overridesFile,
                  designId.connect("about-description"),
                  "I'm Reid Graham, a designer based in New York City and Chicago. I'm a recent graduate of the University of Michigan, where I studied architecture with a minor in scenic design. My foundation in theater, combined with my architectural background, fuels my desire to merge these disciplines and elevate the possibilities for immersive storytelling through the built environment.",
                )}
              </p>
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
