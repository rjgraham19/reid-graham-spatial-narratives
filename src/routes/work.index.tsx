import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import {
  PROJECT_TAGS,
  taggedProjects,
  type Project,
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
      className={`px-5 py-2 rounded-full border text-xs md:text-sm uppercase tracking-[0.2em] transition-colors duration-[350ms] ${
        active
          ? "bg-foreground text-black border-foreground"
          : "border-foreground/30 text-foreground/45 hover:border-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

function ProjectTile({ project }: { project: Project }) {
  return (
    <li className="relative">
      <Link
        to="/work/$hub/$slug"
        params={{ hub: project.hub, slug: project.slug }}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        aria-label={`Open ${project.title}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-md bg-black">
          <img
            src={project.cover}
            alt={project.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.06] transition-all duration-[900ms] ease-cinematic"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-95 group-hover:opacity-85 transition-opacity duration-500" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="font-display font-black uppercase tracking-tight text-xl md:text-2xl lg:text-3xl leading-[0.95] text-balance text-foreground group-hover:text-accent transition-colors line-clamp-3">
              {project.title}
            </h2>
          </div>
        </div>
      </Link>
    </li>
  );
}

