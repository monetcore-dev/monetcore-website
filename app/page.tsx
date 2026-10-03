import ContactForm from "./ContactForm";
import HeroShowcase from "./components/HeroShowcase";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

const services = [
  {
    number: "01",
    title: "AI Automation",
    description:
      "Design and deploy practical AI workflows that reduce repetitive work, improve response times, and help teams operate more efficiently.",
    accent: "from-blue-600 to-cyan-500",
  },
  {
    number: "02",
    title: "Web, Mobile & Custom Software",
    description:
      "Build modern websites, mobile apps, web applications, customer portals, SaaS products, dashboards, internal tools, and custom business systems.",
    accent: "from-indigo-600 to-blue-500",
  },
  {
    number: "03",
    title: "AI Sales Systems",
    description:
      "Create intelligent lead capture, qualification, follow-up, communication, and pipeline workflows that help businesses convert more opportunities.",
    accent: "from-cyan-500 to-sky-500",
  },
  {
    number: "04",
    title: "Business Integrations",
    description:
      "Connect software, email, databases, APIs, and internal processes so information moves smoothly across your business.",
    accent: "from-violet-600 to-blue-500",
  },
];

const productSteps = [
  "Capture new enquiries",
  "Qualify and score leads",
  "Prioritize follow-ups",
  "Generate AI communication",
  "Send and track conversations",
  "Surface overdue actions",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pb-24 pt-36 lg:px-8 lg:pt-44">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-gradient-to-b from-blue-100/70 via-cyan-50/40 to-transparent" />

        <div className="absolute -left-20 top-36 -z-10 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />

        <div className="absolute right-0 top-28 -z-10 h-80 w-80 rounded-full bg-cyan-300/25 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT HERO */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Software • AI Automation • Web & Mobile • Intelligent Systems
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Build smarter.

              <span className="block bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Automate faster.
              </span>

              <span className="block text-slate-900">
                Grow further.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Monetcore System Solutions builds websites, mobile apps,
              web applications, SaaS products, customer dashboards,
              AI automation, and custom business software that help
              companies operate smarter and grow with confidence.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Start Your Project
              </a>

              <a
                href="#products"
                className="rounded-xl border border-blue-200 bg-white px-6 py-3.5 font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
              >
                Explore Our Solutions
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500">
              <span>✓ Websites & applications</span>
              <span>✓ Custom-built software</span>
              <span>✓ AI-powered automation</span>
            </div>
          </div>

          {/* ROTATING SHOWCASE */}
          <HeroShowcase />
        </div>

        {/* COMPANY SNAPSHOT */}
        <div className="mx-auto mt-20 grid max-w-7xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-3xl font-bold text-slate-950">
              2016
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Monetcore established
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-3xl font-bold text-blue-700">
              2026
            </p>

            <p className="mt-2 text-sm text-slate-500">
              AI & software growth chapter
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-3xl font-bold text-cyan-600">
              Global
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Technology built for modern businesses
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="border-t border-blue-100 bg-white px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              What Monetcore Does
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Technology built around business outcomes.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              We combine software engineering, web and mobile
              development, artificial intelligence, and automation
              to solve practical problems across sales, operations,
              customer experience, and internal workflows.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-8 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${service.accent}`}
                />

                <p className="text-sm font-semibold text-blue-600">
                  {service.number}
                </p>

                <h3 className="mt-7 text-2xl font-bold text-slate-950">
                  {service.title}
                </h3>

                <p className="mt-4 max-w-xl leading-7 text-slate-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="border-t border-blue-100 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Monetcore Products
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Software products built from real business problems.
              </h2>
            </div>

            <p className="max-w-md text-slate-600">
              We are building a portfolio of practical
              AI-powered tools and software products for
              repeatable workflows across growing businesses.
            </p>
          </div>

          {/* PRODUCT 001 */}
          <div className="mt-14 overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/60">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="p-8 sm:p-10 lg:p-12">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
                    Product 001
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Live Demo
                  </span>
                </div>

                <h3 className="mt-6 text-3xl font-bold text-slate-950 sm:text-4xl">
                  Monetcore AI Lead Automation
                </h3>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                  An intelligent lead-management workflow that
                  helps businesses capture enquiries, qualify
                  prospects, prioritize follow-ups, generate
                  AI-assisted communication, and track every
                  interaction.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {productSteps.map((step) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        ✓
                      </span>

                      {step}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="https://monetcore-lead-demo.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Request a Demo
                  </a>

                  <a
                    href="#services"
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Build Something Similar
                  </a>
                </div>
              </div>

              <div className="flex min-h-[420px] items-center bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 sm:p-10">
                <div className="w-full rounded-3xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
                    AI Sales Workspace
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["Lead scoring", "Automatic"],
                      ["Follow-ups", "AI assisted"],
                      ["Email history", "Tracked"],
                      ["Reminders", "Scheduled"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-white/15 bg-white/10 p-4"
                      >
                        <p className="text-xs text-blue-100">
                          {label}
                        </p>

                        <p className="mt-1 font-semibold">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-5 text-slate-900 shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
                      Next Best Action
                    </p>

                    <p className="mt-2 font-semibold">
                      Follow up with high-priority prospects
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      The system identifies overdue actions and
                      helps prepare personalized communication
                      for review.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="border-t border-blue-100 bg-white px-6 py-24 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              About Monetcore
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Experience behind us.

              <span className="block text-blue-600">
                A smarter future ahead.
              </span>
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-8 text-slate-600">
            <p>
              Monetcore System Solutions was established in 2016
              with a focus on delivering useful technology
              solutions to businesses.
            </p>

            <p>
              Today, Monetcore is entering a new chapter focused
              on modern website and application development,
              custom software, artificial intelligence,
              automation, and scalable digital products.
            </p>

            <p>
              Our goal is simple: build technology that solves
              real problems, improves how businesses operate,
              and creates measurable long-term value.
            </p>

            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <p className="font-bold text-blue-700">
                  Practical
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Built around real workflows.
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-5">
                <p className="font-bold text-cyan-700">
                  Scalable
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Designed to grow with clients.
                </p>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="font-bold text-indigo-700">
                  Intelligent
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  AI where it creates value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="border-t border-blue-100 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 shadow-xl shadow-blue-200/60">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              <div className="p-8 text-white sm:p-10 lg:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
                  Start a Project
                </p>

                <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                  Have a business problem technology can solve?
                </h2>

                <p className="mt-5 text-lg leading-8 text-blue-50">
                  Tell us what you want to build or improve.
                  We can explore the right website, application,
                  software, AI, or automation approach with you.
                </p>

                <div className="mt-8 space-y-3 text-sm text-blue-50">
                  <p>✓ Website development</p>
                  <p>✓ Mobile & web applications</p>
                  <p>✓ SaaS & customer dashboards</p>
                  <p>✓ AI automation projects</p>
                  <p>✓ Custom software development</p>
                  <p>✓ Product and workflow consulting</p>
                </div>
              </div>

              <div className="bg-white p-8 sm:p-10 lg:p-12">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}