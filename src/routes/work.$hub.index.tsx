import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProjectTile } from "@/components/project-tile";
import { HUBS, projectsByHub, type Hub, type Project } from "@/lib/projects";

const HUB_SLUGS = new Set(HUBS.map((h) => h.slug));

// Old hubs now consolidated into the unified /work feed with tag filters.
const HUB_TAG_REDIRECT: Partial<Record<Hub, "Production/Scenic" | "Architecture">> = {
  "production-scenic": "Production/Scenic",
  architecture: "Architecture",
};

export const Route = createFileRoute("/work/$hub/")({
  loader: ({ params }) => {
    if (!HUB_SLUGS.has(params.hub as Hub)) throw notFound();
    const tag = HUB_TAG_REDIRECT[params.hub as Hub];
    if (tag) {
      throw redirect({ to: "/work", search: { tag } });
    }
    const hub = HUBS.find((h) => h.slug === params.hub)!;
    return { hub, projects: projectsByHub(hub.slug) };
  },
  head: ({ params }) => {
    const hub = HUBS.find((h) => h.slug === params.hub);
    const title = hub ? `${hub.title} — Reid Graham` : "Work — Reid Graham";
    const desc = hub?.description ?? "";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(hub ? [{ property: "og:image", content: hub.cover }] : []),
      ],
    };
  },
  component: HubPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-foreground/60">Section not found.</p>
    </div>
  ),
});

function HubPage() {
  const { hub, projects } = Route.useLoaderData();

  return (
    <div className="bg-black min-h-screen">
      <SiteNav />

      {/* Header + grid — mirrors the /work feed so the two read consistently */}
      <section className="px-6 md:px-12 lg:px-16 pt-32 md:pt-40 pb-16 md:pb-24">
        {/* clamp on the phone end so a long one-word hub name ("Visualizations")
            scales with the screen instead of running under the clipped edge;
            overflow-wrap is the last-ditch guard if it still can't fit. */}
        <h1 className="font-display font-black uppercase tracking-tight text-[clamp(1.9rem,6.5vw,3rem)] md:text-7xl lg:text-8xl leading-[0.9] text-foreground mb-8 md:mb-10 [overflow-wrap:anywhere]">
          {hub.title}
        </h1>

        <p className="font-display font-light text-lg md:text-2xl text-foreground/80 max-w-3xl text-balance mb-10 md:mb-14">
          {hub.description}
        </p>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {projects.map((p: Project, i: number) => (
            <ProjectTile key={p.slug} project={p} appearIndex={i} />
          ))}
        </ul>
      </section>

      {/* Back to unified projects feed */}
      <section className="border-t border-border">
        <Link
          to="/work"
          className="group block px-6 md:px-12 py-12 md:py-16 hover:bg-secondary/40 transition-colors"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-3">
            Return to
          </p>
          <h3 className="font-display font-black uppercase tracking-tight text-3xl md:text-4xl group-hover:text-accent transition-colors">
            ← All Projects
          </h3>
          <p className="mt-3 text-sm text-foreground/60 max-w-md">
            Browse the full body of work, filterable by discipline.
          </p>
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
