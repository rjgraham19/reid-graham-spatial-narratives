import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import portraitImg from "@/assets/portrait.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Reid Graham" },
      {
        name: "description",
        content:
          "Reid Graham is a multi-disciplinary designer building environments that demand presence. Background in architecture and scenic design.",
      },
      { property: "og:title", content: "About — Reid Graham" },
      {
        property: "og:description",
        content: "A designer working between building, staging, and rendering.",
      },
      { property: "og:image", content: portraitImg },
    ],
  }),
  component: About,
});

const TIMELINE = [
  { year: "2026", entry: "Studio opens Brooklyn workspace at 88 Wythe." },
  { year: "2024", entry: "The Liminal Chamber — Senses Institute commission." },
  { year: "2023", entry: "Membrane Pavilion, Marfa, TX." },
  { year: "2022", entry: "First residential build: Corner House, Upstate NY." },
  { year: "2020", entry: "Joined Vantage Theatre Group as scenic designer-in-residence." },
  { year: "2018", entry: "M.Arch, GSD. Thesis on impermanent architecture." },
  { year: "2015", entry: "B.A. Theatre Design, Yale." },
];

const CLIENTS = [
  "Vantage Theatre Group",
  "Monolith Arch Partners",
  "The Senses Institute",
  "Kinetica Studios",
  "Aperture Journal",
  "MoMA PS1",
  "Prada Frames",
  "A24",
];

function About() {
  return (
    <div>
      <SiteNav mixBlend={false} />

      <header className="pt-40 pb-24 px-6 md:px-10 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-border">
        <div className="md:col-span-7">
          <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-8">
            Studio profile
          </p>
          <h1 className="font-display text-5xl md:text-8xl font-extrabold tracking-tighter uppercase leading-[0.9]">
            Every room
            <br />
            has a story
            <br />
            <span className="font-serif italic font-normal normal-case tracking-normal text-muted-foreground">
              waiting for you to walk into it.
            </span>
          </h1>
        </div>
        <div className="md:col-span-5">
          <div className="w-full aspect-[3/4] overflow-hidden bg-ash">
            <img
              src={portraitImg}
              alt="Portrait of Reid Graham"
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="mt-4 text-[10px] tracking-[0.3em] uppercase text-muted-foreground text-right">
            Reid Graham · Brooklyn 2026
          </p>
        </div>
      </header>

      {/* Bio */}
      <section className="px-6 md:px-10 py-32 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-border">
        <div className="md:col-span-4">
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground">
            The practice
          </p>
        </div>
        <div className="md:col-span-8 space-y-8 font-serif text-xl md:text-2xl leading-relaxed text-balance">
          <p>
            Reid Graham is an experiential designer working between building, staging, and rendering. Trained first in architecture, then in scenic design, the studio treats every project as a room the viewer is asked to enter — with its own temperature, weight, and vocabulary.
          </p>
          <p className="text-foreground/70">
            Recent work includes the Liminal Chamber for the Senses Institute, the Membrane Pavilion at a two-week desert festival in Marfa, and the Monolith in Fog production for Vantage Theatre Group in London. The studio also maintains an ongoing visualization practice — rendered atmospheres used both as concept and as finished work.
          </p>
          <p className="text-foreground/70">
            The office is small and deliberate. Every project is drawn, modelled, and detailed by Reid before a fabricator ever touches it.
          </p>
        </div>
      </section>

      {/* Approach */}
      <section className="px-6 md:px-10 py-32 border-b border-border">
        <p className="text-[10px] tracking-[0.35em] uppercase text-accent mb-16">
          Working principles
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20">
          {[
            {
              title: "Story before form",
              body:
                "Every project starts with a single sentence. If the sentence isn't strong, the building won't be either.",
            },
            {
              title: "Weather as material",
              body:
                "Fog, temperature, humidity, the direction light travels — treated as building materials, not effects.",
            },
            {
              title: "Restraint is loud",
              body:
                "Most rooms have too much in them. The studio's default answer is to remove one more thing.",
            },
          ].map((p, i) => (
            <div key={p.title} className="border-t border-border pt-6">
              <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                0{i + 1}
              </span>
              <h3 className="mt-4 font-display text-2xl md:text-3xl font-extrabold tracking-tighter uppercase">
                {p.title}
              </h3>
              <p className="mt-4 font-serif italic text-muted-foreground leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="px-6 md:px-10 py-32 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-border">
        <div className="md:col-span-4">
          <p className="text-[10px] tracking-[0.35em] uppercase text-muted-foreground">
            Chronology
          </p>
        </div>
        <ul className="md:col-span-8">
          {TIMELINE.map((t) => (
            <li
              key={t.year}
              className="grid grid-cols-12 gap-4 py-6 border-t border-border last:border-b"
            >
              <span className="col-span-2 font-display text-lg font-bold tracking-tight text-accent">
                {t.year}
              </span>
              <span className="col-span-10 font-serif italic text-lg md:text-xl">
                {t.entry}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Clients marquee */}
      <section className="py-16 overflow-hidden border-b border-border">
        <div className="flex gap-16 animate-marquee whitespace-nowrap">
          {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((c, i) => (
            <span
              key={i}
              className="font-serif italic text-3xl md:text-5xl text-muted-foreground/60"
            >
              {c} <span className="text-accent mx-8">·</span>
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 py-32">
        <Link
          to="/contact"
          className="group inline-flex items-baseline gap-6 hover:text-accent transition-colors"
        >
          <span className="font-display text-4xl md:text-7xl font-extrabold tracking-tighter uppercase">
            Start a conversation
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase">→</span>
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
