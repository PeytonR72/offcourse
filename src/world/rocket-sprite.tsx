import { rocketFrames, type RocketFrameKey } from "./rocket-art";

/** Network- and GPU-independent copy of the atlas art for the SVG world. */
export function RocketSprite({
  expression,
  thruster,
}: {
  expression: RocketFrameKey;
  thruster: RocketFrameKey | null;
}) {
  return (
    <g shapeRendering="crispEdges">
      {thruster &&
        rocketFrames[thruster].paths.map(({ fill, d }, index) => (
          <path key={`flame-${index}`} fill={fill} d={d} />
        ))}
      <g data-rocket-body={expression}>
        {rocketFrames[expression].paths.map(({ fill, d }, index) => (
          <path key={index} fill={fill} d={d} />
        ))}
      </g>
    </g>
  );
}
