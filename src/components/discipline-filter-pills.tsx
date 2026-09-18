import { Link } from "@tanstack/react-router";
import { PROJECT_TAGS, type ProjectTag } from "@/lib/projects";
import { glassButton } from "@/components/glass-button";

function formatTag(t: ProjectTag) {
  return t.replace("/", " / ");
}

/**
 * The three discipline pills (Experiential / Production-Scenic /
 * Architecture), always linking to the homepage feed with that tag applied.
 * Shared by the homepage itself (where `activeTag` highlights the current
 * filter) and the foot of every project page (where nothing is "active" —
 * clicking one just takes you to that filtered view of the feed).
 */
export function DisciplineFilterPills({ activeTag }: { activeTag?: ProjectTag }) {
  return (
    <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-3">
      {PROJECT_TAGS.map((t) => (
        <Link
          key={t}
          to="/"
          search={{ tag: t }}
          className={glassButton({
            quiet: true,
            touch: true,
            sheen: true,
            className: activeTag === t ? "is-active" : "",
          })}
          /* .glass-button's own font-size/padding/tracking (sized for a
             compact nav pill) win over Tailwind utilities here since both
             are plain rules of equal specificity — inline styles are the
             one thing guaranteed to beat them. All three shrink together
             with the viewport: three pills, "Production / Scenic" included,
             have to fit in a column that's only ~52-55% of the screen on the
             homepage (the rest is the hero image), so besides a smaller
             font than the grid tiles get, the padding and letter-spacing are
             tightened too — otherwise the label text has nowhere to go but
             past the edge of that column, where a wrapper's overflow-hidden
             was slicing it off rather than shrinking it. */
          style={{
            fontSize: "clamp(0.7rem, 0.9vw + 0.3rem, 1.05rem)",
            padding: "clamp(0.3rem, 0.4vw + 0.2rem, 0.5rem) clamp(0.5rem, 0.8vw + 0.3rem, 0.9rem)",
            letterSpacing: "0.06em",
          }}
          onMouseMove={(e) => {
            const el = e.currentTarget;
            const r = el.getBoundingClientRect();
            el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
            el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
          }}
        >
          {formatTag(t)}
        </Link>
      ))}
    </div>
  );
}
