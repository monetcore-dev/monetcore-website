"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

const destinations = [
  { label: "Explore our services", href: "/services" },
  { label: "Read about our products", href: "/products" },
  { label: "Explore website packages", href: "/website-packages" },
  { label: "Book a consultation", href: "/book" },
];

export default function CorporateFAQ({
  items,
}: {
  items: readonly (readonly string[])[];
}) {
  const [open, setOpen] = useState<number[]>([]);
  return (
    <div className="corporate-faq-list">
      {items.map(([question, answer], index) => {
        const expanded = open.includes(index);
        const destination = destinations[index];
        return (
          <div
            key={question}
            className={`corporate-faq-card ${expanded ? "is-open" : ""}`}
          >
            <h3>
              <button
                type="button"
                id={`faq-trigger-${index}`}
                aria-expanded={expanded}
                aria-controls={`faq-answer-${index}`}
                onClick={() =>
                  setOpen((current) =>
                    expanded
                      ? current.filter((item) => item !== index)
                      : [...current, index],
                  )
                }
              >
                <span>{question}</span>
                <span className="faq-indicator">
                  <Plus size={19} aria-hidden="true" />
                </span>
              </button>
            </h3>
            <div
              id={`faq-answer-${index}`}
              role="region"
              aria-labelledby={`faq-trigger-${index}`}
              aria-hidden={!expanded}
              inert={!expanded}
              className="corporate-faq-answer"
            >
              <div>
                <p>{answer}</p>
                {destination && (
                  <Link href={destination.href}>
                    {destination.label}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
