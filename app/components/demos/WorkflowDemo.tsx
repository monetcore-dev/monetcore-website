"use client";
import { useState } from "react";
const tools = ["CRM", "Email", "Accounting", "WhatsApp", "Inventory"];
export default function WorkflowDemo() {
  const [selected, setSelected] = useState(["CRM", "Email", "Accounting"]);
  const [approval, setApproval] = useState(true);
  const [step, setStep] = useState(-1);
  const [fail, setFail] = useState(false);
  const [held, setHeld] = useState(false);
  const [template, setTemplate] = useState("Enquiry handoff");
  const stages = [
    "Receive synthetic event",
    ...selected,
    ...(approval ? ["Human approval"] : []),
    "Record sample completion",
  ];
  const complete = step >= stages.length;
  function reset() {
    setStep(-1);
    setHeld(false);
  }
  function advance() {
    if (fail && step === 1) {
      setHeld(true);
      return;
    }
    setStep((s) => s + 1);
  }
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">
          Local workflow builder · no connected systems
        </span>
        <button onClick={reset}>Reset workflow</button>
      </div>
      <div className="demo-filters">
        <label>
          Workflow template
          <select
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value);
              reset();
            }}
          >
            {["Enquiry handoff", "Order review", "Approval request"].map(
              (t) => (
                <option key={t}>{t}</option>
              ),
            )}
          </select>
        </label>
        <label className="demo-check">
          <input
            type="checkbox"
            checked={approval}
            onChange={(e) => {
              setApproval(e.target.checked);
              reset();
            }}
          />
          Include human approval
        </label>
      </div>
      <fieldset>
        <legend>Choose example business systems</legend>
        <div className="demo-switches">
          {tools.map((t) => (
            <button
              key={t}
              aria-pressed={selected.includes(t)}
              onClick={() => {
                setSelected((s) =>
                  s.includes(t) ? s.filter((x) => x !== t) : [...s, t],
                );
                reset();
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </fieldset>
      <p>
        {template}: a synthetic event passes through the selected systems in
        order. These labels do not indicate a live integration.
      </p>
      <ol className="demo-flow">
        {stages.map((s, i) => (
          <li
            className={
              complete || i < step ? "done" : i === step ? "active" : ""
            }
            aria-current={i === step ? "step" : undefined}
            key={`${i}-${s}`}
          >
            <span>{complete || i < step ? "✓" : i + 1}</span>
            <div>
              <strong>{s}</strong>
              <p>
                {complete || i < step
                  ? "Simulated step completed"
                  : i === step
                    ? "Ready for your review"
                    : "Waiting in this local example"}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <label className="demo-check">
        <input
          type="checkbox"
          checked={fail}
          onChange={(e) => {
            setFail(e.target.checked);
            reset();
          }}
        />
        Simulate a recoverable handoff failure
      </label>
      <div className="demo-toolbar">
        <button
          className="demo-run"
          disabled={!selected.length}
          onClick={() => {
            if (step < 0 || complete) {
              setStep(0);
              setHeld(false);
            } else if (held) {
              setFail(false);
              setHeld(false);
              setStep((s) => s + 1);
            } else advance();
          }}
        >
          {step < 0
            ? "Run workflow"
            : complete
              ? "Replay workflow"
              : held
                ? "Retry simulated handoff"
                : stages[step] === "Human approval"
                  ? "Approve sample request"
                  : "Advance workflow"}
        </button>
        <p role="status">
          {!selected.length
            ? "Choose at least one system."
            : held
              ? "Sample handoff paused. No data was sent. Retry resumes this local example."
              : complete
                ? "Simulation complete. No external records or messages were created."
                : step >= 0
                  ? `Step ${step + 1} of ${stages.length}: ${stages[step]}`
                  : "Ready to explore."}
        </p>
      </div>
    </div>
  );
}
