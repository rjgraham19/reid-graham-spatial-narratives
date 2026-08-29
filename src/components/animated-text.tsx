import { motion } from "motion/react";
import { Fragment, type CSSProperties, type ReactNode } from "react";
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

  const { ref, scale } = useFitText<HTMLHeadingElement>([text, fit]);

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
              {[...word].map((ch, charIndex) => (
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
              ))}
            </span>
            {wordIndex < wordsWithOffset.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}

/** Subtle fade-up reveal for a block of body content (description, credits, quotes). */
export function RevealBlock({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
