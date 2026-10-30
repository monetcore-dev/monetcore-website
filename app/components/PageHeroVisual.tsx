import type { PageHeroVisual as Visual } from "../config/pageHeroes";
import styles from "./page-hero.module.css";

const blue = "#60a5fa",
  cyan = "#67e8f9",
  coral = "#fb7185",
  orange = "#f97316";
function Panel({
  x,
  y,
  width = 180,
  height = 120,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="16"
        fill="#10294d"
        stroke={blue}
        strokeOpacity=".55"
      />
      <path
        d={`M${x + 16} ${y + 20}h${width - 32}`}
        stroke={blue}
        strokeOpacity=".35"
      />
      <circle cx={x + 18} cy={y + 10} r="2" fill={coral} />
      <circle cx={x + 27} cy={y + 10} r="2" fill={cyan} />
    </g>
  );
}
function Nodes({ workflow = false }: { workflow?: boolean }) {
  const points = workflow
    ? [
        [110, 210],
        [240, 120],
        [370, 210],
        [500, 120],
      ]
    : [
        [110, 100],
        [310, 65],
        [510, 110],
        [100, 310],
        [325, 365],
        [540, 315],
      ];
  return (
    <g>
      {points.map(([x, y], i) => (
        <g key={i}>
          <path
            className={styles.flow}
            d={
              workflow && i
                ? `M${points[i - 1][0]} ${points[i - 1][1]}L${x} ${y}`
                : `M320 220L${x} ${y}`
            }
            stroke={i % 2 ? cyan : blue}
            strokeWidth="2"
            strokeOpacity=".6"
            fill="none"
          />
          <rect
            x={x - 30}
            y={y - 25}
            width="60"
            height="50"
            rx="12"
            fill="#142f53"
            stroke={i % 2 ? coral : blue}
          />
          <path
            d={`M${x - 12} ${y}h24m-12-12v24`}
            stroke={cyan}
            strokeWidth="2"
          />
        </g>
      ))}
      {!workflow && (
        <g>
          <circle cx="320" cy="220" r="66" fill="#173c71" stroke={blue} />
          <circle
            className={styles.breathe}
            cx="320"
            cy="220"
            r="45"
            fill="#2455a5"
          />
          <path d="M297 220h46m-23-23v46" stroke={cyan} strokeWidth="4" />
        </g>
      )}
    </g>
  );
}
function Neural() {
  const points = [
    [95, 80],
    [92, 210],
    [95, 350],
    [265, 110],
    [265, 300],
    [430, 80],
    [430, 220],
    [430, 350],
    [560, 210],
  ];
  const links = [
    [0, 3],
    [1, 3],
    [1, 4],
    [2, 4],
    [3, 5],
    [3, 6],
    [4, 6],
    [4, 7],
    [5, 8],
    [6, 8],
    [7, 8],
  ];
  return (
    <g>
      {links.map(([a, b], i) => (
        <path
          key={i}
          className={styles.flow}
          d={`M${points[a][0]} ${points[a][1]}L${points[b][0]} ${points[b][1]}`}
          stroke={i % 3 ? blue : coral}
          strokeWidth="2"
          strokeOpacity=".55"
          fill="none"
        />
      ))}
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r={i === 6 ? 31 : 20}
            fill="#173b70"
            stroke={i % 3 ? cyan : coral}
          />
          <circle
            className={styles.breathe}
            cx={x}
            cy={y}
            r="8"
            fill={i % 3 ? cyan : orange}
          />
        </g>
      ))}
    </g>
  );
}
function Code() {
  return (
    <g>
      <Panel x={115} y={70} width={390} height={250} />
      <path
        d="m210 143-28 28 28 28m85-56 28 28-28 28m-30-65-25 74"
        stroke={cyan}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M165 ${240 + i * 18}h${175 - i * 25}`}
          stroke={i === 1 ? coral : blue}
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
      <path
        className={styles.flow}
        d="M160 320v45h320v-45M320 320v45"
        stroke={blue}
        fill="none"
      />
      <rect
        x="260"
        y="344"
        width="120"
        height="40"
        rx="9"
        fill="#18365e"
        stroke={coral}
      />
    </g>
  );
}
function Devices({ mobileOnly = false }: { mobileOnly?: boolean }) {
  return (
    <g>
      {!mobileOnly && (
        <>
          <Panel x={65} y={72} width={425} height={255} />
          <rect x="93" y="116" width="160" height="115" rx="9" fill="#244c88" />
          <path
            d="M278 125h175m-175 24h130m-130 32h150m-150 48h85"
            stroke={cyan}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <rect x="93" y="252" width="355" height="42" rx="8" fill="#1d3e69" />
          <path
            d="M215 327v32h130v-32M180 362h200"
            stroke={blue}
            strokeWidth="6"
            fill="none"
          />
        </>
      )}
      <rect
        x={mobileOnly ? 230 : 420}
        y={mobileOnly ? 45 : 155}
        width={mobileOnly ? 190 : 130}
        height={mobileOnly ? 345 : 235}
        rx="25"
        fill="#122b4d"
        stroke={blue}
        strokeWidth="3"
      />
      <path
        d={mobileOnly ? "M285 63h80" : "M460 172h50"}
        stroke={coral}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={mobileOnly ? 250 : 437}
          y={(mobileOnly ? 105 : 210) + i * (mobileOnly ? 75 : 49)}
          width={mobileOnly ? 150 : 96}
          height={mobileOnly ? 55 : 33}
          rx="8"
          fill={i % 2 ? "#244c88" : "#193c64"}
          stroke={i === 2 ? coral : cyan}
          strokeOpacity=".6"
        />
      ))}
    </g>
  );
}
function Calendar() {
  return (
    <g>
      <Panel x={125} y={65} width={380} height={310} />
      <path
        d="M210 45v45m210-45v45"
        stroke={coral}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {Array.from({ length: 20 }, (_, i) => (
        <rect
          key={i}
          x={155 + (i % 5) * 64}
          y={120 + Math.floor(i / 5) * 57}
          width="43"
          height="38"
          rx="8"
          fill={i === 12 ? orange : "#22426d"}
          stroke={i === 12 ? "#fdba74" : blue}
          strokeOpacity=".45"
        />
      ))}
      <path d="m293 247 8 8 14-17" stroke="#fff" strokeWidth="3" fill="none" />
    </g>
  );
}
function Marketing({ campaign = false }: { campaign?: boolean }) {
  return (
    <g>
      <Panel x={135} y={95} width={350} height={250} />
      {[65, 95, 120, 155].map((h, i) => (
        <rect
          key={i}
          x={175 + i * 65}
          y={310 - h}
          width="35"
          height={h}
          rx="6"
          fill={i === 3 ? coral : "#3265a5"}
        />
      ))}
      <path
        className={styles.flow}
        d="M85 100Q320-25 555 90M85 330Q320 450 555 345"
        stroke={cyan}
        strokeWidth="2"
        fill="none"
      />
      {[
        [80, 100],
        [550, 90],
        [550, 345],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="29"
            fill="#19385f"
            stroke={i ? blue : coral}
          />
          <path
            d={`M${x - 12} ${y - 8}h24v16h-13l-8 7v-7h-3z`}
            stroke={cyan}
            fill="none"
          />
        </g>
      ))}
      {campaign && (
        <circle
          className={styles.breathe}
          cx="465"
          cy="120"
          r="19"
          fill={orange}
        />
      )}
    </g>
  );
}
function Workspace({ pipeline = false }: { pipeline?: boolean }) {
  return (
    <g>
      <Panel x={90} y={70} width={450} height={300} />
      {[0, 1, 2].map((col) => (
        <g key={col}>
          <rect
            x={115 + col * 140}
            y="113"
            width="115"
            height="30"
            rx="7"
            fill={col === 2 ? "#81484d" : "#285184"}
          />
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <rect
                x={115 + col * 140}
                y={160 + row * 60}
                width="115"
                height="45"
                rx="8"
                fill="#1a365d"
                stroke={blue}
                strokeOpacity=".35"
              />
              <circle
                cx={132 + col * 140}
                cy={183 + row * 60}
                r="6"
                fill={pipeline && col === 2 ? coral : cyan}
              />
              <path
                d={`M${147 + col * 140} ${182 + row * 60}h60`}
                stroke={blue}
                strokeWidth="3"
              />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}
function Conversation({ receptionist = false }: { receptionist?: boolean }) {
  return (
    <g>
      <rect
        x="135"
        y="80"
        width="355"
        height="235"
        rx="32"
        fill="#183b69"
        stroke={blue}
      />
      <path d="m175 315-24 51 83-51" fill="#183b69" stroke={blue} />
      <rect x="175" y="120" width="225" height="40" rx="17" fill="#24558c" />
      <rect x="230" y="185" width="220" height="40" rx="17" fill="#684252" />
      <path
        className={styles.flow}
        d="M230 270h30l12-24 14 47 15-47 15 47 14-24h45"
        stroke={cyan}
        strokeWidth="3"
        fill="none"
      />
      {receptionist && (
        <g>
          <circle cx="500" cy="100" r="47" fill="#17385f" stroke={coral} />
          <path
            d="M473 110v-15a27 27 0 0 1 54 0v15m-54-10v18m54-18v18h-14"
            stroke={cyan}
            strokeWidth="5"
            fill="none"
          />
        </g>
      )}
    </g>
  );
}
function Privacy() {
  return (
    <g>
      <path
        d="M320 45 475 110v105c0 87-70 146-155 185-85-39-155-98-155-185V110Z"
        fill="#173c6b"
        stroke={blue}
        strokeWidth="2"
      />
      <rect
        x="260"
        y="185"
        width="120"
        height="100"
        rx="18"
        fill="#27568b"
        stroke={cyan}
      />
      <path
        d="M282 185v-27a38 38 0 0 1 76 0v27"
        stroke={coral}
        strokeWidth="6"
        fill="none"
      />
      <circle cx="320" cy="224" r="9" fill={cyan} />
      <path d="M320 232v20" stroke={cyan} strokeWidth="6" />
    </g>
  );
}
function Company({ strategy = false }: { strategy?: boolean }) {
  return (
    <g>
      <path
        className={styles.flow}
        d="M90 325h110l80-105h115l100-115"
        stroke={cyan}
        strokeWidth="3"
        fill="none"
      />
      {[
        [90, 325],
        [240, 270],
        [380, 220],
        [495, 105],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="26"
            fill="#214776"
            stroke={i === 3 ? coral : blue}
          />
          <path d={`M${x - 9} ${y}h18`} stroke={cyan} strokeWidth="3" />
        </g>
      ))}
      <Panel x={100} y={65} width={strategy ? 155 : 135} height={130} />
      <path
        d="M122 105h90m-90 25h65m-65 25h75"
        stroke={blue}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {strategy && (
        <path
          d="M340 65h100v70H340zM390 65v70m-50-35h100"
          stroke={coral}
          fill="none"
        />
      )}
    </g>
  );
}
function Portfolio({ fintech = false }: { fintech?: boolean }) {
  return (
    <g>
      {[
        [115, 65],
        [345, 105],
        [115, 245],
        [345, 285],
      ].map(([x, y], i) => (
        <g key={i}>
          <Panel x={x} y={y} width={170} height={125} />
          <path
            d={`M${x + 20} ${y + 55}h${i % 2 ? 90 : 120}m-${i % 2 ? 90 : 120} 25h65`}
            stroke={i === 2 ? coral : cyan}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      ))}
      {fintech && (
        <g>
          <circle cx="320" cy="225" r="50" fill="#224a7c" stroke={coral} />
          <path
            d="M300 248v-46l40 46v-46m-50 17h60m-60 14h60"
            stroke={cyan}
            strokeWidth="4"
          />
        </g>
      )}
    </g>
  );
}
export default function PageHeroVisual({ theme }: { theme: Visual }) {
  const visual =
    theme === "neural" ? (
      <Neural />
    ) : theme === "code" ? (
      <Code />
    ) : theme === "devices" ? (
      <Devices />
    ) : theme === "mobile" ? (
      <Devices mobileOnly />
    ) : theme === "calendar" ? (
      <Calendar />
    ) : theme === "marketing" || theme === "campaign" ? (
      <Marketing campaign={theme === "campaign"} />
    ) : theme === "workspace" || theme === "pipeline" ? (
      <Workspace pipeline={theme === "pipeline"} />
    ) : theme === "contact" || theme === "receptionist" ? (
      <Conversation receptionist={theme === "receptionist"} />
    ) : theme === "privacy" ? (
      <Privacy />
    ) : theme === "company" || theme === "strategy" ? (
      <Company strategy={theme === "strategy"} />
    ) : theme === "portfolio" || theme === "fintech" ? (
      <Portfolio fintech={theme === "fintech"} />
    ) : (
      <Nodes workflow={theme === "workflow"} />
    );
  return (
    <svg
      data-hero-visual={theme}
      viewBox="0 0 640 440"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={styles.illustration}
    >
      <g className={styles.drift}>{visual}</g>
      {[
        [60, 160],
        [570, 270],
        [330, 30],
        [310, 410],
      ].map(([x, y], i) => (
        <circle
          key={i}
          className={styles.breathe}
          cx={x}
          cy={y}
          r={i % 2 ? 3 : 5}
          fill={i % 2 ? coral : cyan}
          opacity=".65"
        />
      ))}
    </svg>
  );
}
