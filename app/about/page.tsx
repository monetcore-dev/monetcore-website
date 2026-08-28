import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

const values = [
  {
    title: "Practical",
    text: "We focus on technology that solves real operational problems and improves measurable business outcomes.",
  },
  {
    title: "Scalable",
    text: "We design systems that can grow with the business instead of becoming another limitation.",
  },
  {
    title: "Intelligent",
    text: "We apply AI where it adds real value — not just because it is available.",
  },
  {
    title: "Reliable",
    text: "We aim for clear processes, thoughtful implementation, and solutions clients can depend on.",
  },
];

export default function AboutPage() {
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
              About Monetcore
            </div>

            <h1 className="mt-7 text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Experience behind us.
              <span className="block bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                A smarter future ahead.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              Monetcore System Solutions is building a new generation of
              software, AI automation, and intelligent business systems around
              one simple idea: technology should solve real problems and create
              lasting value.
            </p>
          </div>
        </div>
      </section>

      <section
        id="our-story"
        className="scroll-mt-32 border-t border-blue-100 bg-white px-6 py-24 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Our Story
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Established in 2016.
              <span className="block text-blue-600">
                Rebuilt for the AI era.
              </span>
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-8 text-slate-600">
            <p>
              Monetcore System Solutions was established in 2016 with a focus
              on delivering useful technology solutions to businesses.
            </p>

            <p>
              The company built experience around software, digital systems,
              client needs, and the practical challenges businesses face when
              adopting technology.
            </p>

            <p>
              Today, Monetcore is entering a new chapter focused on modern
              software development, artificial intelligence, automation,
              intelligent workflows, and scalable digital products.
            </p>

            <p>
              The direction is forward-looking, but the principle remains the
              same: build technology that is useful, practical, and aligned with
              real business goals.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[2rem] border border-blue-100 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                2016
              </p>

              <h3 className="mt-5 text-3xl font-bold text-slate-950">
                Monetcore established
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                A technology company created to deliver practical software and
                digital solutions for businesses.
              </p>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200/50 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                2026
              </p>

              <h3 className="mt-5 text-3xl font-bold">
                The next Monetcore chapter
              </h3>

              <p className="mt-4 leading-7 text-blue-50">
                A renewed focus on AI automation, modern software development,
                intelligent systems, business integrations, and scalable digital
                products.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              How We Think
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Technology is valuable when it improves how a business works.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Our approach starts with the business problem first. We then
              determine whether software, automation, AI, integration, or a
              combination of technologies is the right solution.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-8 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 font-bold text-blue-700">
                  ✓
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-950">
                  {value.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Our Direction
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Building useful systems for modern businesses.
              </h2>
            </div>

            <div className="space-y-5 text-lg leading-8 text-slate-600">
              <p>
                Monetcore is developing expertise and products across AI
                automation, custom software, intelligent sales systems, business
                integrations, and repeatable digital workflows.
              </p>

              <p>
                The long-term goal is to build a technology company capable of
                serving businesses in Nigeria and beyond with practical,
                scalable, and intelligent solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200/60 sm:p-10 lg:p-14">
            <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
                  Work With Monetcore
                </p>

                <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  Have a business challenge worth solving?
                </h2>

                <p className="mt-5 text-lg leading-8 text-blue-50">
                  We can explore how software, automation, AI, or connected
                  systems can improve the way your business operates.
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