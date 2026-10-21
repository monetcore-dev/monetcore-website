"use client";
import { useId, useState } from "react";
const initialRecords = [
  {
    id: 1,
    name: "Abuja Studio",
    stage: "New",
    sector: "Services",
    value: 179000,
    stock: 8,
  },
  {
    id: 2,
    name: "Lagos Market",
    stage: "Qualified",
    sector: "Retail",
    value: 299000,
    stock: 3,
  },
  {
    id: 3,
    name: "Kano Supply",
    stage: "Proposal",
    sector: "Distribution",
    value: 99000,
    stock: 18,
  },
  {
    id: 4,
    name: "Ibadan Learning",
    stage: "Won",
    sector: "Education",
    value: 179000,
    stock: 12,
  },
];
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
export default function WorkspaceDemo() {
  const [view, setView] = useState("CRM");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [records, setRecords] = useState(initialRecords);
  const [notice, setNotice] = useState("");
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const id = useId();
  const visible = records.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "All" || r.stage === filter),
  );
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <div>
          <span className="demo-badge">Fictional business workspace</span>
          <h3>Connected operations, in miniature.</h3>
        </div>
        <button
          onClick={() => {
            setRecords(initialRecords);
            setSearch("");
            setFilter("All");
            setNotice("Demo workspace reset.");
            setCompletedTasks([]);
          }}
        >
          Reset workspace
        </button>
      </div>
      <div className="demo-switches" aria-label="Workspace views">
        {["CRM", "Inventory", "Sales analytics", "Operations"].map((v) => (
          <button
            key={v}
            aria-pressed={view === v}
            onClick={() => {
              setView(v);
              setNotice("");
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <p>
        Synthetic records, sample values and local state only. No real
        customers, stock changes, accounting entries or live performance.
      </p>
      <div className="demo-stats">
        <div>
          <span>Sample opportunities</span>
          <strong>{records.length}</strong>
        </div>
        <div>
          <span>Illustrative pipeline</span>
          <strong>{naira(records.reduce((sum, r) => sum + r.value, 0))}</strong>
        </div>
        <div>
          <span>Won in this demo</span>
          <strong>{records.filter((r) => r.stage === "Won").length}</strong>
        </div>
      </div>
      <div className="demo-filters">
        <label htmlFor={id}>
          Search sample businesses
          <input
            id={id}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try Lagos"
          />
        </label>
        <label>
          Pipeline filter
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["All", "New", "Qualified", "Proposal", "Won"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="demo-records">
        {visible.map((r) => (
          <article key={r.id}>
            <div>
              <h4>{r.name}</h4>
              <p>
                {r.sector} · {r.stage}
              </p>
            </div>
            {view === "Inventory" ? (
              <>
                <p>
                  Sample units: <strong>{r.stock}</strong>
                  {r.stock < 5 && " · Low stock"}
                </p>
                <button
                  onClick={() => {
                    setRecords((rs) =>
                      rs.map((x) =>
                        x.id === r.id ? { ...x, stock: x.stock + 5 } : x,
                      ),
                    );
                    setNotice(`Added 5 fictional units for ${r.name}.`);
                  }}
                >
                  Add 5 demo units
                </button>
              </>
            ) : view === "Sales analytics" ? (
              <>
                <p>Sample value: {naira(r.value)}</p>
                <label className="demo-meter">
                  Relative sample value
                  <meter min={0} max={300000} value={r.value}>
                    {r.value}
                  </meter>
                </label>
              </>
            ) : view === "Operations" ? (
              <>
                <p>
                  Next task:{" "}
                  {completedTasks.includes(r.id)
                    ? "Completed locally"
                    : r.stage === "Won"
                      ? "Prepare onboarding"
                      : "Review requirements"}
                </p>
                <button
                  disabled={completedTasks.includes(r.id)}
                  onClick={() => {
                    setCompletedTasks((ids) => [...ids, r.id]);
                    setNotice(
                      `Fictional review task for ${r.name} marked complete. No notification sent.`,
                    );
                  }}
                >
                  Complete sample task
                </button>
              </>
            ) : (
              <>
                <p>Opportunity: {naira(r.value)}</p>
                <label>
                  Stage for {r.name}
                  <select
                    value={r.stage}
                    onChange={(e) => {
                      setRecords((rs) =>
                        rs.map((x) =>
                          x.id === r.id ? { ...x, stage: e.target.value } : x,
                        ),
                      );
                      setNotice("Sample pipeline updated locally.");
                    }}
                  >
                    {["New", "Qualified", "Proposal", "Won"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </article>
        ))}
      </div>
      {!visible.length && (
        <p role="status" className="demo-empty">
          No sample records match. Clear the search or choose All.
        </p>
      )}
      <p role="status">{notice}</p>
    </div>
  );
}
