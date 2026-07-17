import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
    <div>
      <SiteNav />

      {/* Header */}
      <header className="pt-32 md:pt-40 pb-12 px-6 md:px-12 lg:px-16 border-b border-border">
        <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 mb-4">
          The Work
        </p>
        <h1 className="font-display font-black uppercase tracking-[-0.03em] leading-[0.9] text-5xl md:text-8xl">
          Projects
        </h1>
        <p className="mt-6 font-display font-light text-lg md:text-2xl text-foreground/80 max-w-3xl text-balance">
          Production, scenic, architecture, and experiential — one continuous feed.
          Filter by discipline.
        </p>

        {/* Tag filters */}
        <div className="mt-10 flex flex-wrap items-center gap-2">
          <Link
            to="/work"
            search={{}}
            className={`pill ${!tag ? "pill-active" : ""}`}
          >
            All
          </Link>
          {PROJECT_TAGS.map((t) => (
            <Link
              key={t}
              to="/work"
              search={{ tag: t }}
              className={`pill ${tag === t ? "pill-active" : ""}`}
            >
              {t}
            </Link>
          ))}
        </div>
      </header>

      {/* Grid */}
      <section className="px-6 md:px-12 lg:px-16 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50">
            {projects.length} {projects.length === 1 ? "Project" : "Projects"}
            {tag ? ` · ${tag}` : ""}
          </p>
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/50 hidden md:block">
            Hover to preview · Click to enter
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="text-foreground/60">No projects match this filter yet.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {projects.map((p, idx) => (
              <ProjectTile key={p.slug} project={p} index={idx} />
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function ProjectTile({ project, index }: { project: Project; index: number }) {
  const collageSources = (project.collage && project.collage.length > 0
    ? project.collage
    : project.media.slice(1).map((m) => m.src)
  ).slice(0, 3);

  const offsets = [
    { x: "-38%", y: "-22%", r: "-6deg" },
    { x: "42%", y: "-14%", r: "5deg" },
    { x: "-10%", y: "44%", r: "-3deg" },
  ];

  return (
    <li className="relative">
      <Link
        to="/work/$hub/$slug"
        params={{ hub: project.hub, slug: project.slug }}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
        aria-label={`Open ${project.title}`}
      >
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

          <div className="relative aspect-square overflow-hidden rounded-md bg-secondary">
            <img
              src={project.cover}
              alt={project.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.05] transition-all duration-[900ms] ease-cinematic"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-foreground/70">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <h2 className="font-display font-black uppercase tracking-tight text-base md:text-lg leading-[0.95] text-balance group-hover:text-accent transition-colors line-clamp-2">
                {project.title}
              </h2>
              <p className="mt-2 text-[10px] tracking-[0.25em] uppercase text-foreground/70 line-clamp-1">
                {project.subtitle}
              </p>
              {project.tags && project.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[9px] tracking-[0.25em] uppercase px-2 py-1 rounded-full border border-foreground/30 text-foreground/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
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
