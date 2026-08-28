import Link from "next/link";
import ContactForm from "../ContactForm";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function ContactPage() {
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
              Contact Monetcore
            </div>

            <h1 className="mt-7 text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Let&apos;s build
              <span className="block bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                something useful.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600">
              Tell us about the business problem, workflow, software product, or
              automation you want to improve. We&apos;ll help you explore the right
              technology approach.
            </p>
          </div>
        </div>
      </section>

      <section
        id="consultation"
        className="scroll-mt-32 border-t border-blue-100 bg-white px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-200/60 sm:p-10 lg:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
                Start a Conversation
              </p>

              <h2 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                Have a business challenge technology can solve?
              </h2>

              <p className="mt-5 text-lg leading-8 text-blue-50">
                Give us a little information about what you want to build,
                automate, connect, or improve.
              </p>

              <div className="mt-9 space-y-4 text-sm text-blue-50">
                <p>✓ AI automation projects</p>
                <p>✓ Custom software development</p>
                <p>✓ AI sales systems</p>
                <p>✓ Business integrations</p>
                <p>✓ Product and workflow consulting</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10 lg:p-12">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Contact Details
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Reach Monetcore directly.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              You can contact us by email, phone, WhatsApp, or visit our office
              location in Maitama, Abuja.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">
                @
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Email
              </p>

              <a
                href="mailto:hello@monetcore.dev"
                className="mt-2 block font-semibold text-slate-950 transition hover:text-blue-600"
              >
                hello@monetcore.dev
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">
                ☎
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Phone
              </p>

              <a
                href="tel:+2347065880558"
                className="mt-2 block font-semibold text-slate-950 transition hover:text-blue-600"
              >
                +234 706 588 0558
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-700">
                W
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                WhatsApp
              </p>

              <a
                href="https://wa.me/2347065880558"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block font-semibold text-slate-950 transition hover:text-blue-600"
              >
                Chat with Monetcore
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-700">
                ↗
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                Location
              </p>

              <p className="mt-2 font-semibold leading-6 text-slate-950">
                Maitama, Abuja
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-blue-100 bg-white">
        <div className="px-6 pb-10 pt-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Visit Our Office
                </p>

                <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                  Find Monetcore in Maitama, Abuja.
                </h2>

                <p className="mt-5 text-lg leading-8 text-slate-600">
                  Ventures Park, 5 Kwaji Close, Maitama, Abuja, Nigeria.
                </p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Ventures+Park+5+Kwaji+Close+Maitama+Abuja+Nigeria"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Get Directions →
              </a>
            </div>
          </div>
        </div>

        <div className="w-full border-y border-blue-100 bg-slate-100">
          <iframe
            title="Monetcore System Solutions Office Map"
            src="https://www.google.com/maps?q=Ventures%20Park%2C%205%20Kwaji%20Close%2C%20Maitama%2C%20Abuja%2C%20Nigeria&output=embed"
            className="h-[500px] w-full border-0 lg:h-[620px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>

      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Office Address
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Monetcore System Solutions
              </h2>

              <div className="mt-6 text-lg leading-8 text-slate-600">
                <p>Ventures Park</p>
                <p>5 Kwaji Close</p>
                <p>Maitama, Abuja</p>
                <p>Nigeria</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-blue-50/70 p-8 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Connect With Us
              </p>

              <h3 className="mt-4 text-2xl font-bold text-slate-950">
                Prefer social or direct messaging?
              </h3>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/2347065880558"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:text-blue-600"
                >
                  WhatsApp
                </a>

                <a
                  href="https://www.facebook.com/monetcore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:text-blue-600"
                >
                  Facebook
                </a>

                <a
                  href="https://x.com/monetcore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:text-blue-600"
                >
                  X
                </a>

                <a
                  href="mailto:hello@monetcore.dev"
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:text-blue-600"
                >
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}