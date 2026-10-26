"use client";
import { useState } from "react";
import {
  campaignPlan,
  marketingGoals,
  marketingIndustries,
  marketingPlatforms,
} from "../../config/demoPlanning";
export default function MarketingDemo() {
  const [industry, setIndustry] = useState("Retail");
  const [goal, setGoal] = useState("Enquiries");
  const [platforms, setPlatforms] = useState<string[]>([
    "Instagram",
    "WhatsApp",
  ]);
  const [weeks, setWeeks] = useState(4);
  const [plan, setPlan] = useState<ReturnType<typeof campaignPlan>>(null);
  const [view, setView] = useState("Strategy");
  const [error, setError] = useState("");
  const [followup, setFollowup] = useState(0);
  function invalidate() {
    setPlan(null);
    setError("");
    setFollowup(0);
  }
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">
          Simulated AI Marketing Campaign Planner
        </span>
        <button
          onClick={() => {
            setIndustry("Retail");
            setGoal("Enquiries");
            setPlatforms(["Instagram", "WhatsApp"]);
            setWeeks(4);
            invalidate();
            setView("Strategy");
          }}
        >
          Reset campaign
        </button>
      </div>
      <p>
        Local, rule-based examples. No AI provider, ad account, publishing,
        spend or customer messaging. Illustrative metrics are fictional, not
        forecasts or performance guarantees.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next = campaignPlan(industry, goal, platforms, weeks);
          setPlan(next);
          setError(next ? "" : "Choose at least one platform.");
          setView("Strategy");
        }}
      >
        <div className="demo-filters">
          <label>
            Business industry
            <select
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                invalidate();
              }}
            >
              {marketingIndustries.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Campaign goal
            <select
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                invalidate();
              }}
            >
              {marketingGoals.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Illustrative duration
            <select
              value={weeks}
              onChange={(e) => {
                setWeeks(Number(e.target.value));
                invalidate();
              }}
            >
              {[2, 4, 6].map((n) => (
                <option key={n} value={n}>
                  {n} weeks
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend>Preferred platforms</legend>
          <div className="demo-switches">
            {marketingPlatforms.map((p) => (
              <label className="demo-check" key={p}>
                <input
                  type="checkbox"
                  checked={platforms.includes(p)}
                  onChange={() => {
                    setPlatforms((current) =>
                      current.includes(p)
                        ? current.filter((x) => x !== p)
                        : [...current, p],
                    );
                    invalidate();
                  }}
                />
                {p}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="demo-run" type="submit">
          Generate sample strategy
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      {plan && (
        <div className="demo-result">
          <div className="demo-switches" aria-label="Campaign result views">
            {[
              "Strategy",
              "Content calendar",
              "Content preview",
              "Lead follow-up",
              "Sample metrics",
            ].map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <h3>
            {plan.industry} · {plan.goal} · {plan.weeks} weeks
          </h3>
          {view === "Strategy" ? (
            <>
              <h4>Sample campaign direction</h4>
              <p>{plan.focus}</p>
              <p>
                Channels: {plan.platforms.join(", ")}. Agree audience, budget,
                creative, tracking and consent before implementation.
                Advertising spend and provider fees are separately scoped.
              </p>
            </>
          ) : view === "Content calendar" ? (
            <ol className="demo-calendar">
              {plan.calendar.map((w) => (
                <li key={w.week}>
                  <strong>
                    Week {w.week} · {w.channel}
                  </strong>
                  <p>{w.theme}</p>
                </li>
              ))}
            </ol>
          ) : view === "Content preview" ? (
            <div className="demo-content-card">
              <span>Suggested copy · illustrative</span>
              <h4>{plan.industry} / a useful next step</h4>
              <p>{plan.sample}</p>
              <p>
                Creative direction: a clear branded card or a short explanation
                video using approved business assets and consented imagery.
              </p>
            </div>
          ) : view === "Lead follow-up" ? (
            <>
              <ol className="demo-flow">
                {[
                  "Capture consented enquiry",
                  "Create a CRM review task",
                  "Prepare a relevant response",
                  "Human review before follow-up",
                ].map((s, i) => (
                  <li key={s} className={i <= followup ? "active" : ""}>
                    <span>{i + 1}</span>
                    <strong>{s}</strong>
                  </li>
                ))}
              </ol>
              <button onClick={() => setFollowup((x) => (x >= 3 ? 0 : x + 1))}>
                {followup >= 3 ? "Replay follow-up" : "Explore next handoff"}
              </button>
              <p role="status">
                Sample stage {followup + 1} of 4. No message sent.
              </p>
            </>
          ) : (
            <>
              <div className="demo-stats">
                <div>
                  <span>Fictional enquiries</span>
                  <strong>{plan.illustrativeEnquiries}</strong>
                </div>
                <div>
                  <span>Sample content weeks</span>
                  <strong>{plan.weeks}</strong>
                </div>
                <div>
                  <span>Selected channels</span>
                  <strong>{plan.platforms.length}</strong>
                </div>
              </div>
              <p>
                Sample counts explain a reporting layout only. They are
                deterministically generated from these selections and are not
                measured campaign results.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
