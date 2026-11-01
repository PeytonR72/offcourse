"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { RocketSprite } from "../world/rocket-sprite";
import { useExperience } from "./experience";

/** One quiet drift on the existing Motion clock; the game owns actual flight. */
export function StarChart() {
  const host = useRef<HTMLDivElement>(null);
  const inView = useInView(host);
  const { reducedMotion } = useExperience();
  const drifting = inView && !reducedMotion;
  return (
    <div ref={host} className="star-chart" aria-hidden="true">
      <svg viewBox="0 0 720 180" fill="none">
        <defs>
          <linearGradient id="route-fade">
            <stop stopColor="#ffc985" stopOpacity="0" />
            <stop offset=".5" stopColor="#ffc985" stopOpacity=".8" />
            <stop offset="1" stopColor="#94d9cb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse
          cx="360"
          cy="100"
          rx="260"
          ry="55"
          stroke="#6d9caa"
          strokeOpacity=".18"
          transform="rotate(-8 360 100)"
        />
        <path
          d="M60 126C175 174 219 145 297 98S460 52 660 86"
          stroke="url(#route-fade)"
          strokeWidth="1.5"
          strokeDasharray="3 7"
        />
        <circle cx="486" cy="68" r="5" stroke="#94d9cb" fill="#0b1728" />
        <circle cx="486" cy="68" r="13" stroke="#94d9cb" strokeOpacity=".25" />
        <g transform="translate(286 38) rotate(-17 64 40)">
          <motion.g
            initial={false}
            animate={
              drifting
                ? { y: [0, -5, 0], rotate: [0, 2, 0] }
                : { y: 0, rotate: 0 }
            }
            transition={
              drifting
                ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0, repeat: 0 }
            }
          >
            <g transform="scale(2.25)">
              <RocketSprite expression="idle" thruster="thrust-1" />
            </g>
          </motion.g>
        </g>
        <g fill="#ffc985" opacity=".65">
          <rect x="266" y="114" width="4" height="4" />
          <rect x="247" y="121" width="3" height="3" />
          <rect x="229" y="128" width="2" height="2" />
        </g>
      </svg>
    </div>
  );
}
