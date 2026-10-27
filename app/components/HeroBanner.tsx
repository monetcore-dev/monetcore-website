"use client";

import { useState, type ReactNode } from "react";
import styles from "./hero-banner.module.css";

/** Decorative company-wide technology visual; no requests or simulated live data. */
export default function HeroBanner({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <section id="corporate-hero" className={`relative overflow-hidden px-5 pb-20 pt-36 lg:px-8 lg:pb-24 lg:pt-44 ${styles.banner}`} data-motion={paused ? "paused" : "running"}>
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.glow} />
        <svg className={styles.field} viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
          <defs>
            <linearGradient id="hero-electron" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#408cff" /><stop offset=".6" stopColor="#9575ff" /><stop offset="1" stopColor="#d976b8" />
            </linearGradient>
          </defs>
          <g className={styles.orbits} fill="none" stroke="url(#hero-electron)">
            <ellipse cx="1120" cy="410" rx="350" ry="220" transform="rotate(-28 1120 410)" />
            <ellipse cx="1120" cy="410" rx="260" ry="350" transform="rotate(35 1120 410)" />
            <ellipse cx="1120" cy="410" rx="390" ry="130" transform="rotate(18 1120 410)" />
          </g>
          <g className={styles.trails} fill="none" stroke="url(#hero-electron)" strokeWidth="2">
            <path d="M-100 850 C340 500 660 1050 1100 470 S1550 200 1600 0" />
            <path d="M-100 930 C280 520 700 1120 1120 490 S1460 200 1600 50" />
            <path d="M600 -100 C900 230 620 460 1050 650 S1450 750 1600 1000" />
          </g>
          <g className={styles.particles}>
            {Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={710 + (i * 137) % 720} cy={70 + (i * 113) % 850} r={i % 5 === 0 ? 3 : 1.5} fill={i % 7 === 0 ? "#ffce91" : "#a9caff"} style={{ animationDelay: `${-i * 0.6}s` }} />
            ))}
          </g>
        </svg>
      </div>
      {children}
      <div className={styles.controls}>
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? "Resume background animation" : "Pause background animation"}
        </button>
      </div>
    </section>
  );
}
