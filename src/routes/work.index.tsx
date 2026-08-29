import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProjectTile } from "@/components/project-tile";
import { ProjectPanel } from "@/components/project-panel";
import { useCanShowPanel } from "@/hooks/use-media-query";
import { glassButton } from "@/components/glass-button";
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

  /* resetScroll: false on both. Opening and closing the panel is a change of
     search param, not a change of page — the router's default is to send the
     reader to the top, which threw away the position they were browsing from
     and undid the panel's own restore on the way out. The feed should be
     exactly where they left it, with the tile they clicked still under the
     cursor. */
  const openProject = useCallback(
    (p: Project) => {
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

  /* Shuffling to the next/previous project while the panel is open — same
     search-param swap as opening one from a tile, so the panel itself never
     remounts, only the iframe's `url` prop changes and it navigates to the
     new project. Steps through `projects` — the currently active tag filter,
     if any — so the arrows move through what's actually in the feed behind
     the panel, not the unfiltered catalogue. Wraps at both ends, mirroring
     the same-hub "Next" link's modulo pattern on the full project page. */
  const openIndex = open ? projects.findIndex((p) => p.slug === open.slug) : -1;
  const showPanelNav = open != null && openIndex !== -1 && projects.length > 1;
  const openPrev = useCallback(() => {
    if (openIndex === -1) return;
    openProject(projects[(openIndex - 1 + projects.length) % projects.length]);
  }, [openIndex, openProject, projects]);
  const openNext = useCallback(() => {
    if (openIndex === -1) return;
    openProject(projects[(openIndex + 1) % projects.length]);
  }, [openIndex, openProject, projects]);

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
      {/* With a project open the nav sits above the tinted glass rather than
          behind it, so it stays crisp and clickable. Its usual translucent bar
          would then lay a black band across the top of the perimeter and hide
          the band of colour the overlay is carefully graded to show, so it
          drops to the transparent variant for the duration. The links are
          glass tiles with their own surface, so they stay legible against
          whatever colour they end up over. */}
      <SiteNav variant={canPanel && open ? "top-transparent" : "top"} />

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
          /* Keyed on the active filter so switching disciplines remounts the
             whole list — that's what replays the staggered tile entrance for
             each new set. It deliberately does NOT depend on `project`, so
             opening or closing a project panel leaves the grid mounted and
             still. */
          <ul
            key={tag ?? "all"}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
          >
            {projects.map((p, i) => (
              /* onOpen only on a wide screen. Without it the tile stays the
                 plain link it renders as, so a tap goes straight to the full
                 project page. `appearIndex` drives the left-to-right fade-in. */
              <ProjectTile
                key={p.slug}
                project={p}
                appearIndex={i}
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
          /* Straight from the project data. Projects with no accentColor get
             the neutral smoked glass, so nothing needs adding for them. */
          accentColor={open.accentColor}
          onPrev={showPanelNav ? openPrev : undefined}
          onNext={showPanelNav ? openNext : undefined}
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
    /* The same glass pane as the nav, from the same component — these are
       navigation controls too, and they sat two rows below the nav in a
       different shape, radius and type size.

       Active reads the way it does in the nav: the label at full strength
       against the others at half. That replaces the filled-white pill this
       row used to use for its selected state — a solid fill is the one thing
       the glass surface can't also be. */
    <Link
      to="/work"
      search={to}
      className={glassButton({
        quiet: true,
        touch: true,
        sheen: true,
        className: active ? "is-active" : "",
      })}
      /* Feed the cursor position to the sheen layer as percentages. Cheap —
         two custom-property writes, no React state, no re-render. Skipped on
         coarse pointers, where there's no cursor to follow. */
      onMouseMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
      }}
    >
      {label}
    </Link>
  );
}

