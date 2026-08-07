import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProjectTile } from "@/components/project-tile";
import {
  PROJECT_TAGS,
  taggedProjects,
  type ProjectTag,
} from "@/lib/projects";

type WorkSearch = { tag?: ProjectTag };

export const Route = createFileRoute("/work/")({
  validateSearch: (search: Record<string, unknown>): WorkSearch => {
    const raw = typeof search.tag === "string" ? search.tag : undefined;
    const tag = PROJECT_TAGS.find((t) => t === raw);
    return tag ? { tag } : {};
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
  const { tag } = Route.useSearch();
  const all = taggedProjects();
  const projects = tag ? all.filter((p) => p.tags?.includes(tag)) : all;

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
              <ProjectTile key={p.slug} project={p} />
            ))}
          </ul>
        )}
      </section>

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

