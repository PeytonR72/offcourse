"use client";

import { ViewTransition, type ReactNode } from "react";
import { useExperience } from "./experience";

/** A short handoff around the shared mission title; the browser owns its clock. */
export default function RouteArrival({ children }: { children: ReactNode }) {
  const { reducedMotion } = useExperience();
  return (
    <ViewTransition
      default="none"
      enter={reducedMotion ? "none" : "route-arrive"}
      exit={reducedMotion ? "none" : "route-depart"}
    >
      <div className="route-arrival">{children}</div>
    </ViewTransition>
  );
}
