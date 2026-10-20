"use client";

import Link from "next/link";
import { useId, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Code2,
  Cpu,
  Layers3,
  Megaphone,
  Pause,
  Play,
  PlugZap,
} from "lucide-react";
import "./ai-core.css";

const nodes = [
  {
    title: "AI Automation",
    description:
      "Assisted conversations and practical, human-reviewed business workflows.",
    href: "/services/ai-automation",
    icon: Cpu,
    x: 300,
    y: 65,
  },
  {
    title: "Software Development",
    description:
      "Custom applications, customer portals and tools built around your operations.",
    href: "/services/software-development",
    icon: Code2,
    x: 490,
    y: 220,
  },
  {
    title: "Digital Marketing",
    description:
      "Connected campaign planning, content, lead nurturing and reporting.",
    href: "/services/digital-marketing",
    icon: Megaphone,
    x: 430,
    y: 485,
  },
  {
    title: "Business Integrations",
    description:
      "Connect your approved platforms, data and operational handovers.",
    href: "/services/business-integrations",
    icon: PlugZap,
    x: 170,
    y: 485,
  },
  {
    title: "Smart Products",
    description:
      "Explore Monetcore product concepts, prototypes and local demonstrations.",
    href: "/products",
    icon: Layers3,
    x: 110,
    y: 220,
  },
];

export default function AICore() {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const current = active === null ? null : nodes[active];
  return (
    <section
      className="ai-core"
      aria-label="Monetcore AI Core"
      data-paused={paused}
    >
      <div className="ai-core-heading">
        <div>
          <span className="ai-core-mark" aria-hidden="true" />
          Monetcore AI Core
        </div>
        <button
          className="ai-core-pause"
          type="button"
          aria-label={
            paused ? "Resume AI Core animation" : "Pause AI Core animation"
          }
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? (
            <Play size={13} aria-hidden="true" />
          ) : (
            <Pause size={13} aria-hidden="true" />
          )}
          <span>{paused ? "Resume" : "Pause"}</span>
        </button>
        <span className="ai-core-static">Static view</span>
      </div>
      <div className="ai-core-stage">
        <div className="ai-core-scene" aria-hidden="true">
          <div className="ai-core-halo" />
          <svg
            className="ai-core-connections"
            viewBox="0 0 600 600"
            preserveAspectRatio="none"
            focusable="false"
          >
            <defs>
              <radialGradient id={`${id}-lines`}>
                <stop offset="0" stopColor="#a5b4fc" />
                <stop offset="1" stopColor="#3b82f6" stopOpacity=".3" />
              </radialGradient>
            </defs>
            <g stroke={`url(#${id}-lines)`} strokeWidth="1.5">
              {nodes.map((n) => (
                <path
                  key={n.title}
                  d={`M300 300 Q${(n.x + 300) / 2 + 25} ${(n.y + 300) / 2} ${n.x} ${n.y}`}
                  fill="none"
                />
              ))}
            </g>
            {nodes.map((n, i) => (
              <circle
                key={n.title}
                className="ai-core-particle ai-core-moving"
                cx="300"
                cy="300"
                r="2.5"
                fill="#93c5fd"
                style={
                  {
                    "--dx": `${n.x - 300}px`,
                    "--dy": `${n.y - 300}px`,
                    animationDelay: `-${i * 1.7}s`,
                  } as CSSProperties
                }
              />
            ))}
          </svg>
          <div className="ai-core-orbit orbit-one">
            <div className="ai-core-orbit-track ai-core-moving" />
          </div>
          <div className="ai-core-orbit orbit-two">
            <div className="ai-core-orbit-track ai-core-moving" />
          </div>
          <div className="ai-core-orbit orbit-three">
            <div className="ai-core-orbit-track ai-core-moving" />
          </div>
          <div className="ai-core-sphere">
            <div className="ai-core-surface ai-core-moving" />
            <div className="ai-core-sphere-grid" />
            <div className="ai-core-sphere-label">
              <Cpu size={32} />
              <span>AI CORE</span>
            </div>
          </div>
          <span className="ai-core-caption">
            INTELLIGENCE · ENGINEERING · CONNECTION
          </span>
        </div>
        <nav
          className="ai-core-nodes"
          aria-label="Explore Monetcore capabilities"
        >
          {nodes.map((n, i) => {
            const Icon = n.icon;
            return (
              <div
                key={n.title}
                className={`ai-core-node-slot ai-core-node-${i} ai-core-moving`}
                style={
                  {
                    "--node-x": `${n.x / 6}%`,
                    "--node-y": `${n.y / 6}%`,
                    animationDelay: `-${i * 2}s`,
                  } as CSSProperties
                }
              >
                <Link
                  className={`ai-core-node ${active === i ? "is-active" : ""}`}
                  href={n.href}
                  aria-label={n.title}
                  aria-describedby={`${id}-node-${i}`}
                  onFocus={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{n.title}</span>
                  <ArrowUpRight
                    className="ai-core-node-arrow"
                    size={12}
                    aria-hidden="true"
                  />
                </Link>
                <span className="sr-only" id={`${id}-node-${i}`}>
                  {n.description}
                </span>
              </div>
            );
          })}
        </nav>
      </div>
      <div className="ai-core-detail">
        <p>
          {current ? current.title : "One company. Connected capabilities."}
        </p>
        <span>
          {current
            ? current.description
            : "Explore a node to see where software, automation and business technology connect."}
        </span>
      </div>
      <p className="ai-core-disclosure">
        Interactive capability visualization. No live AI requests are processed.
      </p>
    </section>
  );
}
