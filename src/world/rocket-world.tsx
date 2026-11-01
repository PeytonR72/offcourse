"use client";

import {
  memo,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Run } from "../domain/run";
import {
  mountScene,
  type RendererLoader,
  type SceneStatus,
} from "./mount-scene";
import { toSceneState } from "./scene-state";
import { flightFrame, trajectoryGeometry } from "./flight-frame";
import { rocketAppearance } from "./rocket-sprites";
import { rocketTokens } from "./rocket-art";
import { RocketSprite } from "./rocket-sprite";
import { createUniverse, cssColor, universeContext } from "./universe";
import { UniverseView } from "./universe-view";
import { useExperience } from "../app/experience";

const transform = (frame: ReturnType<typeof flightFrame>) =>
  `translate(${frame.x} ${frame.y}) rotate(${(frame.rotation * 180) / Math.PI}) scale(${frame.scaleX * rocketTokens.scale} ${frame.scaleY * rocketTokens.scale}) translate(-32 -20)`;

// Keep labels legible in CSS pixels while the flight geometry uses its 640×256 frame.
const annotationTop = (y: number, above: boolean) =>
  `clamp(0px, calc(${(y / 256) * 100}% ${above ? "- 36px" : "+ 12px"}), calc(100% - 24px))`;

const loadRenderer: RendererLoader = async () => {
  const { createPixiRenderer } = await import("./pixi-renderer");
  return createPixiRenderer();
};

// Keep hidden SVG geometry out of per-frame reconciliation. When the GPU fails,
// visible changes to true and the fallback renders the latest authoritative pose.
const FallbackContents = memo(
  function FallbackContents({
    children,
  }: {
    visible: boolean;
    children: ReactNode;
  }) {
    return children;
  },
  (previous, next) => !previous.visible && !next.visible
);

