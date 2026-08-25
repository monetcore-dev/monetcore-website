const services = [
  {
    title: "Software Development",
    description:
      "Custom web applications, SaaS products, internal tools, portals, and business systems built around real operational needs.",
  },
  {
    title: "AI Solutions",
    description:
      "Practical AI systems for customer support, knowledge workflows, document processing, content operations, and business intelligence.",
  },
  {
    title: "Business Automation",
    description:
      "Automated workflows that reduce repetitive work, connect tools, improve response times, and make operations more efficient.",
  },
  {
    title: "Digital Products",
    description:
      "Scalable software products designed to solve repeatable business problems and create long-term value.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white text-sm font-bold text-black">
              M
            </div>

            <div>
              <p className="text-sm font-semibold tracking-[0.16em]">
                MONETCORE
              </p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                System Solutions
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-neutral-400 md:flex">
            <a href="#services" className="transition hover:text-white">
              Services
            </a>
            <a href="#about" className="transition hover:text-white">
              About
            </a>
            <a href="#products" className="transition hover:text-white">
              Products
            </a>
            <a href="#contact" className="transition hover:text-white">
              Contact
            </a>
          </nav>

          <a
            href="#contact"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Start a Project
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 pb-24 pt-40 lg:px-8 lg:pt-48">
        <div className="absolute left-1/2 top-20 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white/[0.035] blur-3xl" />

        <div className="mx-auto max-w-7xl">
          <div className="max-w-5xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-white" />
              Software • AI • Automation
            </div>

            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-8xl">
              We build software
              <span className="block text-neutral-500">
                that moves business forward.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-400 sm:text-xl">
              Monetcore System Solutions designs software, AI systems, and
              automation solutions that help businesses operate smarter, serve
              customers better, and scale with confidence.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#contact"
                className="rounded-lg bg-white px-6 py-3.5 font-semibold text-black transition hover:bg-neutral-200"
              >
                Build with Monetcore
              </a>

              <a
                href="#services"
                className="rounded-lg border border-white/15 px-6 py-3.5 font-semibold text-white transition hover:bg-white/5"
              >
                Explore Services
              </a>
            </div>
          </div>

          <div className="mt-24 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
            <div className="bg-neutral-950 p-7">
              <p className="text-3xl font-semibold">2016</p>
              <p className="mt-2 text-sm text-neutral-500">
                Monetcore established
              </p>
            </div>

            <div className="bg-neutral-950 p-7">
              <p className="text-3xl font-semibold">2026</p>
              <p className="mt-2 text-sm text-neutral-500">
                New technology chapter
              </p>
            </div>

            <div className="bg-neutral-950 p-7">
              <p className="text-3xl font-semibold">Global</p>
              <p className="mt-2 text-sm text-neutral-500">
                Built for modern businesses
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="services"
        className="border-t border-white/10 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
              What we do
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Technology built around business problems.
            </h2>

            <p className="mt-5 text-lg leading-8 text-neutral-400">
              We focus on practical systems that improve operations, customer
              experience, productivity, and growth.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {services.map((service, index) => (
              <div
                key={service.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <p className="text-sm text-neutral-600">
                  0{index + 1}
                </p>

                <h3 className="mt-8 text-2xl font-semibold">
                  {service.title}
                </h3>

                <p className="mt-4 max-w-xl leading-7 text-neutral-400">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="border-t border-white/10 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
              About Monetcore
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              Experience behind us.
              <span className="block text-neutral-500">
                A bigger future ahead.
              </span>
            </h2>
          </div>

          <div className="space-y-6 text-lg leading-8 text-neutral-400">
            <p>
              Monetcore System Solutions was established in 2016 with a focus
              on delivering technology solutions to businesses.
            </p>

            <p>
              Today, Monetcore is entering a new chapter focused on modern
              software development, artificial intelligence, automation, and
              scalable digital products.
            </p>

            <p>
              Our goal is simple: build technology that solves real problems
              and creates measurable value for businesses locally and
              globally.
            </p>
          </div>
        </div>
      </section>

      <section
        id="products"
        className="border-t border-white/10 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
                Products
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-tight">
                Building the Monetcore product portfolio.
              </h2>
            </div>

            <p className="max-w-md text-neutral-400">
              Our product strategy focuses on repeatable business problems that
              can be solved with scalable software.
            </p>
          </div>

          <div className="mt-14 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid md:grid-cols-[1fr_auto]">
              <div className="p-8 sm:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
                  Product 001
                </p>

                <h3 className="mt-4 text-3xl font-semibold">
                  Currently in development
                </h3>

                <p className="mt-5 max-w-2xl leading-7 text-neutral-400">
                  Monetcore&apos;s first software product will focus on helping
                  businesses automate important operational and customer-facing
                  workflows.
                </p>
              </div>

              <div className="flex items-center border-t border-white/10 px-8 py-6 md:border-l md:border-t-0">
                <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-neutral-400">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-white/10 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-14 sm:px-12 lg:px-16">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
              Start a project
            </p>

            <div className="mt-5 flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
              <div>
                <h2 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                  Have a business problem that software can solve?
                </h2>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
                  Talk to Monetcore about software development, AI systems,
                  automation, or a new digital product.
                </p>
              </div>

              <a
                href="mailto:hello@monetcore.dev"
                className="shrink-0 rounded-lg bg-white px-6 py-3.5 text-center font-semibold text-black transition hover:bg-neutral-200"
              >
                Start a Conversation
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-neutral-500 md:flex-row">
          <div>
            <p className="font-medium text-neutral-300">
              Monetcore System Solutions
            </p>
            <p className="mt-1">Software • AI • Automation</p>
          </div>

          <div className="md:text-right">
            <p>© 2026 Monetcore System Solutions.</p>
            <p className="mt-1">monetcore.dev</p>
          </div>
        </div>
      </footer>
    </main>
  );
}