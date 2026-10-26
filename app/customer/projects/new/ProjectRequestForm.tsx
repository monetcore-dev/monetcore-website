"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  customerBudgets,
  projectCategories,
  projectTimelines,
} from "../../../config/customerOptions";
export default function ProjectRequestForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const key = useRef<string>("");
  const [pending, setPending] = useState(false),
    [feedback, setFeedback] = useState(""),
    [success, setSuccess] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || success) return;
    setPending(true);
    setFeedback("");
    key.current ||= crypto.randomUUID();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(
        `/api/customer/organizations/${organizationId}/requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, idempotencyKey: key.current }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const result = await response.json();
      if (!response.ok || result.success !== true || !result.request?.id)
        throw new Error(result.error || "Your request could not be confirmed.");
      setSuccess(true);
      setFeedback(
        `Your request has been recorded. Reference: ${result.request.id}. Our team will review the requirements; pricing, delivery dates and commitments require a separate agreement.`,
      );
    } catch (error) {
      setFeedback(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "Submission status is uncertain. Check your request history before retrying. A retry from this form uses the same reference to prevent duplicates.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="customer-card">
      <h1>New project request</h1>
      <p>
        Tell us about the problem you want to solve. Our team will review your
        requirements and contact you to discuss the next steps.
      </p>
      <form onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending || success}>
          <legend>Project details</legend>
          <div className="customer-grid">
            <label>
              Project title
              <input
                name="title"
                minLength={3}
                maxLength={160}
                required
                autoComplete="off"
              />
            </label>
            <label>
              Project category
              <select name="category" required>
                {projectCategories.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
        <label>
          Business objectives
          <textarea
            name="objectives"
            minLength={20}
            maxLength={2000}
            required
            disabled={pending || success}
          />
        </label>
        <label>
          Requirements
          <textarea
            name="requirements"
            minLength={20}
            maxLength={5000}
            required
            disabled={pending || success}
          />
        </label>
        <div className="customer-grid">
          <label>
            Estimated budget range
            <select name="budget" disabled={pending || success}>
              {customerBudgets.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            Preferred timeline
            <select name="timeline" disabled={pending || success}>
              {projectTimelines.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Additional notes{" "}
          <small>
            Optional; do not include passwords, payment details or confidential
            customer records.
          </small>
          <textarea
            name="notes"
            maxLength={2000}
            disabled={pending || success}
          />
        </label>
        <p>
          Your budget is an estimate, not a package price or quotation. Your
          requested timeline is not a delivery commitment. Read our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        <button className="customer-button" disabled={pending || success}>
          {pending
            ? "Submitting…"
            : success
              ? "Request recorded"
              : "Submit project request"}
        </button>
      </form>
      {feedback && (
        <p
          role={success ? "status" : "alert"}
          className={`customer-feedback ${success ? "" : "customer-error"}`}
        >
          {feedback}
        </p>
      )}
      <div className="customer-actions">
        <Link href={`/customer?organization=${organizationId}`}>
          View request history
        </Link>
        <Link href="/contact">Contact Monetcore</Link>
      </div>
    </section>
  );
}