export function RocketWorld({
  run,
  elapsed,
  paused = false,
  caption,
}: {
  run: Run;
  elapsed?: number;
  paused?: boolean;
  caption?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const fallbackRocket = useRef<SVGGElement>(null);
  const { reducedMotion } = useExperience();
  const scene = useRef<ReturnType<typeof mountScene> | null>(null);
  const [status, setStatus] = useState<SceneStatus>("loading");
  const { round } = run;
  const { seed, streak } = universeContext(run);
  const universe = useMemo(() => createUniverse(seed, streak), [seed, streak]);
  const readState = useEffectEvent(() => ({
    ...toSceneState(round, elapsed),
    universe,
    reducedMotion,
  }));

  useEffect(() => {
    if (!host.current) return;
    const mounted = mountScene(
      host.current,
      readState(),
      loadRenderer,
      setStatus
    );
    scene.current = mounted;
    return () => {
      mounted.dispose();
      scene.current = null;
    };
  }, []);
  useEffect(() => {
    scene.current?.update({
      ...toSceneState(round, elapsed),
      universe,
      reducedMotion,
    });
  }, [round, elapsed, universe, reducedMotion]);
  const idle =
    !paused && (round.phase === "answering" || round.phase === "aiming");
  useEffect(() => {
    if (!idle || reducedMotion) {
      // Idle frames write directly to the SVG ref. Restore the static pose even
      // when React's unchanged transform prop would skip updating the attribute.
      fallbackRocket.current?.setAttribute(
        "transform",
        transform(flightFrame(readState()))
      );
      return;
    }
    let frame = 0;
    let last = 0;
    const started = performance.now();
    const tick = (now: number) => {
      if (!document.hidden && now - last >= 32) {
        last = now;
        const state = { ...readState(), motionTime: now - started };
        scene.current?.update(state);
        fallbackRocket.current?.setAttribute(
          "transform",
          transform(flightFrame(state))
        );
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [idle, reducedMotion]);

  const state = { ...toSceneState(round, elapsed), reducedMotion };
  const frame = flightFrame(state);
  const appearance = rocketAppearance(state);
  const prediction = Math.round((state.predictionOffset + 1) * 50);
  const result =
    round.phase === "reveal" || round.phase === "resolved"
      ? round.result
      : null;
  const actual =
    state.targetOffset === null
      ? null
      : (result?.distribution.yesPercentage ?? null);
  const error = result?.score.error ?? null;
  const label =
    state.targetOffset === null
      ? `Rocket trajectory: ${prediction}% YES. Actual target hidden until reveal.`
      : `Rocket trajectory: ${prediction}% YES. Actual YES: ${actual}%.`;
  const { endY, targetY } = trajectoryGeometry(state);

  return (
    <figure
      className="relative -mx-5 -mt-5 mb-6 overflow-hidden rounded-t-2xl border-b border-[#344354] bg-[#0d1928] sm:-mx-8 sm:-mt-8"
      data-testid="rocket-world"
      data-renderer={status}
      data-phase={state.phase}
      data-stage={frame.stage}
      data-outcome={state.outcome ?? "hidden"}
      data-expression={appearance.expression}
      data-region={universe.region.id}
      data-reduced-motion={reducedMotion}
      role="img"
      aria-label={`${universe.region.name}. ${label}`}
    >
      <div
        className="world-viewport relative aspect-[5/2]"
        aria-hidden="true"
        style={{ backgroundColor: `${cssColor(universe.region.sky)}40` }}
      >
        <svg
          viewBox="0 0 640 256"
          className="absolute inset-0 size-full"
          style={{ visibility: status === "ready" ? "hidden" : "visible" }}
          aria-hidden="true"
        >
          <FallbackContents visible={status !== "ready"}>
            <UniverseView universe={universe} travel={frame.x - 86} />
            <circle
              cx="532"
              cy={targetY}
              r="29"
              fill={cssColor(universe.region.accent)}
              opacity="0.08"
            />
            <ellipse
              cx="532"
              cy={targetY}
              rx="40"
              ry="13"
              fill="none"
              stroke={cssColor(universe.region.accent)}
              strokeWidth="2"
            />
            <circle
              cx="532"
              cy={targetY}
              r="23"
              fill={cssColor(universe.region.planet)}
            />
            <circle
              cx="529"
              cy={targetY - 3}
              r="19"
              fill={cssColor(universe.region.accent)}
              opacity="0.18"
            />
            <circle
              cx="525"
              cy={targetY - 7}
              r="7"
              fill={cssColor(universe.region.accent)}
              opacity="0.6"
            />
            <circle
              cx="540"
              cy={targetY + 8}
              r="5"
              fill={cssColor(universe.region.sky)}
              opacity="0.5"
            />
            <path
              d={`M86 166 Q310 48 532 ${endY}`}
              fill="none"
              stroke="#f5c879"
              strokeWidth="2"
            />
            {state.targetOffset !== null && (
              <path
                d={`M86 166 Q310 48 532 ${targetY}`}
                fill="none"
                stroke="#7bdeea"
              />
            )}
            <g
              ref={fallbackRocket}
              transform={transform(frame)}
              opacity={frame.alpha}
            >
              <RocketSprite {...appearance} flameScale={frame.flame || 1} />
            </g>
            <g data-testid="engine-sparks">
              {frame.particles.map((spark, index) => (
                <circle
                  key={index}
                  cx={spark.x}
                  cy={spark.y}
                  r={spark.radius}
                  opacity={spark.alpha}
                  fill="#f5c879"
                />
              ))}
            </g>
            {state.outcome === "perfect" && (
              <circle
                cx="504"
                cy={targetY}
                r="25"
                fill="none"
                stroke="#f5c879"
                strokeWidth="2"
              />
            )}
          </FallbackContents>
        </svg>
        <div ref={host} className="absolute inset-0" />
        {actual !== null && (
          <div className="trajectory-annotations">
            <div className="trajectory-map">
              {error === 0 ? (
                <span
                  className="trajectory-label"
                  data-tone="perfect"
                  style={{ top: annotationTop(targetY, true) }}
                >
                  Perfect · {actual}%
                </span>
              ) : (
                <>
                  <span
                    className="trajectory-label"
                    data-tone="prediction"
                    style={{ top: annotationTop(endY, endY < targetY) }}
                  >
                    Predicted {prediction}%
                  </span>
                  <span
                    className="trajectory-label"
                    data-tone="actual"
                    style={{ top: annotationTop(targetY, targetY < endY) }}
                  >
                    Actual {actual}%
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <span
        className="absolute top-2 left-3 rounded bg-[#101927]/90 px-1.5 py-0.5 text-xs text-[#f8efd9]"
        data-testid="universe-region"
      >
        {caption
          ? `${caption} · ${universe.region.name}`
          : universe.region.name}
      </span>
      <figcaption
        className="absolute right-3 bottom-2 left-3 flex justify-between gap-2 text-xs text-[#b4c2d1]"
        aria-hidden="true"
      >
        <span>
          {actual === null
            ? "Aim · always % YES"
            : error === 0
              ? "Perfect match"
              : `${error} ${error === 1 ? "point" : "points"} ${prediction > actual ? "above" : "below"} actual`}
        </span>
        <span>
          {status === "unavailable"
            ? "Static view · controls available"
            : actual === null
              ? "Flight view"
              : ""}
        </span>
      </figcaption>
    </figure>
  );
}
