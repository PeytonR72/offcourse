"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useExperience } from "./experience";

/** A short arrival, without delaying navigation or remounting global preferences. */
export default function RouteArrival({ children }: { children: ReactNode }) {
  const { reducedMotion } = useExperience();
  return (
    <motion.div
      className="route-arrival"
      initial={{ y: reducedMotion ? 0 : 14 }}
      animate={{ y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.24,
        ease: [0.2, 0.75, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
