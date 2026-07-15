import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
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
    <div>
      <SiteNav />

      {/* Header */}
      <header className="pt-32 md:pt-40 pb-16 px-6 md:px-12 lg:px-16 border-b border-border">
        <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
          Chapter {hub.chapter}
        </p>
        <h1 className="font-display font-black uppercase tracking-[-0.03em] leading-[0.9] text-5xl md:text-8xl animate-reveal">
          {hub.title}
        </h1>
        <p className="mt-6 font-display font-light text-lg md:text-2xl text-foreground/80 max-w-3xl text-balance">
          {hub.description}
        </p>
      </header>

      {/* Square grid of projects with hover-collage previews */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50">
            {projects.length} Projects
          </p>
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 hidden md:block">
            Hover to preview · Click to enter
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-14">
          {projects.map((p: Project, idx: number) => (
            <ProjectTile key={p.slug} project={p} index={idx} hub={hub.slug} />
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

function ProjectTile({
  project,
  index,
  hub,
}: {
  project: Project;
  index: number;
  hub: Hub;
}) {
  // Build up to 3 collage images from `collage` or fallback media.
  const collageSources = (project.collage && project.collage.length > 0
    ? project.collage
    : project.media.slice(1).map((m) => m.src)
  ).slice(0, 3);

  // Deterministic little offsets so the collage feels loose, not gridded.
  const offsets = [
    { x: "-38%", y: "-22%", r: "-6deg" },
    { x: "42%", y: "-14%", r: "5deg" },
    { x: "-10%", y: "44%", r: "-3deg" },
  ];

  return (
    <li className="relative">
      <Link
        to="/work/$hub/$slug"
        params={{ hub, slug: project.slug }}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        aria-label={`Open ${project.title}`}
      >
        {/* Collage layer — pops out on hover, absolute so it can breach the tile */}
        <div className="relative aspect-square">
          {collageSources.map((src, i) => {
            const o = offsets[i] ?? offsets[0];
            return (
              <img
                key={i}
                src={src}
                alt=""
                aria-hidden
                loading="lazy"
                className="pointer-events-none absolute left-1/2 top-1/2 w-3/5 h-3/5 object-cover rounded-md shadow-2xl ring-1 ring-border opacity-0 -translate-x-1/2 -translate-y-1/2 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 ease-cinematic z-10"
                style={{
                  transitionDelay: `${100 + i * 90}ms`,
                  ["--tx" as string]: o.x,
                  ["--ty" as string]: o.y,
                  transform: `translate(calc(-50% + var(--tx, 0px)), calc(-50% + var(--ty, 0px))) rotate(${o.r})`,
                }}
              />
            );
          })}

          {/* Main square tile */}
          <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
            <img
              src={project.cover}
              alt={project.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-[900ms] ease-cinematic"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-foreground/70">
              0{index + 1}
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl leading-[0.95] text-balance group-hover:text-accent transition-colors">
                {project.title}
              </h2>
              <p className="mt-2 text-[10px] tracking-[0.25em] uppercase text-foreground/70 line-clamp-1">
                {project.subtitle}
              </p>
            </div>
            <span className="absolute top-4 right-4 pill opacity-0 group-hover:opacity-100 transition-opacity">
              Enter →
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
