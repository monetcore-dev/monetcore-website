"use client";
import { useState } from "react";
export default function MobileDemo() {
  const [screen, setScreen] = useState("Home");
  const [count, setCount] = useState(0);
  const [note, setNote] = useState("");
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">
          Unpublished fictional app walkthrough
        </span>
        <button
          onClick={() => {
            setScreen("Home");
            setCount(0);
            setNote("");
          }}
        >
          Reset app
        </button>
      </div>
      <div className="mobile-demo-layout">
        <div>
          <h3>A useful journey, one screen at a time.</h3>
          <p>
            Explore a service catalogue, sample request and activity screen.
            These mockups are not published apps. No payment, booking or account
            is created.
          </p>
          <ol className="demo-flow">
            {[
              "Discover an offering",
              "Build a request",
              "Review the next step",
            ].map((x, i) => (
              <li key={x}>
                <span>{i + 1}</span>
                <strong>{x}</strong>
              </li>
            ))}
          </ol>
        </div>
        <div className="demo-phone">
          <div className="demo-phone-top">Monetcore / sample app</div>
          <h4>{screen}</h4>
          {screen === "Home" ? (
            <>
              <p>Good day. What would you like to explore?</p>
              <button onClick={() => setScreen("Catalogue")}>
                Browse sample services
              </button>
              <button onClick={() => setScreen("Request")}>
                Explore an appointment request
              </button>
            </>
          ) : screen === "Catalogue" ? (
            <>
              {["Business advisory", "Design session", "Project review"].map(
                (x) => (
                  <div className="demo-phone-item" key={x}>
                    <strong>{x}</strong>
                    <button
                      onClick={() => {
                        setCount((n) => n + 1);
                        setNote(`${x} added to this local request.`);
                      }}
                    >
                      Add {x}
                    </button>
                  </div>
                ),
              )}
            </>
          ) : screen === "Request" ? (
            <>
              <p>
                {count} sample item{count === 1 ? "" : "s"} selected.
              </p>
              <p>
                Preferred appointment: a weekday morning. Actual availability is
                not checked.
              </p>
              <button
                className="demo-run"
                onClick={() => {
                  setNote(
                    "Local request preview complete. No appointment was created.",
                  );
                  setScreen("Activity");
                }}
              >
                Preview request
              </button>
            </>
          ) : (
            <>
              <p>Illustrative activity only.</p>
              <p>{note || "No local request previewed yet."}</p>
            </>
          )}
          <nav aria-label="Sample app screens">
            {["Home", "Catalogue", "Request", "Activity"].map((s) => (
              <button
                key={s}
                aria-pressed={screen === s}
                onClick={() => setScreen(s)}
              >
                {s}
              </button>
            ))}
          </nav>
          <p role="status">{screen !== "Activity" ? note : ""}</p>
        </div>
      </div>
    </div>
  );
}
