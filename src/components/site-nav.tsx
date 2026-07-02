import { Link } from "@tanstack/react-router";

export function SiteNav({ mixBlend = true }: { mixBlend?: boolean }) {
  return (
    <nav
      className={
        "fixed top-0 left-0 w-full z-50 px-6 md:px-10 py-8 flex justify-between items-end " +
        (mixBlend ? "mix-blend-difference text-foreground" : "text-foreground")
      }
    >
      <Link to="/" className="flex flex-col group">
        <span className="font-display font-bold text-xl tracking-tighter uppercase">
          Reid Graham
        </span>
        <span className="text-[10px] tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100 transition-opacity">
          Experiential Design / Architecture
        </span>
      </Link>
      <div className="flex gap-6 md:gap-12 text-[11px] font-medium tracking-[0.2em] uppercase">
        <Link
          to="/work"
          activeProps={{ className: "text-accent" }}
          className="hover:text-accent transition-colors"
        >
          Work
        </Link>
        <Link
          to="/about"
          activeProps={{ className: "text-accent" }}
          className="hover:text-accent transition-colors"
        >
          About
        </Link>
        <Link
          to="/contact"
          activeProps={{ className: "text-accent" }}
          className="hover:text-accent transition-colors"
        >
          Contact
        </Link>
      </div>
    </nav>
  );
}
