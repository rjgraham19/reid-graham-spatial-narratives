import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { glassButton, trackSheen } from "@/components/glass-button";
import { textEms } from "@/lib/title-metrics";
import { SiteNav } from "@/components/site-nav";
import { scrollToReveal } from "@/hooks/use-lenis";
import { ResumeInlineDocument, ResumeActions } from "@/components/resume-viewer";
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
  const aboutHeading = overridesFile[designId.connect("about-heading")]?.base?.text ?? "About Me :)";
  // Both headings are fitted using the longer one's width, so they match.
  const headingEms = Math.max(textEms(heading), textEms(aboutHeading)).toFixed(3);

  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumeMounted, setResumeMounted] = useState(false);
  const pulldownRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toggleResume = () => {
    setResumeMounted(true);
    setResumeOpen(!resumeOpen);
  };
  useEffect(() => {
    if (!resumeOpen) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        if (pulldownRef.current) scrollToReveal(pulldownRef.current);
      }
    }, reduced ? 0 : 520);
    return () => window.clearTimeout(timer);
  }, [resumeOpen]);

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
          side by side, top-aligned, split by a faint upright rule — and the
          résumé preview isn't shown by default: "View Resume" pulls it
          down, centered below both. */}
      <main className="flex-1 pt-24 md:pt-28 lg:pt-32 pb-16 px-6 md:px-12 lg:px-16">
        {/* Monitors: the two clusters side by side, top-aligned, split by a
            faint upright rule. Below 900px they stack, split by the same
            rule running across. */}
        <div className="mon:grid mon:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] mon:gap-10 lg:gap-14">
        {/* Each cluster sits centered in its half, capped in width, so on a
            wide screen they split the difference between the page edge and
            the center rule instead of hugging the outside edges. Both halves
            share the same cap so the two headings (sized from their box, see
            below) come out the same size. */}
        <section id="about" className="scroll-mt-24 mon:w-full mon:max-w-[38rem] mon:justify-self-center">
          {/* Same size as "Let's get in touch!" at every width: both headings
              are fitted to their (equal-width) boxes using the longer of the
              two, so they scale down together as the window narrows. */}
          <div className="[container-type:inline-size]" style={{ "--title-ems": headingEms } as CSSProperties}>
            <h2
              data-design-id={designId.connect("about-heading")}
              data-design-kind="heading"
              className="contact-title animate-heading-pop motion-reduce:animate-none origin-center md:origin-left text-center md:text-left font-display [font-weight:var(--intro-title-w)] uppercase leading-[0.85] tracking-[-0.03em]"
            >
              {aboutHeading}
            </h2>
          </div>

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

        <div aria-hidden className="my-10 md:my-14 h-px bg-foreground/15 mon:my-0 mon:h-auto mon:w-px mon:shrink-0" />

        <section className="mon:w-full mon:max-w-[38rem] mon:justify-self-center">
          {!resolveHidden(overridesFile, designId.connect("heading")) && (
            /* One line at every width, sized in CSS to fit its column (see
               .contact-title) — the wrapper is the size container and carries
               the heading's width in ems. Centered on phones. */
            <div
              className="[container-type:inline-size]"
              style={{ "--title-ems": headingEms } as CSSProperties}
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

          <div className="mt-6 md:mt-8">
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

            <section className="mt-8 md:hidden">
              <p className={contactLabel}>Resume</p>
              <div className="resume-actions-phone"><ResumeActions viewFirst className="justify-center" /></div>
            </section>
          </div>
        </section>
        </div>

        <section ref={pulldownRef} aria-label="Resume" className="hidden md:block mx-auto mt-12 lg:mt-16 w-full max-w-3xl scroll-mt-28 border-t border-foreground/15 pt-6">
          <h2 className="mb-5 font-display text-2xl font-semibold tracking-tight">Resume</h2>
          <div className="flex flex-wrap items-center gap-3 pb-5">
            <button type="button" ref={toggleRef} onClick={toggleResume} onMouseMove={trackSheen}
              aria-expanded={resumeOpen} aria-controls="resume-pulldown" aria-label={resumeOpen ? "Collapse resume" : "View resume"}
              className={glassButton({ sheen: true, className: "text-button text-button--sized gap-3" })}>
              View Resume
              <svg aria-hidden viewBox="0 0 12 12" width="12" height="12" className={`transition-transform duration-300 motion-reduce:transition-none ${resumeOpen ? "rotate-180" : ""}`}>
                <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <ResumeActions />
          </div>
          <div id="resume-pulldown" role="region" aria-label="Resume preview" inert={!resumeOpen} aria-hidden={!resumeOpen}
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-cinematic motion-reduce:transition-none ${resumeOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="min-h-0 overflow-hidden">
              {resumeMounted && <ResumeInlineDocument />}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
