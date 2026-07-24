import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Per-letter reveal for standout headline moments only (project titles).
 * Kept subtle: small blur/offset, quick stagger — not the flashier version
 * this was modeled on.
 */
export function AnimatedHeading({
  text,
  className,
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  const letters = [...text];
  return (
    <Tag className={className} aria-label={text}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ opacity: 0, filter: "blur(4px)", y: 6 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.012, ease: "easeOut" }}
          >
            {ch === " " ? " " : ch}
          </motion.span>
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
