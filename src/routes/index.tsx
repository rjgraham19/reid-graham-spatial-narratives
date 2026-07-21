import { createFileRoute, Link } from "@tanstack/react-router";
import { HERO_URL } from "@/lib/projects";
import { SiteNav } from "@/components/site-nav";

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
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <SiteNav variant="top-transparent" />
      {/* Split screen: text left, phone-booth image right (right = clickable → /contact) */}
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* LEFT — text */}
        <div className="relative z-10 flex flex-col justify-end px-6 md:px-12 lg:px-16 py-10 md:py-14 pt-28 md:pt-32">
          <div>
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
        <div className="relative order-first md:order-last min-h-[60vh] md:min-h-screen">
          <Link
            to="/contact"
            aria-label="Contact — pick up the phone"
            className="group absolute inset-0 block overflow-hidden"
          >
            <img
              src={HERO_URL}
              alt="Payphone booth in an overgrown, neon-lit environment — pick up to reach Reid"
              className="w-full h-full object-cover"
            />
            {/* Ambient darken toward the split line */}
            <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-background via-background/40 to-transparent hidden md:block" />
            <div className="absolute inset-0 md:hidden bg-background/50" />
            {/* Ring the phone-booth hotspot subtly on hover */}
            <span
              className="pointer-events-none absolute right-6 bottom-6 md:right-10 md:bottom-10 pill pill-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            >
              PICK UP · CONTACT
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
