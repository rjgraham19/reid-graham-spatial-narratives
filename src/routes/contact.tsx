import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { ResumeSection, ResumeActions } from "@/components/resume-viewer";
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

const EMAIL = "reidjgraham@gmail.com";

/* Small grey section labels (EMAIL, RESUME), the credit-label style from the
   project pages at a size that reads on a tablet, sitting close to the
   thing they label. */
const contactLabel = "text-xs md:text-[13px] tracking-[0.14em] uppercase text-foreground/50 mb-2 md:mb-3";

function Contact() {
  const { live, liveMedia, liveMediaOrder, onLocalPatch, onLocalReset, onSyncAll } = useLiveOverrides();
  const overridesFile = mergeOverridesFiles(designOverrides as DesignOverridesFile, live);
  const responsiveCss = designModeStyleTag(overridesFile);

  return (
    /* `intro-font`: General Sans, with the same weights as the project pages
       (see styles.css). */
    <div className="intro-font min-h-screen flex flex-col">
      <link
        rel="preload"
        href="/fonts/general-sans-variable.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
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

      <main className="flex-1 pt-24 md:pt-28 lg:pt-32 pb-16 px-6 md:px-12 lg:px-16">
        {!resolveHidden(overridesFile, designId.connect("heading")) && (
          <h1
            data-design-id={designId.connect("heading")}
            data-design-kind="heading"
            className="font-display [font-weight:var(--intro-title-w)] uppercase leading-[0.85] tracking-[-0.03em] text-5xl md:text-7xl lg:text-8xl"
          >
            {resolveText(overridesFile, designId.connect("heading"), "Get in touch!")}
          </h1>
        )}

        {/* Two self-contained groups, each label sitting directly on what it
            names, so nothing reads as belonging to its neighbour at any
            width:
            - Contact (left): EMAIL + address, then RESUME + the résumé card
              with its Download / Open buttons side by side right under it.
            - About (right): ABOUT ME :) with the portrait and bio directly
              beneath it, side by side.
            On an iPad-width column the portrait stacks above the bio (side by
            side there left both too cramped); phone and desktop keep them
            side by side.
            They used to share one row-by-row grid, which put "About Me"
            beside the email — a row above, and a column off, from the photo
            it introduces — and hung the résumé buttons below the bio's
            height rather than the card's. Stacks (contact, then about) on a
            phone. */}
        <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-12 gap-y-14 md:gap-x-10 lg:gap-x-16 animate-pop-in">
          <div className="md:col-span-5 min-w-0 flex flex-col gap-12">
            {/* Size container for the email (see `email-fit` in styles.css). */}
            <section className="[container-type:inline-size]">
              <p className={contactLabel}>Email</p>
              <a
                href={`mailto:${EMAIL}`}
                className="email-fit block w-full font-display font-medium tracking-tight underline underline-offset-8 decoration-foreground/25 hover:decoration-foreground transition-colors whitespace-nowrap"
              >
                {EMAIL}
              </a>
            </section>

            <section>
              <p className={contactLabel}>Resume</p>
              <ResumeSection hideActions />
              <ResumeActions className="mt-3" />
            </section>
          </div>

          <section className="md:col-span-7 min-w-0">
            <h2
              data-design-id={designId.connect("about-heading")}
              data-design-kind="heading"
              className="font-display [font-weight:var(--intro-title-w)] uppercase leading-[0.9] tracking-[-0.02em] text-4xl md:text-5xl lg:text-6xl"
            >
              {overridesFile[designId.connect("about-heading")]?.base?.text ?? "About Me :)"}
            </h2>

            <div className="mt-5 md:mt-6 grid grid-cols-[2fr_3fr] md:grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 md:gap-6 items-start">
              {/* Swap the file at public/reid-graham-portrait.jpg to replace
                  the photo. */}
              <img
                src="/reid-graham-portrait.jpg"
                alt="Reid Graham"
                className="w-full md:max-w-xs lg:max-w-none aspect-[3/4] rounded-md object-cover object-top bg-secondary"
              />

              <p
                data-design-id={designId.connect("about-description")}
                data-design-kind="text"
                className="font-display [font-weight:var(--intro-description-w)] text-base md:text-lg lg:text-xl xl:text-2xl leading-[1.45] text-foreground text-balance whitespace-pre-line"
              >
                {resolveText(
                  overridesFile,
                  designId.connect("about-description"),
                  "I'm Reid Graham, a designer based in New York City with a background in Architecture and Scenic Design.\n\nMy work merges these disciplines to create immersive storytelling through the built environment.",
                )}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
