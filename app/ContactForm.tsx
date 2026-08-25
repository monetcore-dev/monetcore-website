"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const [feedback, setFeedback] = useState("");

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
      setFeedback("Thank you. Your project enquiry has been sent to Monetcore.");
      form.reset();
    } catch (error) {
      console.error(error);

      setStatus("error");
      setFeedback(
        "We couldn't send your enquiry. Please email hello@monetcore.dev."
      );
    }
  }

  const inputStyle =
    "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-12 grid gap-6 rounded-2xl border border-white/10 bg-black/20 p-6 sm:p-8"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-sm text-neutral-300">
          Your name *
          <input
            required
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className={inputStyle}
          />
        </label>

        <label className="text-sm text-neutral-300">
          Business email *
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={inputStyle}
          />
        </label>

        <label className="text-sm text-neutral-300">
          Company
          <input
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Company name"
            className={inputStyle}
          />
        </label>

        <label className="text-sm text-neutral-300">
          What do you need?
          <select
            name="service"
            defaultValue=""
            className={inputStyle}
          >
            <option value="" className="bg-neutral-950">
              Select a service
            </option>
            <option value="Software Development" className="bg-neutral-950">
              Software Development
            </option>
            <option value="AI Solution" className="bg-neutral-950">
              AI Solution
            </option>
            <option value="Business Automation" className="bg-neutral-950">
              Business Automation
            </option>
            <option value="Digital Product" className="bg-neutral-950">
              Digital Product
            </option>
            <option value="Other" className="bg-neutral-950">
              Other
            </option>
          </select>
        </label>

        <label className="text-sm text-neutral-300 md:col-span-2">
          Estimated budget
          <select
            name="budget"
            defaultValue=""
            className={inputStyle}
          >
            <option value="" className="bg-neutral-950">
              Select a budget range
            </option>
            <option value="Under $500" className="bg-neutral-950">
              Under $500
            </option>
            <option value="$500 - $1,000" className="bg-neutral-950">
              $500 – $1,000
            </option>
            <option value="$1,000 - $2,500" className="bg-neutral-950">
              $1,000 – $2,500
            </option>
            <option value="$2,500 - $5,000" className="bg-neutral-950">
              $2,500 – $5,000
            </option>
            <option value="$5,000+" className="bg-neutral-950">
              $5,000+
            </option>
            <option value="Not sure" className="bg-neutral-950">
              Not sure yet
            </option>
          </select>
        </label>
      </div>

      <label className="text-sm text-neutral-300">
        Tell us about your project *
        <textarea
          required
          name="message"
          rows={6}
          placeholder="What are you trying to build, improve, or automate?"
          className={inputStyle}
        />
      </label>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-500">
          Or email us directly at hello@monetcore.dev
        </p>

        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-lg bg-white px-6 py-3.5 font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Sending..." : "Send Project Enquiry"}
        </button>
      </div>

      {feedback && (
        <p
          className={`text-sm ${
            status === "success" ? "text-green-400" : "text-red-400"
          }`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}