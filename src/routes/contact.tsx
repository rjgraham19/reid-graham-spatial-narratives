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
          "Start a conversation with Reid Graham Studio about experiential, scenic, or architectural work.",
      },
      { property: "og:title", content: "Contact — Reid Graham" },
      {
        property: "og:description",
        content: "The studio is currently accepting new commissions.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav mixBlend={false} />

      <main className="flex-1 pt-40 pb-16 px-6 md:px-10 grid grid-cols-1 md:grid-cols-12 gap-16">
        {/* Left column */}
        <div className="md:col-span-6">
          <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-8">
            The studio is open
          </p>
          <h1 className="font-display text-5xl md:text-8xl font-extrabold tracking-tighter uppercase leading-[0.9] animate-reveal">
            Tell us
            <br />
            about the
            <br />
            <span className="font-serif italic font-normal normal-case tracking-normal text-muted-foreground">
              room you need.
            </span>
          </h1>

          <div className="mt-16 space-y-10">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                Direct
              </p>
              <a
                href="mailto:hello@reidgraham.studio"
                className="font-serif italic text-2xl md:text-3xl underline underline-offset-8 decoration-accent/40 hover:text-accent transition-colors"
              >
                hello@reidgraham.studio
              </a>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                Press
              </p>
              <a
                href="mailto:press@reidgraham.studio"
                className="font-serif italic text-xl hover:text-accent transition-colors"
              >
                press@reidgraham.studio
              </a>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
                Studio
              </p>
              <p className="font-serif italic text-lg leading-relaxed">
                88 Wythe Avenue
                <br />
                Brooklyn, NY 11249
                <br />
                By appointment · Tue–Fri
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-6 md:pl-12 md:border-l border-border">
          {sent ? (
            <div className="min-h-[400px] flex flex-col justify-center">
              <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-6">
                Received
              </p>
              <h2 className="font-serif italic text-4xl md:text-5xl leading-tight">
                Thank you. We'll be in touch shortly.
              </h2>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="space-y-10"
            >
              <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground">
                Inquiry form — 01 / 05
              </p>

              <Field label="Your name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Organisation (optional)" name="org" />

              <div>
                <label
                  htmlFor="scope"
                  className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-4"
                >
                  Scope of interest
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Experiential", "Scenic", "Architecture", "Visualization", "Consultation"].map(
                    (s) => (
                      <label
                        key={s}
                        className="cursor-pointer text-[10px] tracking-[0.2em] uppercase px-3 py-2 border border-border hover:border-accent hover:text-accent transition-colors"
                      >
                        <input type="checkbox" name="scope" value={s} className="sr-only peer" />
                        <span className="peer-checked:text-accent">{s}</span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-4"
                >
                  The room you're imagining
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  placeholder="A sentence is enough to start."
                  className="w-full bg-transparent border-b border-border pb-3 font-serif italic text-lg focus:outline-none focus:border-accent placeholder:text-muted-foreground/60 resize-none"
                />
              </div>

              <button
                type="submit"
                className="group inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:text-accent transition-colors"
              >
                Send inquiry
                <span className="h-px w-8 bg-foreground group-hover:w-24 group-hover:bg-accent transition-all duration-500" />
              </button>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground block mb-4"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full bg-transparent border-b border-border pb-3 font-serif italic text-lg focus:outline-none focus:border-accent placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
