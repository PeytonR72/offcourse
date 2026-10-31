import { RocketSprite } from "../world/rocket-sprite";

/** Original vector star atlas. Gameplay owns the flight clock. */
export function StarChart() {
  return (
    <div className="star-chart" aria-hidden="true">
      <svg viewBox="0 0 1200 300" fill="none">
        <defs>
          <radialGradient id="ochre-world" cx="30%" cy="25%">
            <stop stopColor="#dec18b" />
            <stop offset=".6" stopColor="#ad895c" />
            <stop offset="1" stopColor="#72593f" />
          </radialGradient>
          <radialGradient id="teal-world" cx="28%" cy="22%">
            <stop stopColor="#8ebbb7" />
            <stop offset=".65" stopColor="#4d8587" />
            <stop offset="1" stopColor="#284e60" />
          </radialGradient>
          <radialGradient id="moon" cx="25%" cy="20%">
            <stop stopColor="#a7b6c8" />
            <stop offset="1" stopColor="#42556e" />
          </radialGradient>
          <pattern
            id="planet-grain"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 0h2v2H0zM4 4h1v1H4z" fill="#091321" opacity=".13" />
          </pattern>
          <clipPath id="ochre-clip">
            <circle cx="169" cy="164" r="72" />
          </clipPath>
          <clipPath id="teal-clip">
            <circle cx="1010" cy="135" r="58" />
          </clipPath>
          <linearGradient id="route-fade">
            <stop stopColor="#f5c879" stopOpacity="0" />
            <stop offset=".25" stopColor="#f5c879" stopOpacity=".55" />
            <stop offset=".7" stopColor="#f5c879" stopOpacity=".7" />
            <stop offset="1" stopColor="#f5c879" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse
          cx="600"
          cy="165"
          rx="480"
          ry="104"
          stroke="#294257"
          strokeDasharray="2 9"
          transform="rotate(-8 600 165)"
        />
        <path
          d="M110 213C300 305 403 29 625 132S843 254 1074 104"
          stroke="url(#route-fade)"
          strokeWidth="2"
          strokeDasharray="4 8"
        />
        {Array.from({ length: 40 }, (_, i) => (
          <rect
            key={i}
            x={(i * 137 + 41) % 1190}
            y={(i * 71 + 13) % 285}
            width={i % 5 === 0 ? 3 : 1.5}
            height={i % 5 === 0 ? 3 : 1.5}
            fill={i % 3 === 0 ? "#f5c879" : "#a9bdcf"}
            opacity={0.25 + (i % 4) * 0.14}
          />
        ))}
        <g stroke="#c3d5dc" opacity=".7">
          <path d="M350 55v12m-6-6h12M824 47v8m-4-4h8M896 231v12m-6-6h12M450 230v6m-3-3h6" />
        </g>
        <circle cx="169" cy="164" r="88" stroke="#b49265" strokeOpacity=".15" />
        <circle cx="169" cy="164" r="72" fill="url(#ochre-world)" />
        <g clipPath="url(#ochre-clip)" fill="#6c583f" opacity=".27">
          <path d="M95 131h38v-8h30v9h25v13h34v10h30v14h-60v-8h-38v-15H95ZM104 181h39v13h39v14h58v17H99Z" />
          <circle cx="138" cy="112" r="12" />
          <circle cx="189" cy="183" r="9" />
        </g>
        <circle cx="169" cy="164" r="72" fill="url(#planet-grain)" />
        <ellipse
          cx="1010"
          cy="135"
          rx="101"
          ry="28"
          transform="rotate(-26 1010 135)"
          stroke="#83b8b4"
          strokeWidth="9"
          opacity=".22"
        />
        <circle cx="1010" cy="135" r="58" fill="url(#teal-world)" />
        <g
          clipPath="url(#teal-clip)"
          stroke="#9cc8be"
          strokeWidth="12"
          opacity=".19"
        >
          <path d="m943 108 133-35M940 136l140-37m-138 68 143-37m-112 64 114-30" />
        </g>
        <circle cx="1010" cy="135" r="58" fill="url(#planet-grain)" />
        <path
          d="M922 176c16 14 66 0 100-17s78-44 76-62"
          stroke="#95c5bb"
          strokeWidth="7"
          opacity=".65"
        />
        <circle cx="817" cy="246" r="18" fill="url(#moon)" />
        <path d="M808 238h8v6h-8zm12 11h6v5h-6z" fill="#354c64" opacity=".6" />
        <g transform="translate(535 90) rotate(-17 64 40) scale(2)">
          <RocketSprite expression="idle" thruster="thrust-1" />
        </g>
        <g fill="#f5c879" opacity=".6">
          <rect x="501" y="159" width="4" height="4" />
          <rect x="480" y="174" width="3" height="3" />
          <rect x="459" y="180" width="2" height="2" />
        </g>
        <circle
          cx="730"
          cy="187"
          r="5"
          fill="#091321"
          stroke="#f5c879"
          strokeWidth="2"
        />
        <circle cx="730" cy="187" r="12" stroke="#f5c879" strokeOpacity=".2" />
      </svg>
    </div>
  );
}
