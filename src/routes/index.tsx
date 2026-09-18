import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { HERO_URL, PROJECT_TAGS, taggedProjects, type Project, type ProjectTag } from "@/lib/projects";
import { SiteNav } from "@/components/site-nav";
import { ProjectTile } from "@/components/project-tile";
import { ProjectPanel } from "@/components/project-panel";
import { useCanShowPanel } from "@/hooks/use-media-query";
import { DisciplineFilterPills } from "@/components/discipline-filter-pills";
import designOverrides from "@/lib/design-overrides.json";
import { mergeOverridesFiles, designModeStyleTag } from "@/lib/apply-overrides";
import type { DesignOverridesFile } from "@/lib/design-overrides.types";
import { designId } from "@/lib/design-ids";
import { useLiveOverrides } from "@/lib/use-live-overrides";
import { DesignFrameBridge } from "@/design-mode/frame-bridge";

/** `project` is the slug of the one shown in the panel over the feed. */
type HomeSearch = { tag?: ProjectTag; project?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const raw = typeof search.tag === "string" ? search.tag : undefined;
    const tag = PROJECT_TAGS.find((t) => t === raw);
    const project = typeof search.project === "string" ? search.project : undefined;
    return { ...(tag ? { tag } : {}), ...(project ? { project } : {}) };
  },
  head: () => ({
    meta: [
      { title: "Reid Graham Design — Production/Scenic, Architecture, Visualizations" },
      {
        name: "description",
        content:
          "Reid Graham is a designer working across production/scenic design, architecture, and visualization — building rooms, sets, and speculative worlds.",
      },
      { property: "og:title", content: "Reid Graham Design" },
      {
        property: "og:description",
        content:
          "Production/scenic, architecture and visualization work exploring spatial storytelling.",
      },
      { property: "og:image", content: HERO_URL },
      { name: "twitter:image", content: HERO_URL },
    ],
  }),
  component: Home,
});

