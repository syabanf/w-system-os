"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger index — multiplied by a base delay so siblings cascade. */
  index?: number;
  /** Explicit delay (seconds); overrides `index`. */
  delay?: number;
  /** Rise distance in px (default 24 — a pronounced lift). */
  y?: number;
  className?: string;
}

/**
 * Scroll-reveal wrapper: children rise + fade + settle as they enter the
 * viewport (once). Honors `prefers-reduced-motion` — when set, it renders a
 * plain wrapper with no animation. Built on the app's existing entrance easing.
 */
export function Reveal({ children, index = 0, delay, y = 24, className }: RevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
      transition={{
        duration: 0.5,
        delay: delay ?? index * 0.08,
        ease: [0.2, 0.9, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
