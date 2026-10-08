"use client";

import { MotionConfig, motion, type HTMLMotionProps } from "motion/react";
import clsx from "clsx";

export const EASE = [0.2, 0.7, 0.15, 1] as const;

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Lines slide up from behind a hard mask, like a title card. */
export function MaskLines({
  lines,
  className,
  lineClassName,
  accentIndex,
  accentClassName,
  delay = 0,
  stagger = 0.08,
  as: Tag = "span",
  inView = true,
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  /** Line index that gets `accentClassName` (serializable alternative to a callback) */
  accentIndex?: number;
  accentClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "div";
  inView?: boolean;
}) {
  const MotionTag = Tag === "div" ? motion.div : motion.span;
  // The trigger lives on the (unclipped) wrapper: an element translated out of an
  // overflow-hidden parent never intersects, so it can't observe itself.
  return (
    <MotionTag
      className={clsx("block", className)}
      initial="hidden"
      {...(inView ? { whileInView: "show", viewport: { once: true, margin: "0px 0px -10% 0px" } } : { animate: "show" })}
    >
      {lines.map((line, i) => (
        <span key={i} className="-mt-[0.16em] block overflow-hidden pb-[0.04em] pt-[0.16em]">
          <motion.span
            className={clsx("block", lineClassName, i === accentIndex && accentClassName)}
            variants={{ hidden: { y: "105%" }, show: { y: "0%" } }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

export function Reveal({ className, delay = 0, y = 24, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
    />
  );
}

/** Image wipes open with a clip-path, film-gate style. */
export function ClipReveal({ className, delay = 0, from = "bottom", children }: { className?: string; delay?: number; from?: "bottom" | "left" | "right"; children: React.ReactNode }) {
  const initial = from === "bottom" ? "inset(100% 0 0 0)" : from === "left" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
  return (
    <motion.div
      className={className}
      initial={{ clipPath: initial }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
