import type { CSSProperties, ReactNode, Ref } from "react";
import { RocketSprite } from "../world/rocket-sprite";

/**
 * One stats-bar pattern for every mission. The run's headline metric is gold;
 * everything else is cream. Labels read with their values as one sentence
 * ("Current streak: 3") for assistive technology and tests.
 */
export function StatsBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`stats-bar ${className}`}>{children}</div>;
}

export function Stat({
  label,
  value,
  unit,
  primary = false,
  record = false,
  statRef,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  primary?: boolean;
  record?: boolean;
  statRef?: Ref<HTMLSpanElement>;
}) {
  return (
    <p
      className="stat"
      data-primary={primary || undefined}
      data-record={record || undefined}
    >
      <span
        ref={statRef}
        tabIndex={statRef ? -1 : undefined}
        className="sr-only"
      >
        {label}: {value}
        {unit && ` ${unit}`}
      </span>
      <span className="stat-label" aria-hidden="true">
        {label}
      </span>
      <span className="stat-value" aria-hidden="true">
        {value}
        {unit && <small> {unit}</small>}
      </span>
    </p>
  );
}

export function RoundMeter({
  current,
  completed,
  total,
}: {
  current: number;
  completed: number;
  total: number;
}) {
  return (
    <div className="round-meter">
      <p className="stat-label">
        Round {current} of {total}
      </p>
      <div className="round-segments" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            data-state={
              index < completed
                ? "complete"
                : index === current - 1
                  ? "current"
                  : "upcoming"
            }
          />
        ))}
      </div>
    </div>
  );
}

/** The run's distance as a flight path with the ship riding on it. */
export function DistanceMeter({
  distance,
  max,
  label = "Total distance",
  showValue = true,
}: {
  distance: number;
  max: number;
  label?: string;
  showValue?: boolean;
}) {
  const progress = Math.max(0, Math.min(1, distance / max));
  return (
    <div className="distance-meter">
      <span className="sr-only">
        {label}: {distance} ly / {max} ly
      </span>
      {showValue && (
        <p className="distance-meter-heading" aria-hidden="true">
          <span className="stat-label">{label}</span>
          <span className="stat-value" data-primary>
            {distance}
            <small> / {max} ly</small>
          </span>
        </p>
      )}
      <div
        className="distance-track"
        aria-hidden="true"
        style={{ "--progress": progress } as CSSProperties}
      >
        <span className="distance-fill" />
        <svg className="distance-ship" viewBox="12 4 52 33">
          <RocketSprite expression="idle" thruster={null} />
        </svg>
      </div>
    </div>
  );
}
