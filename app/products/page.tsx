import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const features = [
  "Capture new enquiries",
  "Qualify and score leads",
  "Prioritize high-value prospects",
  "Generate AI-assisted follow-up",
  "Track communication history",
  "Schedule reminders and next actions",
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
    title: "Clear communication history",
    text: "Keep follow-ups and sales activity visible instead of scattered across tools.",
  },
  {
    title: "More consistent sales operations",
    text: "Turn repeatable sales tasks into a structured workflow your team can actually follow.",
  },
];

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />

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
              Monetcore is building a portfolio of focused AI-powered products
              designed to improve repeatable business workflows, starting with
              intelligent lead management and sales follow-up.
            </p>
          </div>
        </div>
      </section>

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
                {features.map((feature) => (
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
                      Capture, qualify, prioritize and communicate from one workspace.
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

      <section className="border-t border-blue-100 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Business Value
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Built to improve the sales workflow, not add another layer of complexity.
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
                  The same approach can be adapted for enquiries, customer
                  operations, internal workflows, service delivery, and other
                  repeatable processes.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  href="/contact#consultation"
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