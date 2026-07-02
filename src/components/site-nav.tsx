import { Link } from "@tanstack/react-router";

type NavItem = { label: string; to: string; params?: Record<string, string> };

const NAV: NavItem[] = [
  { label: "HOME", to: "/" },
  { label: "PRODUCTION/SCENIC", to: "/work/$hub", params: { hub: "production-scenic" } },
  { label: "ARCHITECTURE", to: "/work/$hub", params: { hub: "architecture" } },
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
        "fixed top-0 left-0 w-full z-50 px-6 md:px-10 py-6 flex justify-start " +
        (isTransparent ? "" : "bg-background/80 backdrop-blur-md")
      }
    >
      <ul className="flex flex-wrap items-center gap-2 md:gap-3">
        {NAV.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              params={item.params as never}
              activeOptions={{ exact: item.to === "/" }}
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
