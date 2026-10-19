"use client";

import { FormEvent, useId, useState } from "react";

import {
  getWebsitePackage,
  packagePrice,
  websitePackages,
} from "./config/websitePackages";

import { useProjectPlan } from "./components/ProjectPlanContext";
import { enquiryBudgets } from "./config/projectPlanner";

type ContactFormProps = { initialPackageId?: string; quotationMode?: boolean };

export default function ContactForm({
  initialPackageId,
  quotationMode = false,
}: ContactFormProps) {
  const planner = useProjectPlan();
  const incomingPlan = quotationMode ? null : planner?.draft;
  const planId = incomingPlan?.id ?? 0;
  const messageCounterId = useId();
  const defaultService = quotationMode ? "Business Website" : "";
  const [editedFields, setEditedFields] = useState({
    planId: 0,
    service: defaultService,
    budget: "",
    message: "",
  });
  // A new draft replaces only the planner fields; uncontrolled contact details keep their DOM state.
  const fields =
    editedFields.planId === planId
      ? editedFields
      : {
          planId,
          service: incomingPlan?.service ?? defaultService,
          budget: incomingPlan?.budget ?? "",
          message: incomingPlan?.message ?? "",
        };
  function editField(field: "service" | "budget" | "message", value: string) {
    setEditedFields({ ...fields, [field]: value });
  }
  const [selectedPackageId, setSelectedPackageId] = useState(
    initialPackageId ?? "",
  );
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");

  const [feedback, setFeedback] = useState("");
  const [feedbackForPlan, setFeedbackForPlan] = useState(0);
  const [startedAt] = useState(() => Date.now());

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackForPlan(planId);

    if (!fields.message.trim()) {
      setStatus("error");
      setFeedback("Please add meaningful project details before submitting.");
      return;
    }
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
      packageId: quotationMode ? formData.get("packageId") : undefined,
      consent: quotationMode ? formData.get("consent") === "on" : undefined,
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

      if (!response.ok || result.success !== true) {
        throw new Error(result.error || "Unable to send enquiry.");
      }

      setStatus("success");
      setFeedback(
        "Thank you. Your project enquiry has been sent to Monetcore.",
      );

      form.reset();
      setEditedFields({
        planId,
        service: defaultService,
        budget: "",
        message: "",
      });
      if (quotationMode) setSelectedPackageId(initialPackageId ?? "");
    } catch (error) {
      console.error("Contact form error:", error);

      setStatus("error");
      setFeedback(
        `We couldn't send your enquiry. ${error instanceof Error ? error.message : "Please try again."} You can email hello@monetcore.dev.`,
      );
    }
  }

  const inputStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={status === "sending"}
      aria-label={
        quotationMode ? "Website quotation enquiry" : "Project enquiry"
      }
      className="mt-12 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      {incomingPlan && fields.message && (
        <p className="enquiry-plan-notice" role="status">
          Your planner outline is ready to review. You can edit these details
          before sending; nothing has been submitted.
        </p>
      )}
      {/* Spam honeypot — hidden from real visitors */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Records when the visitor opened the form */}
      <input type="hidden" name="startedAt" value={startedAt} />

      {quotationMode && (
        <div>
          <label className="text-sm font-semibold text-slate-900">
            Website package <span className="text-red-500">*</span>
            <select
              required
              name="packageId"
              value={selectedPackageId}
              onChange={(event) => setSelectedPackageId(event.target.value)}
              className={inputStyle}
            >
              <option value="">Select a package</option>
              {websitePackages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {packagePrice(item)} (proposed)
                </option>
              ))}
            </select>
          </label>
          <p aria-live="polite" className="mt-3 text-sm text-slate-600">
            {getWebsitePackage(selectedPackageId)
              ? `${getWebsitePackage(selectedPackageId)?.name} selected. Final price and scope require business approval.`
              : "Choose the package you would like us to quote."}
          </p>
        </div>
      )}

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
            value={fields.service}
            onChange={(event) => editField("service", event.target.value)}
            className={inputStyle}
          >
            <option value="">Select a service</option>

            <option value="Business Website">Business Website</option>

            <option value="Software Development">Software Development</option>

            <option value="AI Solution">AI Solution</option>

            <option value="Business Automation">Business Automation</option>

            <option value="Digital Product">Digital Product</option>

            <option value="Other">Other</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-900 md:col-span-2">
          Estimated budget
          <select
            name="budget"
            value={fields.budget}
            onChange={(event) => editField("budget", event.target.value)}
            className={inputStyle}
          >
            <option value="">Select a budget range</option>

            {enquiryBudgets.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-sm font-semibold text-slate-900">
        Tell us about your project <span className="text-red-500">*</span>
        <textarea
          required
          name="message"
          value={fields.message}
          onChange={(event) => editField("message", event.target.value)}
          aria-describedby={messageCounterId}
          rows={6}
          maxLength={5000}
          placeholder="What are you trying to build, improve, or automate?"
          className={inputStyle}
        />
      </label>

      <p id={messageCounterId} className="enquiry-character-count">
        {fields.message.length.toLocaleString("en-NG")} / 5,000 characters
      </p>

      {quotationMode && (
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            required
            name="consent"
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0"
          />
          I agree that Monetcore may use the details I submit to respond to this
          quotation request. This does not confirm a purchase or subscription.
        </label>
      )}

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
            : quotationMode
              ? "Send Quotation Request"
              : "Send Project Enquiry"}
        </button>
      </div>

      {feedback && feedbackForPlan === planId && (
        <p
          role={status === "error" ? "alert" : "status"}
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
