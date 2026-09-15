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

        {/* Email + About Me heading — a top-aligned pair, matching the 5:7
            column split of the Resume/Photo/Bio row below so both rows read
            as one consistent grid down the page. */}
        <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-5">
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
              Email
            </p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <a
                href={`mailto:${EMAIL}`}
                className="font-display font-medium text-3xl md:text-5xl tracking-tight underline underline-offset-8 decoration-foreground/25 hover:decoration-foreground transition-colors break-words"
              >
                {/* Wraps after the @ on a narrow phone instead of splitting
                    mid-word ("gmail.c" / "om") the way break-all did. */}
                reidjgraham@<wbr />
                gmail.com
              </a>
            </div>
          </div>
          <div className="md:col-span-7">
            <h2
              data-design-id={designId.connect("about-heading")}
              data-design-kind="heading"
              className="font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-4xl md:text-6xl"
            >
              {overridesFile[designId.connect("about-heading")]?.base?.text ?? "About Me :)"}
            </h2>
          </div>
        </div>

        {/* Resume + Photo + Bio, as one 3-column grid rather than two
            independently-flowing blocks — that's what let the résumé card,
            portrait, and bio drift to three different vertical starting
            points before. Explicit grid placement pins them: the résumé
            card and the portrait share row 2 and (via the portrait's
            default grid stretch — no intrinsic aspect ratio of its own at
            md+) end up the same height, so their bottoms land together
            however tall the card's own aspect ratio makes it. The bio sits
            in that same row 2, so its top always matches the portrait's,
            and the download/open links get their own row 3 under the card
            alone rather than adding to the height the portrait matches. */}
        <div className="mt-16 grid grid-cols-1 md:[grid-template-columns:5fr_3fr_4fr] gap-x-8 lg:gap-x-12 gap-y-6 animate-pop-in">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 md:[grid-column:1] md:[grid-row:1]">
            Resume
          </p>
          <div className="md:[grid-column:1] md:[grid-row:2]">
            <ResumeSection hideActions />
          </div>
          <div className="md:[grid-column:1] md:[grid-row:3]">
            <ResumeActions />
          </div>

          {/* Swap the file at public/reid-graham-portrait.jpg to replace
              the photo. */}
          <img
            src="/reid-graham-portrait.jpg"
            alt="Reid Graham"
            className="w-full aspect-[3/4] md:aspect-auto rounded-md object-cover object-top bg-secondary md:[grid-column:2] md:[grid-row:2]"
          />

          <p
            data-design-id={designId.connect("about-description")}
            data-design-kind="text"
            className="font-display font-light text-lg md:text-2xl leading-snug text-foreground/85 text-balance whitespace-pre-line md:[grid-column:3] md:[grid-row:2]"
          >
            {resolveText(
              overridesFile,
              designId.connect("about-description"),
              "I'm Reid Graham, a designer based in New York City with a background in Architecture and Scenic Design.\n\nMy work merges these disciplines to create immersive storytelling through the built environment.",
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
