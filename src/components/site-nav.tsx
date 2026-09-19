import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CloseMark, GlassButton, glassButton, trackSheen } from "./glass-button";

/** Everything the nav offers, in one place, so the desktop bar and the phone
 *  overlay can't drift apart. `sub` items are the discipline filters that hang
 *  off PROJECTS — a hover dropdown on desktop, indented pills on the phone. */
const NAV = {
  projects: [
    { label: "Experiential", tag: "Experiential" as const },
    { label: "Production / Scenic", tag: "Production/Scenic" as const },
    { label: "Architecture", tag: "Architecture" as const },
  ],
};

export function SiteNav({
  variant = "top",
}: {
  variant?: "top" | "top-transparent";
  /** legacy prop, ignored */
  mixBlend?: boolean;
}) {
  const isTransparent = variant === "top-transparent";
  const [menuOpen, setMenuOpen] = useState(false);

  /* Any navigation closes the overlay. Watching the router rather than
     handling it link-by-link means back/forward and the wordmark close it too. */
  const pathname = useRouterState({ select: (s) => s.location.href });
  useEffect(() => setMenuOpen(false), [pathname]);

  // Escape closes, and the page behind is held still while it's open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    /* Turning the phone to landscape can cross into md, where the overlay is
       display:none but its scroll lock would still be in force — the page
       behind would be frozen with nothing on screen explaining why. Crossing
       the breakpoint closes it. */
    const mq = window.matchMedia("(min-width: 768px)");
    const onCross = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onCross);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onCross);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        className={
          /* Single row at every width. The links used to wrap on phones, which
             pushed the bar to ~166px tall — taller than the top padding every
             page below it allows for, so headings and back buttons ended up
             underneath it. Below md the three links collapse into one MENU
             control instead, which keeps the bar one row high everywhere. */
          /* The backing fades rather than switching. This same bar stays
             mounted when a project opens over the feed — only its background
             drops away so the project's ombré shows through it — and swapping
             that instantly was what made a persistent header read as a
             replaced one. Nothing else about the bar animates. */
          "fixed top-0 left-0 w-full z-[110] px-6 md:px-10 py-4 md:py-6 flex items-center justify-end gap-4 md:gap-6 pointer-events-none transition-[background-color,backdrop-filter] duration-300 ease-cinematic " +
          (isTransparent ? "" : "bg-background/80 backdrop-blur-md")
        }
      >
        {/* No wordmark here anymore — the homepage's own "Reid Graham" hero
            heading is the logo/home link now (it links to "/" itself), and
            PROJECTS below already goes home too, so a second "Reid Graham
            Design" in this bar was just the same destination said twice.
            The bar itself is pointer-events-none and its two children below
            opt back into pointer-events-auto — otherwise this row's empty
            left-hand space (justify-end pushes the real controls right)
            sits on top of "Reid" in the hero heading underneath and
            swallows hover/clicks before they reach it, while "Graham" on
            the line below is clear of the bar and works fine. */}

        {/* Phone — one control, opening the full-screen menu below. */}
        <GlassButton
          quiet
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-label="Open menu"
          className="glass-button--touch md:hidden pointer-events-auto"
        >
          MENU
        </GlassButton>

        {/* Tablet and up — the full bar. */}
        <ul className="hidden md:flex items-center justify-end gap-2 md:gap-3 pointer-events-auto">
          {/* PROJECTS — primary, with hover dropdown of disciplines */}
          <li className="relative group">
            <Link
              to="/"
              activeProps={{
                className: glassButton({ quiet: true, sheen: true, className: "is-active" }),
              }}
              activeOptions={{ exact: true }}
              onMouseMove={trackSheen}
              className={glassButton({ quiet: true, sheen: true })}
            >
              PROJECTS
            </Link>
            <div
              className="absolute right-0 top-full pt-3 opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-cinematic"
            >
              {/* No fixed width. The list shrink-to-fits the longest label —
                  "Production / Scenic" — and w-full below sizes the other two
                  to match, so all three stay equal without a number being
                  picked. The 240px that used to be here left 46px of empty
                  space either side of even the longest one, and 79px around
                  "Experiential". */}
              <ul className="flex flex-col gap-2">
                {NAV.projects.map((p) => (
                  <li key={p.tag}>
                    <Link
                      to="/"
                      search={{ tag: p.tag }}
                      onMouseMove={trackSheen}
                      className={glassButton({
                        quiet: true,
                        sheen: true,
                        className: "w-full justify-center",
                      })}
                    >
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
          {/* Visualizations: nav entry pulled while that section is still a
              work in progress. The route, its pages, and every link into it
              from elsewhere on the site are untouched — this only removes
              the one path a visitor browsing normally would find it through.
              Restore by putting this <li> back. */}
          <li>
            <Link
              to="/contact"
              activeProps={{
                className: glassButton({ quiet: true, sheen: true, className: "is-active" }),
              }}
              onMouseMove={trackSheen}
              className={glassButton({ quiet: true, sheen: true })}
            >
              LET'S CONNECT!
            </Link>
          </li>
        </ul>
      </nav>

      {/* Phone menu. Full screen and solid black, so it reads as the site
          stepping aside rather than as a tray over it. The destinations are set
          in the display face at headline scale — the same type the pages use —
          and enter with the site's one text motion, the left-to-right wipe,
          staggered down the list. The discipline filters stay pills, matching
          the dropdown they replace. */}
      {menuOpen && (
        <div
          id="site-menu"
          className="fixed inset-0 z-[120] bg-background md:hidden flex flex-col animate-fade-in-fast"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* Mirrors the bar it opened from — no wordmark there either now. */}
          <div className="flex items-center justify-end gap-4 px-6 py-4">
            <GlassButton
              quiet
              sheen
              onMouseMove={trackSheen}
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="glass-button--touch"
            >
              <CloseMark />
            </GlassButton>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-16 pt-8">
            <ul className="flex flex-col gap-7">
              <li>
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  className="font-display font-black uppercase tracking-[-0.02em] leading-none text-4xl hover:text-accent transition-colors animate-title-lr block"
                >
                  Projects
                </Link>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {NAV.projects.map((p, i) => (
                    <li key={p.tag}>
                      <Link
                        to="/"
                        search={{ tag: p.tag }}
                        onMouseMove={trackSheen}
                        className={glassButton({
                          touch: true,
                          sheen: true,
                          className: "animate-title-lr",
                        })}
                        style={{ animationDelay: `${0.08 + i * 0.06}s` }}
                      >
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="font-display font-black uppercase tracking-[-0.02em] leading-none text-4xl hover:text-accent transition-colors animate-title-lr block"
                  style={{ animationDelay: "0.26s" }}
                >
                  Connect
                </Link>
              </li>
            </ul>

            <a
              href="mailto:reidjgraham@gmail.com"
              className="mt-14 block font-serif italic text-lg text-foreground/60 hover:text-accent transition-colors"
            >
              reidjgraham@gmail.com
            </a>
          </div>
        </div>
      )}
    </>
  );
}
