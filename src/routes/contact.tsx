import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { glassButton, trackSheen } from "@/components/glass-button";
import { textEms } from "@/lib/title-metrics";
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
const contactLabel = "text-sm md:text-[13px] tracking-[0.14em] uppercase text-foreground/50 mb-2 md:mb-3";

function Contact() {
  const { live, liveMedia, liveMediaOrder, onLocalPatch, onLocalReset, onSyncAll } = useLiveOverrides();
  const overridesFile = mergeOverridesFiles(designOverrides as DesignOverridesFile, live);
  const responsiveCss = designModeStyleTag(overridesFile);
  const heading = resolveText(overridesFile, designId.connect("heading"), "Let's get in touch!");

  // Monitors only: the résumé pull-down. Mounted on first open (so the PDF
  // preview isn't rendered until asked for) and kept mounted after, so it
  // can animate closed; opening scrolls it into view.
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeMounted, setResumeMounted] = useState(false);
  const pulldownRef = useRef<HTMLDivElement>(null);
  const toggleResume = useCallback(() => {
    setResumeOpen((open) => {
      if (!open) {
        setResumeMounted(true);
        window.setTimeout(() => pulldownRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 520);
      }
      return !open;
    });
  }, []);

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

      {/* Two sections:
          1. About — "About Me :)" with the portrait and bio side by side
             directly beneath it.
          2. Let's get in touch — the heading, the email, the résumé.
          Phones and tablets (under 900px): stacked top to bottom, split by
          a faint rule; EMAIL and RESUME sit side by side from tablet up.
          Monitors (900px+, half-width windows included): the two clusters
          frame the screen on a diagonal — About top-left, Let's get in
          touch lower and to the right — and the résumé preview isn't shown
          by default: "View Resume" pulls it down, centered below both. */}
      <main className="flex-1 pt-24 md:pt-28 lg:pt-32 pb-16 px-6 md:px-12 lg:px-16">
        <section id="about" className="scroll-mt-24 mon:w-[58%]">
          <h2
            data-design-id={designId.connect("about-heading")}
            data-design-kind="heading"
            className="animate-heading-pop motion-reduce:animate-none origin-center md:origin-left text-center md:text-left font-display [font-weight:var(--intro-title-w)] uppercase leading-[0.9] tracking-[-0.02em] text-4xl md:text-5xl lg:text-6xl"
          >
            {overridesFile[designId.connect("about-heading")]?.base?.text ?? "About Me :)"}
          </h2>

          <div className="mt-5 md:mt-6 grid grid-cols-[2fr_3fr] md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] mon:grid-cols-[2fr_3fr] gap-5 md:gap-8 items-start md:max-w-4xl">
            {/* Swap the file at public/reid-graham-portrait.jpg to replace
                the photo. */}
            <img
              src="/reid-graham-portrait.jpg"
              alt="Reid Graham"
              className="w-full aspect-[3/4] rounded-md object-cover object-top bg-secondary"
            />

            <p
              data-design-id={designId.connect("about-description")}
              data-design-kind="text"
              className="font-display [font-weight:var(--intro-description-w)] text-sm md:text-lg xl:text-xl 2xl:text-2xl leading-[1.45] text-foreground text-balance whitespace-pre-line"
            >
              {resolveText(
                overridesFile,
                designId.connect("about-description"),
                "I'm Reid Graham, a designer based in New York City with a background in Architecture and Scenic Design (yes, I'm a theatre kid).\n\nMy work merges these disciplines to create immersive storytelling through the built environment.",
              )}
            </p>
          </div>
        </section>

        <div aria-hidden className="my-10 md:my-14 h-px bg-foreground/15 mon:hidden" />

        <section className="mon:ml-auto mon:w-[44%] mon:mt-16 lg:mt-20">
          {!resolveHidden(overridesFile, designId.connect("heading")) && (
            /* One line at every width, sized in CSS to fit its column (see
               .contact-title) — the wrapper is the size container and carries
               the heading's width in ems. Centered on phones. */
            <div
              className="[container-type:inline-size]"
              style={{ "--title-ems": textEms(heading).toFixed(3) } as CSSProperties}
            >
              <h1
                data-design-id={designId.connect("heading")}
                data-design-kind="heading"
                className="contact-title text-center md:text-left font-display [font-weight:var(--intro-title-w)] uppercase leading-[0.85] tracking-[-0.03em]"
              >
                {heading}
              </h1>
            </div>
          )}

          <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-2 mon:grid-cols-1 gap-8 md:gap-10 mon:gap-7 items-start">
            {/* Size container for the email (see `email-fit` in styles.css). */}
            <section className="min-w-0 [container-type:inline-size]">
              <p className={contactLabel}>Email</p>
              <a
                href={`mailto:${EMAIL}`}
                className="email-fit block w-full font-display font-medium tracking-tight underline underline-offset-8 decoration-foreground/25 hover:decoration-foreground transition-colors whitespace-nowrap"
              >
                {EMAIL}
              </a>
            </section>

            {/* Résumé, three ways:
                - Phones: View Resume (the PDF in the phone's own viewer) and
                  Download — no preview card.
                - Tablets: the preview card (readable size) with Download /
                  Open under it.
                - Monitors: View Resume toggles the preview open below both
                  clusters (see the pull-down after this section), plus
                  Download. */}
            <section className="min-w-0">
              <p className={contactLabel}>Resume</p>
              <div className="resume-actions-phone md:hidden">
                <ResumeActions viewFirst className="justify-center" />
              </div>
              <div className="hidden md:block mon:hidden max-w-sm">
                <ResumeSection hideActions />
                <ResumeActions className="mt-3" />
              </div>
              <div className="hidden mon:flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={toggleResume}
                  onMouseMove={trackSheen}
                  aria-expanded={resumeOpen}
                  aria-controls="resume-pulldown"
                  className={glassButton({ sheen: true, className: "text-button text-button--sized gap-2" })}
                >
                  {resumeOpen ? "Hide Resume" : "View Resume"}
                  <svg
                    aria-hidden
                    viewBox="0 0 12 12"
                    width="10"
                    height="10"
                    className={`transition-transform duration-300 ${resumeOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <ResumeActions downloadOnly />
              </div>
            </section>
          </div>
        </section>

        {/* Monitors: the résumé pull-down. Collapsed to zero height until
            View Resume opens it, then it slides open, centered below both
            clusters, and the page scrolls to it. Clicking the card still
            opens the full-screen viewer. */}
        <div
          id="resume-pulldown"
          ref={pulldownRef}
          className={`hidden mon:grid transition-[grid-template-rows,opacity] duration-500 ease-cinematic ${
            resumeOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
          aria-hidden={!resumeOpen}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="mx-auto w-full max-w-md pt-16">{resumeMounted && <ResumeSection hideActions />}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
