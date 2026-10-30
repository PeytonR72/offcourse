import { rocketFrames, type RocketFrameKey } from "./rocket-art";

/** Network- and GPU-independent copy of the atlas art for the SVG world. */
export function RocketSprite({
  expression,
  thruster,
  flameScale = 1,
}: {
  expression: RocketFrameKey;
  thruster: RocketFrameKey | null;
  flameScale?: number;
}) {
  return (
    <g shapeRendering="crispEdges">
      <g
        transform={`translate(32 20) scale(${flameScale} 1) translate(-32 -20)`}
      >
        {thruster &&
          rocketFrames[thruster].paths.map(({ fill, d }, index) => (
            <path key={`flame-${index}`} fill={fill} d={d} />
          ))}
      </g>
      <g data-rocket-body={expression}>
        {rocketFrames[expression].paths.map(({ fill, d }, index) => (
          <path key={index} fill={fill} d={d} />
        ))}
      </g>
    </g>
  );
}
