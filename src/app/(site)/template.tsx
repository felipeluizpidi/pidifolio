"use client";

import { motion } from "motion/react";

/** Cut between pages: a red leader frame wipes off the screen. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] bg-red"
        initial={{ clipPath: "inset(0 0 0 0)" }}
        animate={{ clipPath: "inset(0 0 100% 0)" }}
        transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
      />
      {children}
    </>
  );
}
