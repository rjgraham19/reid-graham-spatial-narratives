import { Link } from "@tanstack/react-router";

export function SiteNav({
  variant = "top",
}: {
  variant?: "top" | "top-transparent";
  /** legacy prop, ignored */
  mixBlend?: boolean;
}) {
  const isTransparent = variant === "top-transparent";
  return (
    <nav
      className={
        "fixed top-0 left-0 w-full z-50 px-6 md:px-10 py-6 flex items-center justify-between gap-6 " +
        (isTransparent ? "" : "bg-background/80 backdrop-blur-md")
      }
    >
      <Link
        to="/"
        className="font-display font-black uppercase tracking-[0.02em] text-sm md:text-base hover:text-accent transition-colors whitespace-nowrap"
      >
        Reid Graham Design
      </Link>
      <ul className="flex flex-wrap items-center justify-end gap-5 md:gap-7">
        {/* PROJECTS — primary, with hover dropdown of disciplines */}
        <li className="relative group">
          <Link
            to="/work"
            activeProps={{ className: "nav-link nav-link-active" }}
            activeOptions={{ exact: false }}
            className="nav-link"
          >
            PROJECTS
          </Link>
          <div
            className="absolute right-0 top-full pt-3 opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200 ease-cinematic"
          >
            <ul className="flex flex-col gap-2 p-3 rounded-lg bg-background/95 backdrop-blur-md border border-border shadow-2xl min-w-[240px]">
              <li>
                <Link
                  to="/work"
                  search={{ tag: "Production/Scenic" }}
                  className="pill w-full justify-start"
                >
                  Production / Scenic
                </Link>
              </li>
              <li>
                <Link
                  to="/work"
                  search={{ tag: "Architecture" }}
                  className="pill w-full justify-start"
                >
                  Architecture
                </Link>
              </li>
              <li>
                <Link
                  to="/work"
                  search={{ tag: "Experiential" }}
                  className="pill w-full justify-start"
                >
                  Experiential
                </Link>
              </li>
            </ul>
          </div>
        </li>
        <li>
          <Link
            to="/work/$hub"
            params={{ hub: "visualizations" }}
            activeProps={{ className: "nav-link nav-link-active" }}
            className="nav-link"
          >
            VISUALIZATIONS
          </Link>
        </li>
        <li>
          <Link
            to="/contact"
            activeProps={{ className: "nav-link nav-link-active" }}
            className="nav-link"
          >
            CONTACT
          </Link>
        </li>
      </ul>
    </nav>
  );
}
