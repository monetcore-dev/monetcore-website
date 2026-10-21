"use client";

import { useEffect, useState } from "react";
import {
  Check,
  MessageSquare,
  Sparkles,
  UserPlus,
  CalendarDays,
  Play,
  RotateCcw,
} from "lucide-react";
const stages = [
  {
    title: "Customer Enquiry",
    icon: MessageSquare,
    label: "Sample customer enquiry",
    text: "“Hello, I run a small business. Can I book a consultation to discuss a website and customer enquiries?”",
  },
  {
    title: "AI Response",
    icon: Sparkles,
    label: "Simulated AI response · predefined text",
    text: "“Thanks for getting in touch. We can discuss your goals, current tools and the enquiry workflow you need. Would you like to arrange a consultation?”",
  },
  {
    title: "Lead Captured",
    icon: UserPlus,
    label: "Fictional lead record",
    text: "Demo visitor · Interest: business website and enquiry handling · No real personal data collected or saved.",
  },
  {
    title: "Follow-Up Scheduled",
    icon: CalendarDays,
    label: "Simulated follow-up",
    text: "A sample follow-up task is shown as scheduled. No message, email, appointment or calendar entry is actually created.",
  },
];
export default function AutomationSimulation() {
  const [stage, setStage] = useState(-1);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (stage >= stages.length - 1) {
      return;
    }
    const timer = setTimeout(() => {
      const next = stage + 1;
      setStage(next);
      if (next === stages.length - 1) setRunning(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, [running, stage]);
  function run() {
    setStage(0);
    setRunning(true);
  }
  const current = stage < 0 ? null : stages[stage];
  return (
    <div
      className={`automation-simulation ${running ? "is-running" : ""}`}
      aria-label="Illustrative AI automation simulation"
    >
      <div className="simulation-heading">
        <div>
          <span className="tech-status-dot" aria-hidden="true" />
          <strong>Illustrative simulation</strong>
        </div>
        <span>No AI API · No live data</span>
      </div>
      <ol
        className="simulation-stages"
        aria-label="Simulated automation workflow"
      >
        {stages.map(({ title, icon: Icon }, index) => (
          <li
            key={title}
            className={
              stage === index ? "is-active" : stage > index ? "is-complete" : ""
            }
            aria-current={stage === index ? "step" : undefined}
          >
            <span>
              {stage > index ? (
                <Check size={18} aria-hidden="true" />
              ) : (
                <Icon size={18} aria-hidden="true" />
              )}
            </span>
            <strong>{title}</strong>
          </li>
        ))}
      </ol>
      <div
        className="simulation-output"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="eyebrow">
          {current?.label ?? "Explore an enquiry-to-follow-up workflow"}
        </p>
        <p>
          {current?.text ??
            "Run the demo to see how an enquiry could move through an automation workflow. All responses are predefined, and every record is fictional."}
        </p>
        <span>
          {stage < 0
            ? "Ready to explore"
            : `Stage ${stage + 1} of ${stages.length}${running ? " · Running" : stage === 3 ? " · Complete" : ""}`}
        </span>
      </div>
      <div className="simulation-controls">
        <button type="button" onClick={run} disabled={running}>
          <Play size={15} aria-hidden="true" />
          {stage < 0 ? "Run Demo" : running ? "Demo Running…" : "Replay Demo"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setStage(-1);
          }}
          disabled={stage < 0 && !running}
        >
          <RotateCcw size={15} aria-hidden="true" />
          Reset Demo
        </button>
      </div>
      <p className="simulation-disclosure">
        This explains a possible workflow; it is not a live AI assistant. No
        real enquiry is submitted, lead stored or follow-up scheduled.
      </p>
    </div>
  );
}
