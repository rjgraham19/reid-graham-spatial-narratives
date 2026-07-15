import { Link } from "@tanstack/react-router";

type NavItem = { label: string; to: string; params?: Record<string, string> };

const NAV: NavItem[] = [
  { label: "PROJECTS", to: "/work" },
  { label: "VISUALIZATIONS", to: "/work/$hub", params: { hub: "visualizations" } },
  { label: "CONTACT", to: "/contact" },
];

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
        className="font-display font-black uppercase tracking-[0.02em] text-sm md:text-base hover:text-accent transition-colors"
      >
        Reid Graham
      </Link>
      <ul className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
        {NAV.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              params={item.params as never}
              activeProps={{ className: "pill pill-active" }}
              className="pill"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
