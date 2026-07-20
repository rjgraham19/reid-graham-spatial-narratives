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
  return t.replace("/", " ");
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
            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-[900ms] ease-cinematic"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
          <div className="absolute bottom-3 left-3 right-3">
            <h2 className="font-display font-black uppercase tracking-tight text-base md:text-lg leading-[0.95] text-balance group-hover:text-accent transition-colors line-clamp-2">
              {project.title}
            </h2>
            {project.tags && project.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] tracking-[0.25em] uppercase text-foreground/70 group-hover:text-foreground transition-colors"
                  >
                    {formatTag(t)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
