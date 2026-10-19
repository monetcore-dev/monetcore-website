"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight, ClipboardList, Check } from "lucide-react";
import {
  enquiryBudgets,
  plannerCapabilities,
  plannerChallenges,
  recommendProject,
  solutionOptions,
  type SolutionId,
} from "../config/projectPlanner";
import { useProjectPlan } from "./ProjectPlanContext";

export default function SmartProjectPlanner() {
  const planner = useProjectPlan();
  const [goal, setGoal] = useState<SolutionId | "unsure" | "">("");
  const [challenge, setChallenge] = useState("");
  const [budget, setBudget] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const ready = goal !== "" && challenge !== "" && budget !== "";
  const recommendation = ready
    ? recommendProject({ goal, challenge, budget, capabilities })
    : null;
  function discuss(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recommendation || !planner) return;
    planner.applyDraft({
      service: recommendation.solution.formService,
      budget,
      message: recommendation.message,
    });
    window.location.hash = "project-enquiry";
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLTextAreaElement>(
          '#project-enquiry textarea[name="message"]',
        )
        ?.focus({ preventScroll: true }),
    );
  }
  return (
    <div id="smart-project-planner" className="smart-project-planner">
      <div className="planner-intro">
        <span>
          <ClipboardList size={25} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">A useful starting point</p>
          <h3>Smart Project Planner</h3>
          <p>
            Four questions. A practical direction to discuss. This is rule-based
            guidance, not an AI-generated quote or estimate.
          </p>
        </div>
      </div>
      <form onSubmit={discuss} aria-label="Smart project planner">
        <div className="planner-fields">
          <label>
            What do you want to build or improve?
            <select
              name="plannerGoal"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value as typeof goal)}
            >
              <option value="">Choose an area</option>
              {solutionOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
              <option value="unsure">I&apos;m not sure — help me choose</option>
            </select>
          </label>
          <label>
            What is your main business challenge?
            <select
              name="plannerChallenge"
              required
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
            >
              <option value="">Choose a challenge</option>
              {plannerChallenges.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend>
            Which capabilities do you need?{" "}
            <span>Optional · choose any that fit</span>
          </legend>
          <div className="planner-capabilities">
            {plannerCapabilities.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  name="plannerCapability"
                  value={item.id}
                  checked={capabilities.includes(item.id)}
                  onChange={(e) =>
                    setCapabilities((current) =>
                      e.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    )
                  }
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="planner-budget">
          What is your estimated budget?
          <select
            name="plannerBudget"
            required
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          >
            <option value="">Select a budget range</option>
            {enquiryBudgets.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div
          className="planner-recommendation"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="eyebrow">
            {recommendation
              ? "Suggested service to discuss"
              : "Your project direction"}
          </p>
          <h4>
            {recommendation?.solution.title ??
              "Choose your goal, challenge and budget."}
          </h4>
          <p>
            {recommendation?.reason ??
              "Select the options above to see a relevant Monetcore service. You can leave capabilities unchecked if you are unsure."}
          </p>
          {recommendation && (
            <p className="planner-scope-note">
              <Check size={15} aria-hidden="true" />
              Final scope, pricing, timelines and third-party costs need a
              consultation.
            </p>
          )}
        </div>
        <div className="planner-submit">
          <button type="submit" disabled={!ready || !planner}>
            Discuss This Project
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
          <p>
            Nothing is sent by this button. It fills service, budget and project
            details in the enquiry form below; your name and email stay
            unchanged. Selections stay in this page&apos;s memory.
          </p>
        </div>
      </form>
    </div>
  );
}