function Home() {
  const { live, liveMedia, liveMediaOrder, onLocalPatch, onLocalReset, onSyncAll } = useLiveOverrides();
  const overridesFile = mergeOverridesFiles(designOverrides as DesignOverridesFile, live);
  const responsiveCss = designModeStyleTag(overridesFile);
  const brandingId = designId.home("branding");

  const { tag, project } = Route.useSearch();
  const all = taggedProjects();
  const projects = tag ? all.filter((p) => p.tags?.includes(tag)) : all;

  /* Which project is panelled lives in the URL as ?project=<slug>, so Back
     closes it and the link is shareable — same pattern the standalone /work
     feed used before it moved here. */
  const navigate = Route.useNavigate();
  const open = project ? all.find((p) => p.slug === project) ?? null : null;

  const canPanel = useCanShowPanel();

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

  /* A ?project= link opened on a phone takes over as its own full page, the
     same fallback the old /work feed used. */
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
    <div className="relative bg-black min-h-screen text-foreground">
      {responsiveCss && <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />}
      <DesignFrameBridge
        liveOverrides={live}
        liveMedia={liveMedia}
        liveMediaOrder={liveMediaOrder}
        onLocalPatch={onLocalPatch}
        onLocalReset={onLocalReset}
        onSyncAll={onSyncAll}
      />

      {/* Always transparent here: PROJECTS / LET'S CONNECT are glass pills
          with their own surface, legible over the hero image on their own —
          an opaque bar behind them as well just drew a second, redundant
          black band across the top of the photo. */}
      <div data-design-protected="Protected navigation">
        <SiteNav variant="top-transparent" />
      </div>

      {/* Header + filters share one wrapper now: the payphone image is a
          single absolutely-positioned panel spanning this whole block's
          height, from the very top down to just above the grid — not tied
          to the (much shorter) height of the text column beside it. Before,
          the image lived inside the same flex row as the text and could
          only ever be as tall as that row, which meant it stopped and
          "scrunched up" long before the grid actually started, leaving a
          band of plain black on the right that had no reason to be there.
          The wordmark and the filters both stay confined to the left column
          width though — the image is background for the "Reid Graham"
          description, not something the filter buttons sit on top of. */}
      <div className="relative overflow-hidden min-h-[46svh] md:min-h-[44svh]">
        {/* Mobile/narrow: full-bleed background behind the text, scrimmed for
            legibility — the image reads as atmosphere, not a clickable tile.
            Hidden from md up, where it moves into its own right-hand panel
            instead (see below). */}
        <div className="absolute inset-0 md:hidden">
          <img
            src={HERO_URL}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Darkest at the TOP, where the wordmark now sits (it moved up
              to sit flush with the viewport edge) — the old bottom-heavy
              fade left exactly that area the most transparent, which is
              what was making the text hard to read against the photo. */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/45 to-background/25" />
        </div>

        {/* md and up: the payphone as a real right-hand panel, flush with the
            top and right edges of the viewport, and tall enough to run down
            behind the filter row below the wordmark — not just behind the
            wordmark itself. object-contain rather than cover: the source
            photo (2547×1799) is wider than this panel is tall, and cover was
            cropping its sides away to fill the box exactly. Contain's
            default centering left a gap on whichever side didn't happen to
            touch — object-right pins that gap to the left (where the scrim
            already masks it) instead of the right, so the image itself
            reads as flush against the actual edge of the screen. */}
        <div className="hidden md:block absolute inset-y-0 right-0 md:w-[45%] lg:w-[48%] bg-black">
          <img
            src={HERO_URL}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain object-right"
          />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent" />
        </div>

        {/* Wordmark + tagline. The wordmark gets the nav's own top padding
            (py-4 md:py-6) so its top edge lines up with PROJECTS/LET'S
            CONNECT — matching the actual nav content's position rather than
            the viewport edge. Confined to the left column so it never sits
            over the image panel. */}
        <div className="relative z-10 px-6 md:px-12 lg:px-16 pt-4 md:pt-6 md:w-[55%] lg:w-[52%]">
          <Link
            to="/"
            className="animate-title-lr block w-fit transition-colors duration-200 hover:text-accent"
            aria-label="Reid Graham — home"
            data-design-id={brandingId}
            data-design-kind="heading"
          >
            <h1 className="font-display font-black uppercase leading-[0.85] tracking-[-0.04em] text-[clamp(2.5rem,min(8vw,13svh),7.5rem)]">
              <span className="block">Reid</span>
              <span className="block">Graham</span>
            </h1>
          </Link>
          {/* Same thin/uppercase treatment "Design" gets next to the bold
              wordmark in the nav bar — no italics, no serif, just a lighter
              weight of the same display face. */}
          <p className="mt-2 md:mt-3 font-display font-thin uppercase tracking-[0.04em] text-foreground/80 text-[clamp(1.1rem,3vw,2rem)]">
            | creative designer
          </p>
        </div>

        {/* Filters — sits under the tagline with real breathing room (not
            crowding it), in the same left column as the wordmark so it never
            spills onto the image on the right. Confined to md:w-[55%]/lg:w-
            [52%] below md the same as the text column above it; on mobile,
            where the image is a full-bleed background rather than a side
            panel, there's no column to overlap so it's free to run full
            width there.

            No label above it anymore — the three buttons are self-evident
            as filters. Stacked below md (a narrow column has no room for all
            three side by side); from md up they go to a row, but keep
            flex-wrap as a fallback rather than forcing nowrap — the column
            here is genuinely narrow (it's giving room to the image beside
            it), and a pill that doesn't fit needs to drop to a second line,
            not get sliced off by the wrapper's overflow-hidden. FilterPill's
            own font-size/padding/tracking already shrink with the viewport
            (see its inline style) specifically so that's a rare fallback,
            not the normal case. */}
        <div className="relative z-10 px-6 md:px-12 lg:px-16 pt-8 md:pt-10 pb-10 md:pb-8 md:w-[55%] lg:w-[52%] animate-reveal-delay">
          <DisciplineFilterPills activeTag={tag} />
        </div>
      </div>

      {/* The feed itself — same grid, same panel-overlay behaviour the
          standalone /work page used. Full width (no max-width cap): on a
          wide monitor the four columns should fill the screen edge to edge,
          the way a curated four-up row reads on a real portfolio homepage,
          not shrink to leave black margins on either side. No side gutter
          below sm either, for the same reason — on a phone that margin was
          only making the project images (the whole point of this page)
          smaller than they needed to be; the gap between tiles is enough
          separation on its own. */}
      <section className="px-0 sm:px-6 md:px-12 lg:px-16 pb-16 md:pb-24">
        {projects.length === 0 ? (
          <p className="text-foreground/60">No projects match this filter yet.</p>
        ) : (
          <ul
            key={tag ?? "all"}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {projects.map((p, i) => (
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
          accentColor={open.accentColor}
          onPrev={showPanelNav ? openPrev : undefined}
          onNext={showPanelNav ? openNext : undefined}
        />
      )}
    </div>
  );
}

