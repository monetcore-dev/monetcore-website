import type { CSSProperties, ReactNode } from "react";
import styles from "./hero-banner.module.css";

// Exact cubic ellipses: each electron and its trail use the same path as its orbit.
function ellipse(rx: number, ry: number, degrees: number) {
  const angle = degrees * Math.PI / 180;
  const point = (x: number, y: number) =>
    `${(1080 + x * Math.cos(angle) - y * Math.sin(angle)).toFixed(2)} ${(410 + x * Math.sin(angle) + y * Math.cos(angle)).toFixed(2)}`;
  const k = 0.5522847498;
  return `M ${point(rx, 0)} C ${point(rx, k * ry)} ${point(k * rx, ry)} ${point(0, ry)} C ${point(-k * rx, ry)} ${point(-rx, k * ry)} ${point(-rx, 0)} C ${point(-rx, -k * ry)} ${point(-k * rx, -ry)} ${point(0, -ry)} C ${point(k * rx, -ry)} ${point(rx, -k * ry)} ${point(rx, 0)} Z`;
}
const orbits = [
  { path: ellipse(340, 145, -32), color: "#55e9ff", seconds: 32, delay: -7, reverse: false },
  { path: ellipse(310, 170, 42), color: "#668fff", seconds: 41, delay: -22, reverse: true },
  { path: ellipse(350, 130, 77), color: "#bd8aff", seconds: 47, delay: -13, reverse: false },
  { path: ellipse(360, 120, 6), color: "#F97316", seconds: 56, delay: -38, reverse: true },
];

/** Decorative capabilities visual only: CSS animation, no browser JS or requests. */
export default function HeroBanner({ children }: { children: ReactNode }) {
  return (
    <section id="corporate-hero" className={`relative overflow-hidden px-5 pb-20 pt-36 lg:px-8 lg:pb-24 lg:pt-44 ${styles.banner}`}>
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.glow} />
        <svg className={styles.field} viewBox="0 0 1440 1000" preserveAspectRatio="xMaxYMid slice" focusable="false">
          {orbits.map((orbit, index) => {
            const timing: CSSProperties = {
              animationDuration: `${orbit.seconds}s`,
              animationDelay: `${orbit.delay}s`,
              animationDirection: orbit.reverse ? "reverse" : "normal",
            };
            return (
              <g key={orbit.color} color={orbit.color}>
                <path d={orbit.path} className={styles.orbit} />
                <path d={orbit.path} pathLength="1000" className={styles.trail} style={timing} />
                <g className={styles.electron} data-electron={index} style={{ ...timing, offsetPath: `path('${orbit.path}')`, offsetDistance: `${18 + index * 21}%` }}>
                  <circle r="18" fill="currentColor" opacity=".05" />
                  <circle r="11.5" fill="currentColor" opacity=".11" />
                  <circle r="7.2" fill="currentColor" opacity=".3" />
                  <circle r="4.3" fill="currentColor" />
                  <circle r="2.1" fill="#f8ffff" />
                </g>
              </g>
            );
          })}
          <g className={styles.particles}>
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={710 + (i * 137) % 720} cy={70 + (i * 113) % 850} r={i % 5 === 0 ? 2 : 1} fill={i % 7 === 0 ? "#FB7185" : "#a9caff"} style={{ animationDelay: `${-i * 0.6}s` }} />
            ))}
          </g>
        </svg>
      </div>
      {children}
    </section>
  );
}

export function HeroServiceElectron({ index }: { index: number }) {
  const accents = ["#bd8aff", "#55e9ff", "#F97316", "#78e7ad"];
  return <span aria-hidden="true" className={styles.serviceElectron} style={{ color: accents[index % accents.length], animationDelay: `${-index}s` }} />;
}
