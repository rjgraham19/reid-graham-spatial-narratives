import { Link } from "@tanstack/react-router";
import { accentTitleColor, type Project } from "@/lib/projects";

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
  appearIndex,
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
   */
  onOpen?: (project: Project) => void;
  /**
   * This tile's position in its grid. When set, the tile fades and lifts in on
   * mount with a delay proportional to the index, so a grid resolves
   * left-to-right, top-to-bottom in a quick run (see `animate-tile-in` in
   * styles.css). The /work feed remounts the list on a filter change so it
   * replays for each new set; omit it and the tile renders statically.
   */
  appearIndex?: number;
}) {
  /* The project's accent, from the same `accentColor` that tints its overlay —
     used as given, except where it is too dark to read as a hover, which
     accentTitleColor lifts. Set here so the title inherits it; left unset the
     title falls through to the site accent, which is what it has always used.
     The entrance delay rides on the same style object when the grid asked for
     one — capped so a large filter ("All") still finishes quickly instead of
     trailing a visible tail. */
  const style = {
    ...(project.accentColor
      ? { "--project-accent": accentTitleColor(project.accentColor) }
      : {}),
    ...(appearIndex != null ? { animationDelay: `${Math.min(appearIndex, 12) * 35}ms` } : {}),
  } as React.CSSProperties;

  return (
    <li
      className={appearIndex != null ? "relative animate-tile-in" : "relative"}
      style={Object.keys(style).length ? style : undefined}
    >
      <Link
        to="/work/$hub/$slug"
        params={{ hub: project.hub, slug: project.slug }}
        onClick={(e) => {
          if (!onOpen) return;
          // Let the browser handle any click that means "somewhere else".
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          onOpen(project);
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
          {/* Insets are uneven on purpose. leading-[0.95] is tighter than the
              font's natural height, so the glyphs hang about 6px below their
              box — at a matched 16px inset the text read as 16px from the left
              but under 10px from the bottom, sitting high and right in the
              corner. The bottom inset is the larger number so the two optical
              gaps come out level. */}
          <div className="absolute bottom-2.5 left-1.5 right-3 md:bottom-3 md:left-1.5 md:right-4">
            {/* No transition-colors here — the scale and the colour share one
                transition in .project-title so they can't drift apart.

                One flat size from the sm breakpoint up (was a ramp to
                text-3xl): the grid narrows the tile as it adds columns, so a
                size that looked right at three columns overflowed a ~185px
                title box at four and five, and line-clamp's overflow:hidden
                clipped the longest single words — "Lollapalooza",
                "Reshuffling" — rather than wrapping. 1.35rem clears every
                column count with room to spare; overflow-wrap:anywhere is the
                last-ditch floor so nothing is ever cut, only wrapped. */}
            <h2 className="project-title font-display font-black uppercase tracking-tight text-base sm:text-[1.4rem] leading-[0.95] text-balance text-foreground line-clamp-3 [overflow-wrap:anywhere]">
              {project.title}
            </h2>
          </div>
        </div>
      </Link>
    </li>
  );
}
