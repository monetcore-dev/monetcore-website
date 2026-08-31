import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const leadFeatures = [
  "Capture new enquiries",
  "Qualify and score leads",
  "Prioritize high-value prospects",
  "Generate AI-assisted follow-up",
  "Track communication history",
  "Schedule reminders and next actions",
];

const bookingFeatures = [
  "Real-time appointment availability",
  "Automatic double-booking protection",
  "Customer confirmation emails",
  "Business booking notifications",
  "Automatic Google Calendar scheduling",
  "Secure booking records and timezone handling",
];

const outcomes = [
  {
    title: "Faster follow-up",
    text: "Reduce the time between a new enquiry and the next meaningful sales action.",
  },
  {
    title: "Better prioritization",
    text: "Use lead scoring and pipeline stages to focus attention where it matters most.",
  },
  {
    title: "More booked conversations",
    text: "Give qualified prospects a simple path from interest to a confirmed consultation.",
  },
  {
    title: "More consistent sales operations",
    text: "Turn repeatable sales tasks into structured workflows your team can actually follow.",
  },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-20 pt-36 lg:px-8 lg:pt-44">
        <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-blue-100/70 via-cyan-50/40 to-transparent" />
        <div className="absolute -left-20 top-36 -z-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute right-0 top-28 -z-10 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Monetcore Products
            </div>

            <h1 className="mt-7 text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Practical software built from
              <span className="block bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                real business problems.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              Monetcore is building focused AI-powered products that help
              businesses capture opportunities, automate repetitive sales
              processes, schedule customer conversations, and operate more
              efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* PRODUCT 001 */}
      <section
        id="ai-lead-automation"
        className="scroll-mt-32 border-t border-blue-100 bg-white px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Product 001
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live Demo
                </span>
              </div>

              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Monetcore AI Lead Automation
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                An intelligent lead-management workflow that helps businesses
                capture enquiries, qualify prospects, prioritize follow-ups,
                generate AI-assisted communication, and keep sales activity
                organized from one workspace.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {leadFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      ✓
                    </span>

                    <span className="font-medium text-slate-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="https://monetcore-lead-demo.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Open Live Demo
                </a>

                <Link
                  href="/contact#consultation"
                  className="rounded-xl border border-blue-200 bg-white px-6 py-3.5 font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Build Something Similar
                </Link>
              </div>
            </div>

            {/* LEAD DASHBOARD MOCKUP */}
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-blue-200/60 to-cyan-200/40 blur-2xl" />

              <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    Monetcore AI Lead Automation
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                      Sales Pipeline
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      Intelligent lead follow-up
                    </p>

                    <p className="mt-2 text-sm text-blue-50">
                      Capture, qualify, prioritize and communicate from one
                      workspace.
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      ["Total Leads", "24"],
                      ["Hot Leads", "8"],
                      ["Due Today", "5"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                          Today&apos;s Action Queue
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          Follow-ups needing attention
                        </p>
                      </div>

                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                        3 overdue
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        "Priority property enquiry",
                        "New corporate lead",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-xl border border-white bg-white px-4 py-3 shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {item}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              AI follow-up ready
                            </p>
                          </div>

                          <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                            Open
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT 002 */}
      <section
        id="smart-booking"
        className="scroll-mt-32 border-t border-blue-100 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            {/* BOOKING MOCKUP */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-cyan-200/50 to-blue-200/50 blur-2xl" />

              <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl shadow-blue-950/10">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                        Consultation Booking
                      </p>
                      <p className="mt-1 font-bold text-slate-950">
                        Select an available time
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Live
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="rounded-2xl bg-blue-50 p-5">
                    <p className="text-sm font-semibold text-slate-900">
                      Tuesday, 1 September
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      West Africa Time
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {["09:00", "10:00", "11:00"].map((slot) => (
                        <div
                          key={slot}
                          className={`rounded-xl border px-3 py-3 text-center text-sm font-semibold ${
                            slot === "10:00"
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-blue-100 bg-white text-slate-700"
                          }`}
                        >
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      ["Availability checked", "Real time"],
                      ["Calendar sync", "Google Calendar"],
                      ["Confirmation", "Automatic email"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm text-slate-600">
                          {label}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    ✓ Consultation confirmed and added to calendar
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                  Product 002
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live Demo
                </span>
              </div>

              <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Monetcore Smart Booking
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                A streamlined appointment and consultation scheduling system
                that lets customers choose available times while automatically
                handling booking protection, confirmations, business
                notifications and calendar scheduling.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {bookingFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      ✓
                    </span>

                    <span className="font-medium text-slate-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/book"
                  className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Try Booking Demo
                </Link>

                <Link
                  href="/contact#consultation"
                  className="rounded-xl border border-blue-200 bg-white px-6 py-3.5 font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Build a Booking System
                </Link>
              </div>

              <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
                The live demo uses Monetcore&apos;s own consultation workflow,
                showing the same type of scheduling automation that can be
                adapted for service businesses and customer-facing teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECTED WORKFLOW */}
      <section className="border-t border-blue-100 bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Connected Customer Journey
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              From new enquiry to booked conversation.
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Monetcore&apos;s automation products can work independently or
              form part of a connected sales workflow that moves opportunities
              from initial interest toward real customer conversations.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-5">
            {[
              ["01", "Capture", "Receive the enquiry"],
              ["02", "Qualify", "Score the opportunity"],
              ["03", "Follow Up", "Generate the next action"],
              ["04", "Schedule", "Book the conversation"],
              ["05", "Convert", "Move the opportunity forward"],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-3xl border border-blue-100 bg-slate-50 p-6"
              >
                <span className="text-sm font-bold text-blue-600">
                  {number}
                </span>

                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUSINESS VALUE */}
      <section className="border-t border-blue-100 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Business Value
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Built to improve customer acquisition, not add another layer of
              complexity.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {outcomes.map((outcome) => (
              <div
                key={outcome.title}
                className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 font-bold text-blue-700">
                  ✓
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-950">
                  {outcome.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {outcome.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-blue-100 bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200/60 sm:p-10 lg:p-14">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
                  Need Your Own System?
                </p>

                <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  We can build automation around your own business workflow.
                </h2>

                <p className="mt-5 text-lg leading-8 text-blue-50">
                  Lead management, AI follow-up, appointment scheduling and
                  business integrations can be adapted around the way your
                  organization actually works.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href="/book"
                  className="inline-flex rounded-xl bg-white px-6 py-3.5 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
                >
                  Book a Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}