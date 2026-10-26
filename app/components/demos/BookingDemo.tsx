"use client";
import { useState } from "react";
// Fixed fictional date keeps static HTML and browser hydration consistent.
function demoDay() {
  return "2030-01-07";
}
const slots = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"];
type Reservation = {
  id: number;
  date: string;
  time: string;
  cancelled: boolean;
  calendar: boolean;
};
export default function BookingDemo() {
  const [date, setDate] = useState(demoDay);
  const [time, setTime] = useState("");
  const [records, setRecords] = useState<Reservation[]>(() => [
    {
      id: 1,
      date: demoDay(),
      time: "09:00",
      cancelled: false,
      calendar: false,
    },
  ]);
  const [notice, setNotice] = useState("");
  const weekend = [0, 6].includes(
    new Date(`${date}T12:00:00+01:00`).getUTCDay(),
  );
  const booked = records
    .filter((r) => r.date === date && !r.cancelled)
    .map((r) => r.time);
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">
          Isolated booking simulator · no real reservations
        </span>
        <button
          onClick={() => {
            setDate(demoDay());
            setTime("");
            setRecords([
              {
                id: 1,
                date: demoDay(),
                time: "09:00",
                cancelled: false,
                calendar: false,
              },
            ]);
            setNotice("");
          }}
        >
          Reset booking demo
        </button>
      </div>
      <p>
        Availability comes from this local sample list only, not a live booking database or
        Google Calendar. The demo illustrates slot conflicts and cancellation;
        it does not verify production concurrency.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!date || !time || weekend || booked.includes(time)) {
            setTime("");
            setNotice("Choose another available demo slot.");
            return;
          }
          setRecords((rs) => [
            ...rs,
            {
              id: (rs.at(-1)?.id || 0) + 1,
              date,
              time,
              cancelled: false,
              calendar: false,
            },
          ]);
          setNotice(
            `Sample reservation for ${date} at ${time} WAT stored locally. No real booking created.`,
          );
          setTime("");
        }}
      >
        <div className="demo-filters">
          <label>
            Demo appointment date
            <input
              type="date"
              value={date}
              required
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
                setNotice("");
              }}
            />
          </label>
          <label>
            Demo appointment time
            <select
              value={time}
              required
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="">Choose a demo slot</option>
              {slots.map((t) => (
                <option
                  key={t}
                  disabled={weekend || booked.includes(t)}
                  value={t}
                >
                  {t}
                  {booked.includes(t) ? " · Unavailable" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        {weekend && (
          <p>Sample appointments are weekdays only. Choose a weekday.</p>
        )}
        <button className="demo-run" type="submit">
          Reserve demo slot
        </button>
      </form>
      <h3>Fictional booking dashboard</h3>
      <div className="demo-records">
        {records.map((r) => (
          <article key={r.id}>
            <h4>Demo reservation {r.id}</h4>
            <p>
              {r.date} · {r.time} WAT
            </p>
            <p>
              {r.cancelled ? "Cancelled locally" : "Active sample reservation"}{" "}
              ·{" "}
              {r.calendar
                ? "Calendar step simulated"
                : "Calendar step not simulated"}
            </p>
            <button
              disabled={r.cancelled || r.calendar}
              onClick={() => {
                setRecords((rs) =>
                  rs.map((x) => (x.id === r.id ? { ...x, calendar: true } : x)),
                );
                setNotice(
                  "Calendar synchronization simulated locally. No event was created.",
                );
              }}
            >
              Simulate calendar step {r.id}
            </button>
            <button
              disabled={r.cancelled}
              onClick={() =>
                setNotice(
                  `Confirmation/reminder workflow preview for sample ${r.id}: prepare message → review timing and consent → send only in an approved integration. No email or reminder sent.`,
                )
              }
            >
              Preview notification {r.id}
            </button>
            <button
              disabled={r.cancelled}
              onClick={() => {
                setRecords((rs) =>
                  rs.map((x) =>
                    x.id === r.id ? { ...x, cancelled: true } : x,
                  ),
                );
                setNotice(
                  "Local reservation cancelled; its demo slot is available again. No external event was changed.",
                );
              }}
            >
              Cancel demo reservation {r.id}
            </button>
          </article>
        ))}
      </div>
      <p role="status">{notice}</p>
    </div>
  );
}
