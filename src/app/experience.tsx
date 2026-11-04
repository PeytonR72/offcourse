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
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const path = usePathname();
  const [menuPath, setMenuPath] = useState(path);
  if (menuPath !== path) {
    setMenuPath(path);
    setMenuOpen(false);
  }
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !header.current?.contains(event.target as Node)
      )
        setMenuOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [menuOpen]);
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
          <header ref={header} className="site-header">
            <SiteNav />
            <button
              type="button"
              className="menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="flight-preferences"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <FlightIcon kind="settings" />
              <span className="sr-only">Menu and preferences</span>
            </button>
            <div
              id="flight-preferences"
              className="experience-controls"
              data-open={menuOpen}
              role="group"
              aria-label="Flight preferences"
            >
              <Link
                href="/#how-to-play"
                className="menu-link"
                onClick={() => setMenuOpen(false)}
              >
                How to play
              </Link>
              <PreferenceSwitch
                label="Sound"
                icon="sound"
                on={preferences.sound}
                disabled={!ready}
                onToggle={() => toggle("sound")}
              />
              <PreferenceSwitch
                label="Reduce motion"
                icon="motion"
                on={reducedMotion}
                disabled={!ready}
                describedBy={systemReduced ? "system-motion" : undefined}
                onToggle={() => toggle("reducedMotion")}
              />
              <PreferenceSwitch
                label="Haptics"
                icon="haptics"
                on={preferences.haptics}
                disabled={!ready || !hapticsSupported}
                hidden={!hapticsSupported}
                onToggle={() => toggle("haptics")}
              />
              {systemReduced && (
                <span id="system-motion" className="system-motion-note">
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

/** A real switch: the track and knob show state; the name keeps on/off for speech. */
function PreferenceSwitch({
  label,
  icon,
  on,
  disabled,
  hidden = false,
  describedBy,
  onToggle,
}: {
  label: string;
  icon: "sound" | "motion" | "haptics";
  on: boolean;
  disabled: boolean;
  hidden?: boolean;
  describedBy?: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="preference-switch"
      disabled={disabled}
      aria-pressed={on}
      aria-label={`${label} ${on ? "on" : "off"}`}
      aria-hidden={hidden || undefined}
      aria-describedby={describedBy}
      style={hidden ? { visibility: "hidden" } : undefined}
      onClick={onToggle}
    >
      <FlightIcon kind={icon} />
      <span>{label}</span>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  );
}
