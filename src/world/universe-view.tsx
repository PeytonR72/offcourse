import { cssColor, universeOffsets, type Universe } from "./universe";

/** Static fallback shares all layout coordinates and flight-driven parallax with Pixi. */
export function UniverseView({
  universe,
  travel,
}: {
  universe: Universe;
  travel: number;
}) {
  const { region, stars, planets, debris } = universe;
  const offsets = universeOffsets(travel);
  return (
    <g>
      {[0, 1].map((layer) => (
        <g
          key={layer}
          transform={`translate(${layer === 0 ? offsets.far : offsets.near} 0)`}
        >
          {[0, 640].map((repeat) => (
            <g key={repeat} transform={`translate(${repeat} 0)`}>
              {stars
                .filter((star) => star.layer === layer)
                .map((star, index) => (
                  <rect
                    key={index}
                    x={star.x}
                    y={star.y}
                    width={star.radius}
                    height={star.radius}
                    fill={cssColor(region.accent)}
                    opacity={layer === 0 ? 0.3 : 0.65}
                  />
                ))}
            </g>
          ))}
        </g>
      ))}
      <g transform={`translate(${offsets.near} 0)`}>
        {planets.map((planet, index) => (
          <g key={index} data-planet={planet.kind}>
            {planet.kind === "ringed" && (
              <ellipse
                cx={planet.x}
                cy={planet.y}
                rx={planet.radius * 1.7}
                ry={planet.radius * 0.4}
                fill="none"
                stroke={cssColor(region.accent)}
              />
            )}
            <circle
              cx={planet.x}
              cy={planet.y}
              r={planet.radius}
              fill={cssColor(region.planet)}
            />
            {planet.kind === "cratered" && (
              <circle
                cx={planet.x - 2}
                cy={planet.y - 2}
                r={planet.radius * 0.35}
                fill={cssColor(region.sky)}
                opacity="0.6"
              />
            )}
            {planet.kind === "striped" && (
              <path
                d={`M${planet.x - planet.radius * 0.8} ${planet.y} h${planet.radius * 1.6}`}
                stroke={cssColor(region.accent)}
                strokeWidth="2"
              />
            )}
          </g>
        ))}
      </g>
      <g transform={`translate(${offsets.debris} 0)`}>
        {debris.map((item, index) => (
          <rect
            key={index}
            x={item.x}
            y={item.y}
            width={item.radius * 2}
            height={item.radius}
            fill={cssColor(region.planet)}
            opacity="0.7"
          />
        ))}
      </g>
    </g>
  );
}
