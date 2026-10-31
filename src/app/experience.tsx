"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import { createFlightFeedback } from "../world/flight-feedback";
import { SiteNav } from "./site-nav";
import { FlightIcon } from "./flight-icon";

type Preferences = { sound: boolean; haptics: boolean; reducedMotion: boolean };
const defaults: Preferences = {
  sound: false,
  haptics: false,
  reducedMotion: false,
};
const preferenceKey = "offcourse:experience:v1";
const Experience = createContext<{
  reducedMotion: boolean;
  launch: () => void;
  stopFeedback: () => void;
  reveal: (outcome: "perfect" | "survive" | "miss") => void;
}>({
  reducedMotion: false,
  launch: () => {},
  stopFeedback: () => {},
  reveal: () => {},
});
export const useExperience = () => useContext(Experience);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [hapticsSupported, setHapticsSupported] = useState(false);
  const feedback = useRef<ReturnType<typeof createFlightFeedback> | null>(null);
  const stopFeedback = useCallback(() => feedback.current?.stop(), []);
  const reveal = useCallback(
    (outcome: "perfect" | "survive" | "miss") =>
      feedback.current?.reveal(outcome),
    []
  );
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const changed = () => setSystemReduced(Boolean(media?.matches));
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(localStorage.getItem(preferenceKey) ?? "null");
        if (
          saved &&
          typeof saved.sound === "boolean" &&
          typeof saved.haptics === "boolean" &&
          typeof saved.reducedMotion === "boolean"
        )
          setPreferences(saved);
      } catch {
        /* Preferences remain usable when storage is blocked. */
      }
      changed();
      setHapticsSupported(typeof navigator.vibrate === "function");
      setReady(true);
    });
    media?.addEventListener("change", changed);
    const quiet = () => {
      if (document.hidden) feedback.current?.stop();
    };
    document.addEventListener("visibilitychange", quiet);
    return () => {
      cancelled = true;
      media?.removeEventListener("change", changed);
      document.removeEventListener("visibilitychange", quiet);
      feedback.current?.dispose();
      feedback.current = null;
    };
  }, []);
  const reducedMotion = preferences.reducedMotion || systemReduced;
  const toggle = (key: keyof Preferences) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    if (key === "sound" && !next.sound) feedback.current?.stop();
    try {
      localStorage.setItem(preferenceKey, JSON.stringify(next));
    } catch {
      /* In-memory fallback. */
    }
  };
  return (
    <Experience.Provider
      value={{
        reducedMotion,
        reveal,
        stopFeedback,
        launch: () => {
          feedback.current ??= createFlightFeedback();
          feedback.current.launch({ ...preferences, reducedMotion });
        },
      }}
    >
      <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
        <div className="experience-root" data-reduced-motion={reducedMotion}>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <header className="site-header">
            <SiteNav />
            <div
              className="experience-controls"
              role="group"
              aria-label="Flight preferences"
            >
              <button
                disabled={!ready}
                aria-pressed={preferences.sound}
                onClick={() => toggle("sound")}
              >
                <FlightIcon kind="sound" />
                Sound {preferences.sound ? "on" : "off"}
              </button>
              <button
                disabled={!ready}
                aria-pressed={reducedMotion}
                onClick={() => toggle("reducedMotion")}
                aria-describedby={systemReduced ? "system-motion" : undefined}
              >
                <FlightIcon kind="motion" />
                <span>Reduce motion {reducedMotion ? "on" : "off"}</span>
              </button>
              <button
                disabled={!ready || !hapticsSupported}
                aria-hidden={!hapticsSupported}
                style={{ visibility: hapticsSupported ? "visible" : "hidden" }}
                aria-pressed={preferences.haptics}
                onClick={() => toggle("haptics")}
              >
                Haptics {preferences.haptics ? "on" : "off"}
              </button>
              {systemReduced && (
                <span id="system-motion" className="text-xs text-[#b4c2d1]">
                  Device reduced motion is on.
                </span>
              )}
            </div>
          </header>
          {children}
        </div>
      </MotionConfig>
    </Experience.Provider>
  );
}
