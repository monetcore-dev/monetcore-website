"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const [feedback, setFeedback] = useState("");
  const [startedAt] = useState(() => Date.now());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("sending");
    setFeedback("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      company: formData.get("company"),
      service: formData.get("service"),
      budget: formData.get("budget"),
      message: formData.get("message"),
      website: formData.get("website"),
      startedAt: formData.get("startedAt"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to send enquiry.");
      }

      setStatus("success");
      setFeedback(
        "Thank you. Your project enquiry has been sent to Monetcore."
      );

      form.reset();
    } catch (error) {
      console.error("Contact form error:", error);

      setStatus("error");
      setFeedback(
        "We couldn't send your enquiry. Please email hello@monetcore.dev."
      );
    }
  }

  const inputStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-12 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      {/* Spam honeypot — hidden from real visitors */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {/* Records when the visitor opened the form */}
      <input
        type="hidden"
        name="startedAt"
        value={startedAt}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-900">
          Your name <span className="text-red-500">*</span>
          <input
            required
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            maxLength={100}
            className={inputStyle}
          />
        </label>

        <label className="text-sm font-semibold text-slate-900">
          Business email <span className="text-red-500">*</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            maxLength={200}
            className={inputStyle}
          />
        </label>

        <label className="text-sm font-semibold text-slate-900">
          Company
          <input
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Company name"
            maxLength={150}
            className={inputStyle}
          />
        </label>

        <label className="text-sm font-semibold text-slate-900">
          What do you need?
          <select
            name="service"
            defaultValue=""
            className={inputStyle}
          >
            <option value="">
              Select a service
            </option>

            <option value="Software Development">
              Software Development
            </option>

            <option value="AI Solution">
              AI Solution
            </option>

            <option value="Business Automation">
              Business Automation
            </option>

            <option value="Digital Product">
              Digital Product
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-900 md:col-span-2">
          Estimated budget
          <select
            name="budget"
            defaultValue=""
            className={inputStyle}
          >
            <option value="">
              Select a budget range
            </option>

            <option value="Under $500">
              Under $500
            </option>

            <option value="$500 - $1,000">
              $500 – $1,000
            </option>

            <option value="$1,000 - $2,500">
              $1,000 – $2,500
            </option>

            <option value="$2,500 - $5,000">
              $2,500 – $5,000
            </option>

            <option value="$5,000+">
              $5,000+
            </option>

            <option value="Not sure">
              Not sure yet
            </option>
          </select>
        </label>
      </div>

      <label className="text-sm font-semibold text-slate-900">
        Tell us about your project <span className="text-red-500">*</span>
        <textarea
          required
          name="message"
          rows={6}
          maxLength={5000}
          placeholder="What are you trying to build, improve, or automate?"
          className={inputStyle}
        />
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Or email us directly at{" "}
          <a
            href="mailto:hello@monetcore.dev"
            className="font-semibold text-blue-600 transition hover:text-blue-700"
          >
            hello@monetcore.dev
          </a>
        </p>

        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending"
            ? "Sending..."
            : "Send Project Enquiry"}
        </button>
      </div>

      {feedback && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            status === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}