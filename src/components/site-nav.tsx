import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/** Everything the nav offers, in one place, so the desktop bar and the phone
 *  overlay can't drift apart. `sub` items are the discipline filters that hang
 *  off PROJECTS — a hover dropdown on desktop, indented pills on the phone. */
const NAV = {
  projects: [
    { label: "Production / Scenic", tag: "Production/Scenic" as const },
    { label: "Architecture", tag: "Architecture" as const },
    { label: "Experiential", tag: "Experiential" as const },
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
          "fixed top-0 left-0 w-full z-50 px-6 md:px-10 py-4 md:py-6 flex items-center justify-between gap-4 md:gap-6 " +
          (isTransparent ? "" : "bg-background/80 backdrop-blur-md")
        }
      >
        <Link
          to="/"
          className="font-display font-black uppercase tracking-[0.02em] text-sm md:text-base hover:text-accent transition-colors whitespace-nowrap"
        >
          {/* "Design" set thin against the bold name, echoing the homepage
              wordmark's heavy/light pairing. Weight only — no colour override,
              so the hover state still applies to the whole wordmark. */}
          Reid Graham <span className="font-thin">Design</span>
        </Link>

        {/* Phone — one control, opening the full-screen menu below. */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-label="Open menu"
          className="pill nav-fade pill-touch md:hidden"
        >
          MENU
        </button>

        {/* Tablet and up — the full bar. */}
        <ul className="hidden md:flex items-center justify-end gap-2 md:gap-3">
          {/* PROJECTS — primary, with hover dropdown of disciplines */}
          <li className="relative group">
            <Link
              to="/work"
              activeProps={{ className: "pill nav-fade nav-fade-active" }}
              activeOptions={{ exact: false }}
              className="pill nav-fade"
            >
              PROJECTS
            </Link>
            <div
              className="absolute right-0 top-full pt-3 opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-cinematic"
            >
              <ul className="flex flex-col gap-2 min-w-[240px]">
                {NAV.projects.map((p) => (
                  <li key={p.tag}>
                    <Link
                      to="/work"
                      search={{ tag: p.tag }}
                      className="pill nav-fade w-full justify-center"
                    >
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
          <li>
            <Link
              to="/work/$hub"
              params={{ hub: "visualizations" }}
              activeProps={{ className: "pill nav-fade nav-fade-active" }}
              className="pill nav-fade"
            >
              VISUALIZATIONS
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              activeProps={{ className: "pill nav-fade nav-fade-active" }}
              className="pill nav-fade"
            >
              CONNECT
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
          className="fixed inset-0 z-[60] bg-background md:hidden flex flex-col animate-fade-in-fast"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* Mirrors the bar it opened from, so the wordmark doesn't jump. */}
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <span className="font-display font-black uppercase tracking-[0.02em] text-sm">
              Reid Graham <span className="font-thin">Design</span>
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="pill nav-fade pill-touch"
            >
              CLOSE ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-16 pt-8">
            <ul className="flex flex-col gap-7">
              <li>
                <Link
                  to="/work"
                  activeOptions={{ exact: false }}
                  className="font-display font-black uppercase tracking-[-0.02em] leading-none text-4xl hover:text-accent transition-colors animate-title-lr block"
                >
                  Projects
                </Link>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {NAV.projects.map((p, i) => (
                    <li key={p.tag}>
                      <Link
                        to="/work"
                        search={{ tag: p.tag }}
                        className="pill pill-touch animate-title-lr"
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
                  to="/work/$hub"
                  params={{ hub: "visualizations" }}
                  className="font-display font-black uppercase tracking-[-0.02em] leading-none text-4xl hover:text-accent transition-colors animate-title-lr block"
                  style={{ animationDelay: "0.26s" }}
                >
                  Visualizations
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="font-display font-black uppercase tracking-[-0.02em] leading-none text-4xl hover:text-accent transition-colors animate-title-lr block"
                  style={{ animationDelay: "0.34s" }}
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
