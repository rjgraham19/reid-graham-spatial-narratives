import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/projects";

/**
 * Square grid thumbnail, shared by the unified /work feed and the
 * Visualizations hub page so the two can't drift apart.
 *
 * Deliberately minimal: highlight image + project title only. No index
 * number, no subtitle, no hover-collage pop-out, no "Enter" affordance —
 * the tile itself is the affordance.
 */
export function ProjectTile({
  project,
  onOpen,
}: {
  project: Project;
  /**
   * When supplied, a plain click opens the project as a panel over the feed
   * instead of navigating. It stays a real link underneath, so middle-click,
   * cmd-click, "open in new tab" and no-JS all still get the full page — the
   * panel is an enhancement rather than a replacement.
   *
   * The feed only supplies it on a wide screen. Left out — on a phone or a
   * tablet — the tile is exactly the link it looks like, and the project opens
   * as its own full page.
   *
   * Receives the tile's own rectangle so the panel can expand out of it and
   * collapse back into it.
   */
  onOpen?: (project: Project, originRect: DOMRect) => void;
}) {
  return (
    <li
      className="relative"
      /* The project's accent, from the same `accentHue` that tints its
         overlay. Set here so the title inherits it; left unset the title
         falls through to the site accent, which is what it has always used. */
      style={
        typeof project.accentHue === "number"
          ? ({
              "--project-accent": `hsl(${project.accentHue} ${project.accentSaturation ?? 100}% 62%)`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <Link
        to="/work/$hub/$slug"
        params={{ hub: project.hub, slug: project.slug }}
        onClick={(e) => {
          if (!onOpen) return;
          // Let the browser handle any click that means "somewhere else".
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          onOpen(project, e.currentTarget.getBoundingClientRect());
        }}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        aria-label={`Open ${project.title}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-md bg-black">
          <img
            src={project.highlight ?? project.cover}
            alt={project.title}
            loading="lazy"
            style={{ objectPosition: project.highlightPosition ?? "50% 50%" }}
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.06] transition-all duration-[900ms] ease-cinematic"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-95 group-hover:opacity-85 transition-opacity duration-500" />
          {/* Two tiles to a row on a phone leaves each about 156px square, and
              at the desktop title size a three-line name like "You Can't Take It
              With You!" ate a third of the image. A step down in size and a
              tighter inset give the picture back its tile without changing the
              proportions of the composition. */}
          <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-4">
            <h2 className="project-title font-display font-black uppercase tracking-tight text-base sm:text-xl md:text-2xl lg:text-3xl leading-[0.95] text-balance text-foreground transition-colors line-clamp-3">
              {project.title}
            </h2>
          </div>
        </div>
      </Link>
    </li>
  );
}
