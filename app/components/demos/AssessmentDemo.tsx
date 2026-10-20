"use client";
import { useState } from "react";
import {
  technologyChallenges,
  technologyRoadmap,
} from "../../config/demoPlanning";
export default function AssessmentDemo() {
  const [selected, setSelected] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<string[]>([]);
  const [error, setError] = useState("");
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">
          Business Technology Assessment · illustrative
        </span>
        <button
          onClick={() => {
            setSelected([]);
            setRoadmap([]);
            setError("");
          }}
        >
          Reset assessment
        </button>
      </div>
      <h3>What is getting in the way?</h3>
      <p>
        Select fictional or general challenges. This local assessment is a
        starting point for a conversation, not a technical audit, quotation or
        automated professional advice.
      </p>
      <fieldset>
        <legend>Business challenges</legend>
        <div className="demo-assessment">
          {technologyChallenges.map((c) => (
            <label className="demo-check" key={c}>
              <input
                type="checkbox"
                checked={selected.includes(c)}
                onChange={() => {
                  setSelected((s) =>
                    s.includes(c) ? s.filter((x) => x !== c) : [...s, c],
                  );
                  setRoadmap([]);
                  setError("");
                }}
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className="demo-run"
        onClick={() => {
          const next = technologyRoadmap(selected);
          setRoadmap(next);
          setError(next.length ? "" : "Select at least one challenge.");
        }}
      >
        Build illustrative roadmap
      </button>
      {error && <p role="alert">{error}</p>}
      {roadmap.length > 0 && (
        <div className="demo-result">
          <h3>Your discussion roadmap</h3>
          <ol className="demo-flow">
            {roadmap.map((s, i) => (
              <li key={s}>
                <span>{i + 1}</span>
                <p>{s}</p>
              </li>
            ))}
          </ol>
          <p>
            Validate these priorities, costs and data/security requirements with
            a consultant before implementation.
          </p>
        </div>
      )}
    </div>
  );
}
