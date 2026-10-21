"use client";
import { useState } from "react";
export default function LeadDemo() {
  const [business, setBusiness] = useState("Retail business");
  const [budget, setBudget] = useState("To be discussed");
  const [timing, setTiming] = useState("This quarter");
  const [leads, setLeads] = useState<
    {
      id: number;
      business: string;
      stage: string;
      budget: string;
      timing: string;
    }[]
  >([]);
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">
          Synthetic lead capture & qualification
        </span>
        <button
          onClick={() => {
            setLeads([]);
            setBusiness("Retail business");
            setBudget("To be discussed");
            setTiming("This quarter");
            setFilter("All");
            setNotice("");
          }}
        >
          Reset leads
        </button>
      </div>
      <p>
        No customer contact details are collected. Qualification uses the
        selections below, not AI. Leads and follow-up previews exist only in
        this page.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const stage =
            budget !== "To be discussed" && timing !== "Exploring only"
              ? "Discovery ready"
              : "Nurture";
          setLeads((ls) => [
            ...ls,
            { id: (ls.at(-1)?.id || 0) + 1, business, stage, budget, timing },
          ]);
          setNotice(
            `Synthetic enquiry added to ${stage}. CRM handoff is a local preview only.`,
          );
        }}
      >
        <div className="demo-filters">
          <label>
            Sample business
            <select
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
            >
              {[
                "Retail business",
                "Professional practice",
                "Training provider",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Budget readiness
            <select value={budget} onChange={(e) => setBudget(e.target.value)}>
              {[
                "To be discussed",
                "Budget allocated",
                "Scope under review",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Project timing
            <select value={timing} onChange={(e) => setTiming(e.target.value)}>
              {["This quarter", "Next quarter", "Exploring only"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="demo-run" type="submit">
          Capture sample enquiry
        </button>
      </form>
      <div className="demo-filters">
        <label>
          Lead pipeline filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["All", "Discovery ready", "Nurture", "Reviewed"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="demo-records">
        {leads
          .filter((l) => filter === "All" || l.stage === filter)
          .map((l) => (
            <article key={l.id}>
              <h4>
                Sample lead {l.id} · {l.business}
              </h4>
              <p>
                {l.stage} · {l.budget} · {l.timing}
              </p>
              <button
                onClick={() => {
                  setLeads((ls) =>
                    ls.map((x) =>
                      x.id === l.id ? { ...x, stage: "Reviewed" } : x,
                    ),
                  );
                  setNotice(`Sample lead ${l.id} reviewed locally.`);
                }}
              >
                Review sample lead {l.id}
              </button>
              <button
                onClick={() =>
                  setNotice(
                    `Follow-up preview for sample lead ${l.id}: thank you for your interest. May we discuss your goals and scope? No response or message was sent.`,
                  )
                }
              >
                Preview follow-up for lead {l.id}
              </button>
            </article>
          ))}
      </div>
      {!leads.filter((l) => filter === "All" || l.stage === filter).length && (
        <p className="demo-empty">
          No sample leads in this view. Capture an enquiry or change the filter.
        </p>
      )}
      <p role="status">{notice}</p>
    </div>
  );
}
