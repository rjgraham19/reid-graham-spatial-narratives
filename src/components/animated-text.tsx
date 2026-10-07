import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  Children,
  Fragment,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useFitText } from "@/hooks/use-fit-text";

/**
 * Per-letter reveal for standout headline moments only (project titles).
 * Kept subtle: small blur/offset, quick stagger.
 *
 * Letters are grouped into per-word wrappers rather than emitted as one
 * flat run. Each letter has to be inline-block in order to animate, and
 * browsers treat inline-block elements as independent break
 * opportunities — so a flat run wraps mid-word ("Tak / e"). Giving each
 * word its own nowrap inline-block wrapper, with plain text spaces
 * between words, makes those spaces the only place a line can break.
 */
export function AnimatedHeading({
  text,
  className,
  as: Tag = "h1",
  fit = false,
  playOnLoad = false,
  fitFloor,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
  /**
   * When true, the heading trims its own font size if it would overflow its
   * container's width — so a long single word ("Renaissance", "Lollapalooza")
   * can never be clipped at any viewport, zoom, or device-pixel ratio. Pair
   * with a font size expressed as `calc(<clamp> * var(--fit-scale, 1))`
   * (see `.project-hero-title` in styles.css).
   */
  fit?: boolean;
  /**
   * Play the letter reveal from first paint (pure CSS, `animate-letter-in`)
   * instead of waiting for hydration + scroll-into-view. Lets a title start
   * alongside the hero image's own CSS entrance rather than trailing it.
   */
  playOnLoad?: boolean;
  /**
   * Smallest `--fit-scale` the fit may shrink to (default 0.62). A title held
   * to one line (`lg:whitespace-nowrap`) needs more room to shrink.
   */
  fitFloor?: number;
}) {
  // Precompute each word's starting letter index so the stagger stays
  // continuous across the title instead of restarting on every word.
  const words = text.split(" ");
  let runningIndex = 0;
  const wordsWithOffset = words.map((word) => {
    const offset = runningIndex;
    runningIndex += word.length;
    return { word, offset };
  });

  const { ref, scale } = useFitText<HTMLHeadingElement>([text, fit], fitFloor);

  return (
    <Tag
      ref={fit ? ref : undefined}
      className={className}
      style={fit ? ({ "--fit-scale": scale } as CSSProperties) : undefined}
      aria-label={text}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {wordsWithOffset.map(({ word, offset }, wordIndex) => (
          <Fragment key={wordIndex}>
            <span className="inline-block whitespace-nowrap">
              {[...word].map((ch, charIndex) =>
                playOnLoad ? (
                  <span
                    key={charIndex}
                    className="inline-block animate-letter-in motion-reduce:animate-none"
                    style={{ animationDelay: `${0.15 + (offset + charIndex) * 0.012}s` }}
                  >
                    {ch}
                  </span>
                ) : (
                <motion.span
                  key={charIndex}
                  className="inline-block"
                  initial={{ opacity: 0, filter: "blur(4px)", y: 6 }}
                  whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: (offset + charIndex) * 0.012,
                    ease: "easeOut",
                  }}
                >
                  {ch}
                </motion.span>
                ),
              )}
            </span>
            {wordIndex < wordsWithOffset.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}

/**
 * Reveal pace for every RevealBlock below a provider. "quick" is the
 * original snappy fade-up; "slow" is the softer, moodier reveal (settings
 * taken from matthewplaia.com) used on the darker design projects — set per
 * project with `revealPace` in src/lib/projects.ts.
 */
export type RevealPace = "quick" | "slow";
const RevealPaceContext = createContext<RevealPace>("quick");

export function RevealPaceProvider({ pace, children }: { pace: RevealPace; children: ReactNode }) {
  return <RevealPaceContext.Provider value={pace}>{children}</RevealPaceContext.Provider>;
}

type RevealBlockProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Direction the block travels in from as it reveals. "up" (default) is
   *  the original subtle lift; "left"/"right" instead slide in from the
   *  side — for pairing two images that should read as converging toward
   *  each other (see the Anne Frank sketch/photo pair). */
  from?: "up" | "left" | "right";
};

/** Subtle fade-up reveal for a block of body content (description, credits, quotes). */
export function RevealBlock(props: RevealBlockProps) {
  const pace = useContext(RevealPaceContext);
  return pace === "slow" ? <SlowReveal {...props} /> : <QuickReveal {...props} />;
}

function QuickReveal({ children, className, delay = 0, from = "up" }: RevealBlockProps) {
  const offset =
    from === "left" ? { x: -32 } : from === "right" ? { x: 32 } : { y: 16 };
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ── Slow reveal ─────────────────────────────────────────────────────
 * Images (blocks with no text): opacity only, 0.8s on a slow-in / soft-
 * landing curve, starting as soon as any part is on screen.
 * Text: every word becomes a plain inline span; after layout, words are
 * grouped into their visual lines and each line rises 10px + fades in over
 * 1s, 0.05s after the line above — so paragraphs unroll a line at a time.
 * Words stay display:inline and are offset with position:relative + `top`
 * (inline boxes ignore transforms) so the text wraps exactly like plain text
 * in every engine — inline-block words wrapped differently in Safari's
 * balanced text and visibly re-flowed on iPad.
 *
 * Words are split by rebuilding the React children (strings inside plain
 * DOM elements like <p>/<em>), never by touching the DOM, so React keeps
 * ownership. Content rendered by a nested component (e.g. a credit row)
 * isn't split and simply fades with the block. Design Mode edits text in
 * place, so splitting is off there and blocks fade as a whole. */
const SLOW_IMAGE_EASE = [0.68, 0, 0.22, 0.83] as const;
const SLOW_TEXT_EASE = [0.4, 0, 0.2, 1] as const;
const SPLIT_TEXT = import.meta.env.MODE !== "design";
const NO_SPLIT_TAGS = new Set([
  "svg", "img", "picture", "video", "canvas", "iframe", "textarea", "select", "code", "pre",
]);

type WordVariants = Variants;

function splitWords(
  node: ReactNode,
  counter: { n: number },
  lines: number[],
  variants: WordVariants,
): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
      .split(/(\s+)/)
      .map((part, i) => {
        if (part === "" || /^\s+$/.test(part)) return part || null;
        const index = counter.n++;
        return (
          <motion.span
            key={i}
            data-word
            style={{ position: "relative" }}
            variants={variants}
            custom={lines[index] ?? 0}
          >
            {part}
          </motion.span>
        );
      });
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return node;
  const isDomTag = typeof node.type === "string" && !NO_SPLIT_TAGS.has(node.type);
  if ((!isDomTag && node.type !== Fragment) || node.props.children == null) return node;
  return cloneElement(
    node,
    undefined,
    Children.map(node.props.children, (c) => splitWords(c, counter, lines, variants)),
  );
}

function SlowReveal({ children, className, delay = 0, from = "up" }: RevealBlockProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<number[]>([]);

  const wordVariants = useMemo<WordVariants>(
    () => ({
      hidden: { opacity: 0.001, top: 10 },
      shown: (line: number) => ({
        opacity: 1,
        top: 0,
        transition: { duration: 1, ease: SLOW_TEXT_EASE, delay: delay + line * 0.05 },
      }),
    }),
    [delay],
  );

  const counter = { n: 0 };
  const content = SPLIT_TEXT
    ? Children.map(children, (c) => splitWords(c, counter, lines, wordVariants))
    : children;
  const hasText = counter.n > 0;

  // Group words into visual lines by their on-screen top edge. Every word is
  // offset by the same 10px before it plays, so the grouping is unaffected.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !hasText) return;
    const measure = () => {
      let line = -1;
      let lastTop = -Infinity;
      const next = Array.from(el.querySelectorAll<HTMLElement>("[data-word]")).map((w) => {
        const top = w.getBoundingClientRect().top;
        if (top > lastTop + 4) {
          line += 1;
          lastTop = top;
        }
        return line;
      });
      setLines((prev) => (prev.join() === next.join() ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasText]);

  if (reduce) return <div data-reveal className={className}>{children}</div>;

  const side = from === "left" ? { x: -32 } : from === "right" ? { x: 32 } : {};
  return (
    <motion.div
      data-reveal
      ref={ref}
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={
        // Text waits until 30% of the block shows (an amount, not a margin, so
        // a block at the very end of a short page can still reach it).
        hasText ? { once: true, amount: 0.3 } : { once: true, amount: 0 }
      }
      variants={{
        hidden: { opacity: 0, ...side },
        shown: {
          opacity: 1,
          x: 0,
          transition: hasText
            ? { duration: 0.5, ease: SLOW_TEXT_EASE, delay }
            : { duration: 0.8, ease: SLOW_IMAGE_EASE, delay },
        },
      }}
    >
      {content}
    </motion.div>
  );
}
