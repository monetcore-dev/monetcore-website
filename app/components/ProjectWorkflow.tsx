"use client";

import { useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Check,
  Compass,
  FileText,
  Code2,
  Rocket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const steps = [
  {
    title: "Understand",
    summary:
      "Discuss your goals, existing tools and the people who will use the solution.",
    icon: Compass,
    accent: "#2854bd",
    tint: "#edf3ff",
    heading: "Start with the business, not the technology.",
    detail:
      "We explore the challenge you want to solve, who it affects and how your team works today. This gives the project a shared starting point before a solution is proposed.",
    points: [
      "Business goals and user needs",
      "Current tools and practical constraints",
      "What a useful outcome looks like",
    ],
  },
  {
    title: "Define",
    summary:
      "Agree deliverables, integrations, costs and a practical project scope.",
    icon: FileText,
    accent: "#5142ab",
    tint: "#f0edff",
    heading: "Make the scope and expectations clear.",
    detail:
      "Together, we clarify what will be delivered, what depends on third-party services and how the work will be reviewed. Pricing and timelines are agreed for the specific project.",
    points: [
      "Deliverables and integration requirements",
      "Responsibilities, costs and dependencies",
      "A realistic scope and review plan",
    ],
  },
  {
    title: "Build & Review",
    summary:
      "Develop in manageable stages and gather feedback at agreed checkpoints.",
    icon: Code2,
    accent: "#234862",
    tint: "#eef4f8",
    heading: "Build in stages. Learn through feedback.",
    detail:
      "Development follows the agreed scope, with opportunities to review progress and refine the work at planned checkpoints. Relevant checks help us assess the solution before launch.",
    points: [
      "Manageable development stages",
      "Feedback at agreed review points",
      "Relevant functionality and quality checks",
    ],
  },
  {
    title: "Launch & Support",
    summary:
      "Review the finished work, plan an approved launch and agree ongoing support.",
    icon: Rocket,
    accent: "#754493",
    tint: "#f6effb",
    heading: "Prepare for launch and what comes after.",
    detail:
      "We review the finished solution with you and plan the launch once it is approved. Handover and ongoing support are discussed as part of the agreed engagement, rather than assumed to be unlimited.",
    points: [
      "Final review and launch approval",
      "Handover and operational requirements",
      "A separately agreed support arrangement",
    ],
  },
];

export default function ProjectWorkflow() {
  const [active, setActive] = useState(0);
  const selected = steps[active];
  const Icon = selected.icon;
  return (
    <div className="workflow-explorer">
      <ol className="workflow-cards" aria-label="Project workflow steps">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          return (
            <li
              key={step.title}
              style={
                {
                  "--step-accent": step.accent,
                  "--step-tint": step.tint,
                } as CSSProperties
              }
            >
              <button
                type="button"
                id={`workflow-step-${index}`}
                aria-pressed={active === index}
                aria-controls="workflow-detail"
                onClick={() => setActive(index)}
                className="workflow-card"
              >
                <span className="workflow-top">
                  <span className="workflow-icon">
                    <StepIcon size={25} strokeWidth={1.6} aria-hidden="true" />
                  </span>
                  <span className="workflow-number">0{index + 1}</span>
                </span>
                <span className="workflow-title">{step.title}</span>
                <span className="workflow-summary">{step.summary}</span>
                <span className="workflow-prompt">
                  {active === index
                    ? "Currently exploring"
                    : "Explore this step"}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="workflow-navigation">
        <p>
          Step {active + 1} of {steps.length} · {selected.title}
        </p>
        <div>
          <button
            type="button"
            onClick={() => setActive((current) => Math.max(0, current - 1))}
            disabled={active === 0}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Previous Step
          </button>
          <button
            type="button"
            onClick={() =>
              setActive((current) => Math.min(steps.length - 1, current + 1))
            }
            disabled={active === steps.length - 1}
          >
            Next Step
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        id="workflow-detail"
        tabIndex={0}
        role="region"
        aria-label="Workflow step details"
        aria-live="polite"
        aria-atomic="true"
        className="workflow-detail"
        style={
          {
            "--step-accent": selected.accent,
            "--step-tint": selected.tint,
          } as CSSProperties
        }
      >
        <div key={active} className="workflow-detail-content">
          <div>
            <p className="eyebrow">
              Step 0{active + 1} · {selected.title}
            </p>
            <h3>
              <Icon size={23} aria-hidden="true" />
              {selected.heading}
            </h3>
            <p>{selected.detail}</p>
          </div>
          <div>
            <p className="workflow-deliverables-label">
              Deliverables to agree at this stage
            </p>
            <ul>
              {selected.points.map((point) => (
                <li key={point}>
                  <Check size={17} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
