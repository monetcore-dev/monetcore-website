import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const services = [
  {
    id: "ai-automation",
    number: "01",
    title: "AI Automation",
    description:
      "We design practical AI-powered workflows that reduce repetitive work, improve response times, and help teams operate more efficiently.",
    points: [
      "Workflow automation",
      "AI-assisted customer operations",
      "Lead qualification systems",
      "Internal process automation",
      "AI-powered business tools",
      "Task and communication automation",
    ],
  },
  {
    id: "custom-software",
    number: "02",
    title: "Custom Software",
    description:
      "We build software around the way your business actually works — from internal tools and portals to full web applications and scalable platforms.",
    points: [
      "Web applications",
      "Business portals",
      "SaaS products",
      "Internal tools",
      "Customer dashboards",
      "Custom workflow systems",
    ],
  },
  {
    id: "ai-sales-systems",
    number: "03",
    title: "AI Sales Systems",
    description:
      "We create intelligent sales workflows that help businesses capture opportunities, qualify prospects, prioritize follow-ups, and improve conversion.",
    points: [
      "Lead capture",
      "Lead scoring",
      "AI-assisted follow-up",
      "Pipeline automation",
      "Sales reminders",
      "Communication tracking",
    ],
  },
  {
    id: "business-integrations",
    number: "04",
    title: "Business Integrations",
    description:
      "We connect software, email, databases, APIs, and internal systems so information flows smoothly across your business.",
    points: [
      "API integrations",
      "Email integrations",
      "Database connections",
      "Third-party software integration",
      "Data synchronization",
      "Workflow orchestration",
    ],
  },
];

export default function ServicesPage() {
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
              Monetcore Services
            </div>

            <h1 className="mt-7 text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Technology services built around
              <span className="block bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                real business outcomes.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              Monetcore combines software engineering, artificial intelligence,
              automation, and systems integration to help businesses improve
              operations, sales, customer experience, and growth.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/contact#consultation"
                className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Start a Project
              </Link>

              <Link
                href="/products"
                className="rounded-xl border border-blue-200 bg-white px-6 py-3.5 font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
              >
                Explore Our Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              What We Build
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Four core service areas.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Each engagement is designed around practical business needs rather
              than technology for its own sake.
            </p>
          </div>

          <div className="mt-14 space-y-8">
            {services.map((service) => (
              <article
                key={service.id}
                id={service.id}
                className="scroll-mt-32 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50"
              >
                <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
                  <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white sm:p-10">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                      Service {service.number}
                    </p>

                    <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                      {service.title}
                    </h2>

                    <p className="mt-5 leading-7 text-blue-50">
                      {service.description}
                    </p>
                  </div>

                  <div className="p-8 sm:p-10">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {service.points.map((point) => (
                        <div
                          key={point}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            ✓
                          </span>
                          <span className="font-medium text-slate-700">
                            {point}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <Link
                        href="/contact#consultation"
                        className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                      >
                        Discuss This Service →
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200/60 sm:p-10 lg:p-14">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
                  Build With Monetcore
                </p>

                <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  Have a workflow, product, or business process you want to improve?
                </h2>

                <p className="mt-5 text-lg leading-8 text-blue-50">
                  Tell us what you are trying to achieve. We can help determine
                  whether software, automation, AI, integration, or a combination
                  of these is the right approach.
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