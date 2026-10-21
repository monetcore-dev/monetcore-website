"use client";
import Link from "next/link";
import { useState } from "react";
const examples = {
  "Professional practice": {
    brand: "STUDIO / WEBSITE",
    title: "A clear place to explain your expertise.",
    services: ["Advisory", "Design", "Project delivery"],
  },
  "Retail business": {
    brand: "MARKET / WEBSITE",
    title: "Help customers discover what you offer.",
    services: ["Collections", "Product information", "Order enquiries"],
  },
  "Appointment business": {
    brand: "BOOKING / WEBSITE",
    title: "Make the next appointment easier to request.",
    services: ["Services", "Business hours", "Appointment requests"],
  },
};
export default function WebsiteDemo() {
  const [type, setType] = useState<keyof typeof examples>(
    "Professional practice",
  );
  const [section, setSection] = useState("Home");
  const [note, setNote] = useState("");
  const data = examples[type];
  return (
    <div className="experience">
      <div className="demo-toolbar">
        <span className="demo-badge">
          Illustrative website · fictional brands
        </span>
        <button
          onClick={() => {
            setType("Professional practice");
            setSection("Home");
            setNote("");
          }}
        >
          Reset website
        </button>
      </div>
      <div className="demo-switches">
        {Object.keys(examples).map((t) => (
          <button
            aria-pressed={type === t}
            key={t}
            onClick={() => {
              setType(t as keyof typeof examples);
              setSection("Home");
              setNote("");
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="sample-website">
        <div className="sample-website-bar">
          <strong>{data.brand}</strong>
          <nav aria-label="Sample website sections">
            {["Home", "Services", "Enquiry"].map((s) => (
              <button
                key={s}
                aria-pressed={section === s}
                onClick={() => {
                  setSection(s);
                  setNote("");
                }}
              >
                {s}
              </button>
            ))}
          </nav>
        </div>
        {section === "Home" ? (
          <div className="sample-website-hero">
            <p>Designed for a Nigerian business context</p>
            <h3>{data.title}</h3>
            <p>
              Build trust with clear information, mobile-friendly presentation
              and a direct enquiry pathway.
            </p>
            <button onClick={() => setSection("Services")}>
              Explore sample services
            </button>
          </div>
        ) : section === "Services" ? (
          <div className="demo-records">
            {data.services.map((s) => (
              <article key={s}>
                <h4>{s}</h4>
                <p>
                  Illustrative content, ready for a business’s approved details.
                </p>
                <button onClick={() => setSection("Enquiry")}>
                  Enquire about {s}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="sample-website-hero">
            <h3>Start a sample enquiry</h3>
            <p>This mockup does not collect or submit contact information.</p>
            <button
              onClick={() =>
                setNote(
                  "Demo enquiry previewed. Nothing was submitted or sent.",
                )
              }
            >
              Preview enquiry action
            </button>
            <p role="status">{note}</p>
          </div>
        )}
      </div>
      <div className="offering-actions">
        <Link className="offering-primary" href="/website-packages">
          Compare website packages
        </Link>
        <Link
          className="offering-secondary"
          href="/website-packages?package=starter#quotation"
        >
          Request a website quotation
        </Link>
      </div>
    </div>
  );
}
