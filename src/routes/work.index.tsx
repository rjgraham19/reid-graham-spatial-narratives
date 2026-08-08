import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProjectTile } from "@/components/project-tile";
import { ProjectPanel } from "@/components/project-panel";
import { useCanShowPanel } from "@/hooks/use-media-query";
import {
  PROJECT_TAGS,
  taggedProjects,
  type Project,
  type ProjectTag,
} from "@/lib/projects";

/** `project` is the slug of the one shown in the panel over the feed. */
type WorkSearch = { tag?: ProjectTag; project?: string };

export const Route = createFileRoute("/work/")({
  validateSearch: (search: Record<string, unknown>): WorkSearch => {
    const raw = typeof search.tag === "string" ? search.tag : undefined;
    const tag = PROJECT_TAGS.find((t) => t === raw);
    const project = typeof search.project === "string" ? search.project : undefined;
    return { ...(tag ? { tag } : {}), ...(project ? { project } : {}) };
  },
  head: () => ({
    meta: [
      { title: "Projects — Reid Graham" },
      {
        name: "description",
        content:
          "The full body of work — production, scenic, architecture, and experiential design projects by Reid Graham.",
      },
      { property: "og:title", content: "Projects — Reid Graham" },
      {
        property: "og:description",
        content:
          "The full body of work — production, scenic, architecture, and experiential design projects by Reid Graham.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { tag, project } = Route.useSearch();
  const all = taggedProjects();
  const projects = tag ? all.filter((p) => p.tags?.includes(tag)) : all;

  /* Which project is panelled lives in the URL as ?project=<slug>, so Back
     closes it and the link is shareable. It has to go through the router
     rather than history.pushState: pushing /work/<hub>/<slug> directly made
     the router navigate the top-level route, which unmounted the feed the
     panel is supposed to be sitting on top of. A search param keeps the
     route — and so the feed — exactly where it is. */
  const navigate = Route.useNavigate();
  const open = project ? all.find((p) => p.slug === project) ?? null : null;

  /* The panel is a wide-screen treatment only. `undefined` while the query is
     still being measured, so nothing renders until it's known — a phone never
     paints a frame of the panel before correcting itself. */
  const canPanel = useCanShowPanel();

  /* The tile's rectangle at the moment it was clicked, so the panel knows
     where to expand out of and collapse back into. A ref rather than state:
     it's set in the click handler, which is already followed by the navigate
     that re-renders, so there's nothing to gain from a second render — and
     the panel reads it on mount, which happens after. Null on a direct
     ?project= visit, where the panel falls back to a plain fade. */
  const originRectRef = useRef<DOMRect | null>(null);

  /* resetScroll: false on both. Opening and closing the panel is a change of
     search param, not a change of page — the router's default is to send the
     reader to the top, which threw away the position they were browsing from
     and undid the panel's own restore on the way out. The feed should be
     exactly where they left it, with the tile they clicked still under the
     cursor. */
  const openProject = useCallback(
    (p: Project, originRect: DOMRect) => {
      originRectRef.current = originRect;
      void navigate({
        search: (prev) => ({ ...prev, project: p.slug }),
        resetScroll: false,
      });
    },
    [navigate],
  );

  const closeProject = useCallback(() => {
    void navigate({
      search: (prev) => ({ ...prev, project: undefined }),
      resetScroll: false,
    });
  }, [navigate]);

  /* A ?project= link opened on a phone — shared from a desktop, or the window
     narrowed while the panel was up. There's no panel at this width to show
     it in, so the project takes over as its own full page, which is what it
     would have done had the link been followed here in the first place. */
  const toProject = useNavigate();
  useEffect(() => {
    if (canPanel === false && open) {
      void toProject({
        to: "/work/$hub/$slug",
        params: { hub: open.hub, slug: open.slug },
        replace: true,
      });
    }
  }, [canPanel, open, toProject]);

  return (
    <div className="bg-black min-h-screen">
      <SiteNav />

      <section className="px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-16 md:pb-24">
        <h1 className="font-display font-black uppercase tracking-tight text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-foreground mb-8 md:mb-10">
          Projects
        </h1>

        <div className="flex flex-wrap gap-2 md:gap-3 mb-10 md:mb-14">
          <FilterPill to={{}} active={!tag} label="All" />
          {PROJECT_TAGS.map((t) => (
            <FilterPill
              key={t}
              to={{ tag: t }}
              active={tag === t}
              label={formatTag(t)}
            />
          ))}
        </div>

        {projects.length === 0 ? (
          <p className="text-foreground/60">No projects match this filter yet.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {projects.map((p) => (
              /* onOpen only on a wide screen. Without it the tile stays the
                 plain link it renders as, so a tap goes straight to the full
                 project page. */
              <ProjectTile
                key={p.slug}
                project={p}
                onOpen={canPanel ? openProject : undefined}
              />
            ))}
          </ul>
        )}
      </section>

      {canPanel && open && (
        <ProjectPanel
          url={`/work/${open.hub}/${open.slug}`}
          title={open.title}
          onClose={closeProject}
          /* Straight from the project data. Projects with no accentHue get
             the neutral smoked glass, so nothing needs adding for them. */
          accentHue={open.accentHue}
          accentSaturation={open.accentSaturation}
          originRect={originRectRef.current}
        />
      )}

      <SiteFooter />
    </div>
  );
}

function formatTag(t: ProjectTag) {
  return t.replace("/", " / ");
}

function FilterPill({
  to,
  active,
  label,
}: {
  to: WorkSearch;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      to="/work"
      search={to}
      // Display family at extra-light, matching the pills and the thin
      // "Design" in the wordmark. This row previously fell through to the body
      // font, which is why it read as a second typeface.
      // inline-flex + min-h-11 gives the row the 44px a finger needs on a
      // phone without changing how it looks anywhere else — the label stays
      // centred, and from md the padding governs the height as before.
      className={`font-display font-extralight inline-flex items-center min-h-11 md:min-h-0 px-5 py-2 rounded-full border text-xs md:text-sm uppercase tracking-[0.2em] transition-colors duration-[350ms] ${
        active
          ? "bg-foreground text-black border-foreground"
          : "border-foreground/30 text-foreground/45 hover:border-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

