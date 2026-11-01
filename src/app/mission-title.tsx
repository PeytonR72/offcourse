"use client";

import { ViewTransition, type ReactNode } from "react";
import { useExperience } from "./experience";

/** The chosen mission keeps its identity from the launch card to its heading. */
export function MissionTitle({
  mode,
  children,
}: {
  mode: "daily" | "endless";
  children: ReactNode;
}) {
  const { reducedMotion } = useExperience();
  return (
    <ViewTransition
      name={`mission-${mode}`}
      share={reducedMotion ? "none" : "mission-transfer"}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
