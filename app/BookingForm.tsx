"use client";

import { FormEvent, useMemo, useState } from "react";

type Status = "idle" | "sending" | "success" | "error";
type AvailabilityStatus = "idle" | "loading" | "ready" | "error";

const timeSlots = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
];

export default function BookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [availabilityStatus, setAvailabilityStatus] =
    useState<AvailabilityStatus>("idle");
  const [availabilityMessage, setAvailabilityMessage] = useState("");

  const [startedAt] = useState(() => Date.now());

  const today = useMemo(() => {
    const date = new Date();

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }, []);

  async function checkAvailability(date: string) {
    if (!date) {
      setBookedTimes([]);
      setAvailabilityStatus("idle");
      setAvailabilityMessage("");
      return;
    }

    setAvailabilityStatus("loading");
    setAvailabilityMessage("");
    setBookedTimes([]);

    try {
      const response = await fetch(
        `/api/book/availability?date=${encodeURIComponent(date)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to check availability."
        );
      }

      const unavailable = Array.isArray(result.bookedTimes)
        ? result.bookedTimes.map((time: unknown) =>
            String(time).slice(0, 5)
          )
        : [];

      setBookedTimes(unavailable);
      setAvailabilityStatus("ready");

      if (unavailable.length === timeSlots.length) {
        setAvailabilityMessage(
          "All consultation times are booked for this date. Please choose another date."
        );
      }
    } catch (error) {
      console.error("Availability error:", error);

      setBookedTimes([]);
      setAvailabilityStatus("error");
      setAvailabilityMessage(
        error instanceof Error
          ? error.message
          : "Unable to check availability."
      );
    }
  }

  async function handleDateChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const date = event.target.value;

    setSelectedDate(date);
    setSelectedTime("");
    setStatus("idle");
    setFeedback("");

    await checkAvailability(date);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedDate || !selectedTime) {
      setStatus("error");
      setFeedback("Please choose a consultation date and time.");
      return;
    }

    if (bookedTimes.includes(selectedTime)) {
      setStatus("error");
      setFeedback(
        "That consultation time is no longer available. Please choose another time."
      );
      setSelectedTime("");

      await checkAvailability(selectedDate);
      return;
    }

    setStatus("sending");
    setFeedback("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const data = {
      consultationType: formData.get("consultationType"),
      date: selectedDate,
      time: selectedTime,
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      company: formData.get("company"),
      service: formData.get("service"),
      message: formData.get("message"),
      website: formData.get("website"),
      startedAt: formData.get("startedAt"),
    };

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setSelectedTime("");
          await checkAvailability(selectedDate);
        }

        throw new Error(
          result.error || "Unable to book consultation."
        );
      }

      setStatus("success");
      setFeedback(
        `Your consultation has been booked for ${selectedDate} at ${selectedTime} WAT.`
      );

      form.reset();

      setSelectedDate("");
      setSelectedTime("");
      setBookedTimes([]);
      setAvailabilityStatus("idle");
      setAvailabilityMessage("");
    } catch (error) {
      console.error("Booking form error:", error);

      setStatus("error");

      setFeedback(
        error instanceof Error
          ? error.message
          : "We couldn't complete your booking. Please email hello@monetcore.dev."
      );
    }
  }

  const inputStyle =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
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

      <input
        type="hidden"
        name="startedAt"
        value={startedAt}
      />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Step 1
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Choose your consultation
        </h2>

        <label className="mt-6 block text-sm font-semibold text-slate-900">
          Consultation type{" "}
          <span className="text-red-500">*</span>

          <select
            required
            name="consultationType"
            defaultValue=""
            className={inputStyle}
          >
            <option value="">
              Select a consultation
            </option>

            <option value="Discovery Call - 30 minutes">
              Discovery Call — 30 minutes
            </option>

            <option value="Technical Consultation - 45 minutes">
              Technical Consultation — 45 minutes
            </option>

            <option value="Business Automation Consultation - 45 minutes">
              Business Automation Consultation — 45 minutes
            </option>
          </select>
        </label>
      </div>

      <div className="border-t border-slate-100 pt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Step 2
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Select a date and time
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          All consultation times are shown in West Africa Time
          (WAT). Consultations are available Monday to Friday.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <label className="text-sm font-semibold text-slate-900">
            Date <span className="text-red-500">*</span>

            <input
              required
              type="date"
              min={today}
              value={selectedDate}
              onChange={handleDateChange}
              className={inputStyle}
            />
          </label>

          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">
                Available time{" "}
                <span className="text-red-500">*</span>
              </p>

              {availabilityStatus === "loading" && (
                <p className="text-xs font-medium text-blue-600">
                  Checking availability...
                </p>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {timeSlots.map((time) => {
                const isBooked = bookedTimes.includes(time);
                const active = selectedTime === time;

                const disabled =
                  !selectedDate ||
                  availabilityStatus === "loading" ||
                  availabilityStatus === "error" ||
                  isBooked;

                return (
                  <button
                    key={time}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedTime(time);
                      setStatus("idle");
                      setFeedback("");
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      isBooked
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through"
                        : active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                    } disabled:opacity-60`}
                  >
                    <span className="block">{time}</span>

                    {isBooked && (
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide no-underline">
                        Unavailable
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {!selectedDate && (
              <p className="mt-3 text-xs text-slate-500">
                Choose a date to see current availability.
              </p>
            )}

            {availabilityStatus === "ready" &&
              selectedDate &&
              bookedTimes.length === 0 && (
                <p className="mt-3 text-xs font-medium text-green-700">
                  All listed times are currently available.
                </p>
              )}

            {availabilityMessage && (
              <p
                className={`mt-3 text-xs font-medium ${
                  availabilityStatus === "error"
                    ? "text-red-600"
                    : "text-amber-700"
                }`}
              >
                {availabilityMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Step 3
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Tell us about yourself
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-900">
            Your name <span className="text-red-500">*</span>

            <input
              required
              name="name"
              type="text"
              autoComplete="name"
              maxLength={100}
              placeholder="Your name"
              className={inputStyle}
            />
          </label>

          <label className="text-sm font-semibold text-slate-900">
            Business email{" "}
            <span className="text-red-500">*</span>

            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              maxLength={200}
              placeholder="you@company.com"
              className={inputStyle}
            />
          </label>

          <label className="text-sm font-semibold text-slate-900">
            Phone / WhatsApp

            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={50}
              placeholder="+234..."
              className={inputStyle}
            />
          </label>

          <label className="text-sm font-semibold text-slate-900">
            Company

            <input
              name="company"
              type="text"
              autoComplete="organization"
              maxLength={150}
              placeholder="Company name"
              className={inputStyle}
            />
          </label>

          <label className="text-sm font-semibold text-slate-900 md:col-span-2">
            Service you're interested in

            <select
              name="service"
              defaultValue=""
              className={inputStyle}
            >
              <option value="">
                Select a service
              </option>

              <option value="AI Automation">
                AI Automation
              </option>

              <option value="Custom Software">
                Custom Software
              </option>

              <option value="AI Sales Systems">
                AI Sales Systems
              </option>

              <option value="Business Integrations">
                Business Integrations
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </label>
        </div>

        <label className="mt-6 block text-sm font-semibold text-slate-900">
          What would you like to discuss?

          <textarea
            name="message"
            rows={5}
            maxLength={3000}
            placeholder="Tell us briefly about your project, problem, or automation opportunity."
            className={inputStyle}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Consultation timezone: WAT
          </p>

          <p className="mt-1 text-sm text-slate-500">
            You will receive a confirmation after booking.
          </p>
        </div>

        <button
          type="submit"
          disabled={
            status === "sending" ||
            availabilityStatus === "loading" ||
            !selectedDate ||
            !selectedTime
          }
          className="rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending"
            ? "Booking..."
            : "Confirm Consultation"}
        </button>
      </div>

      {feedback && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
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