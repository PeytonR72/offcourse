"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { RoundState } from "../domain/run";
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

const loadRenderer: RendererLoader = async () => {
  const { createPixiRenderer } = await import("./pixi-renderer");
  return createPixiRenderer();
};

export function RocketWorld({
  round,
  elapsed,
}: {
  round: RoundState;
  elapsed?: number;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof mountScene> | null>(null);
  const [status, setStatus] = useState<SceneStatus>("loading");
  const readState = useEffectEvent(() => toSceneState(round, elapsed));

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
    scene.current?.update(toSceneState(round, elapsed));
  }, [round, elapsed]);

  const state = toSceneState(round, elapsed);
  const frame = flightFrame(state);
  const appearance = rocketAppearance(state);
  const prediction = Math.round((state.predictionOffset + 1) * 50);
  const label =
    state.targetOffset === null
      ? `Rocket trajectory: ${prediction}% YES. Actual target hidden until reveal.`
      : `Rocket trajectory: ${prediction}% YES. Actual YES: ${(state.targetOffset + 1) * 50}%.`;
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
      role="img"
      aria-label={label}
    >
      <div className="relative aspect-[5/2]" aria-hidden="true">
        <svg
          viewBox="0 0 640 256"
          className="absolute inset-0 size-full"
          aria-hidden="true"
        >
          <path
            d="M42 37h2 M145 80h2 M244 28h2 M359 174h2 M424 49h2 M601 204h2 M192 224h2"
            stroke="#b4c2d1"
            strokeWidth="2"
          />
          <circle cx="532" cy={targetY} r="23" fill="#294557" />
          <ellipse
            cx="532"
            cy={targetY}
            rx="40"
            ry="13"
            fill="none"
            stroke="#546b83"
            strokeWidth="2"
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
            transform={`translate(${frame.x} ${frame.y}) rotate(${(frame.rotation * 180) / Math.PI}) scale(${frame.scaleX * rocketTokens.scale} ${frame.scaleY * rocketTokens.scale}) translate(-32 -20)`}
            opacity={frame.alpha}
          >
            <RocketSprite {...appearance} />
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
        </svg>
        <div ref={host} className="absolute inset-0" />
      </div>
      <figcaption
        className="absolute right-3 bottom-2 left-3 flex justify-between gap-2 text-xs text-[#b4c2d1]"
        aria-hidden="true"
      >
        <span>
          {state.targetOffset === null
            ? "Aim · always % YES"
            : "Gold: prediction · teal: actual"}
        </span>
        <span>
          {status === "unavailable"
            ? "Static view · controls available"
            : "Demo flight"}
        </span>
      </figcaption>
    </figure>
  );
}
