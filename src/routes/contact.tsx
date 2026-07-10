import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

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
  const [zoom, setZoom] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />

      <main className="flex-1 pt-32 md:pt-40 pb-16 px-6 md:px-12 lg:px-16">
        <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-6 animate-fade-in-slow">
          The studio is open
        </p>

        <h1 className="font-display font-black uppercase leading-[0.85] tracking-[-0.03em] text-5xl md:text-8xl animate-slide-from-left">
          Get in touch
        </h1>

        {/* Resume + info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
          {/* Resume swoop-in */}
          <div className="md:col-span-6">
            <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
              Résumé
            </p>
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="group relative block w-full max-w-md aspect-[8.5/11] bg-white text-black rounded-md shadow-2xl overflow-hidden animate-swoop-in text-left"
              aria-label="Enlarge résumé"
            >
              <div className="absolute inset-0 p-8 md:p-10 flex flex-col">
                <div>
                  <p className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl">
                    Reid Graham
                  </p>
                  <p className="mt-1 text-xs tracking-[0.2em] uppercase text-black/60">
                    Designer · New York City / Chicago
                  </p>
                </div>

                <div className="mt-6 space-y-4 text-xs md:text-sm text-black/80">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-black/50">
                      Education
                    </p>
                    <p>University of Michigan — B.S. Architecture, Minor in Scenic Design</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-black/50">
                      Practice
                    </p>
                    <p>Production & scenic design · Architecture · Visualization</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-black/50">
                      Honors
                    </p>
                    <p>Honorable Mention — Wallenberg Foundation Awards</p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-black/50">
                      Contact
                    </p>
                    <p>reidgraham@gmail.com</p>
                  </div>
                </div>

                <p className="mt-auto text-[10px] tracking-[0.3em] uppercase text-black/40">
                  Click to enlarge — full PDF placeholder
                </p>
              </div>
            </button>
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
              <h2 className="font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-4xl md:text-6xl">
                Hi <span className="text-accent">:)</span>
              </h2>
              <p className="mt-6 font-display font-light text-lg md:text-2xl leading-snug text-foreground/85 max-w-xl text-balance">
                I'm Reid Graham, a designer based in New York City and Chicago.
                I'm a recent graduate of the University of Michigan, where I studied
                architecture with a minor in scenic design. My foundation in theater,
                combined with my architectural background, fuels my desire to merge
                these disciplines and elevate the possibilities for immersive
                storytelling through the built environment.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />

      {/* Résumé lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-lg flex flex-col items-center justify-center p-6"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom(false);
            }}
            className="absolute top-6 right-6 pill"
          >
            CLOSE ✕
          </button>
          <div
            className="w-full max-w-3xl aspect-[8.5/11] bg-white text-black rounded-md shadow-2xl overflow-hidden p-10 md:p-16"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-display font-black uppercase tracking-tight text-4xl md:text-6xl">
              Reid Graham
            </p>
            <p className="mt-2 text-sm tracking-[0.2em] uppercase text-black/60">
              Designer · New York City / Chicago
            </p>
            <div className="mt-10 space-y-6 text-sm md:text-base text-black/80">
              <p>reidgraham@gmail.com</p>
              <p>
                University of Michigan — B.S. Architecture, Minor in Scenic Design.
              </p>
              <p>
                Practice spans production &amp; scenic design, architecture, and
                visualization. Honorable Mention — Wallenberg Foundation Awards.
              </p>
              <p className="text-black/50 italic">
                Full résumé PDF placeholder — to be replaced.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
