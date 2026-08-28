import BookingForm from "../BookingForm";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

export default function BookPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <SiteHeader />

      <section className="px-6 pb-24 pt-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                Book a Consultation
              </span>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Talk through your next technology project.
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Schedule a focused consultation with Monetcore to discuss AI
                automation, software development, sales systems, or business
                integrations.
              </p>

              <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                  What to expect
                </p>

                <div className="mt-5 space-y-4 text-sm leading-6 text-blue-50">
                  <p>✓ Discuss your business challenge or project idea.</p>
                  <p>✓ Identify practical technology and automation options.</p>
                  <p>✓ Define useful next steps, scope, and priorities.</p>
                  <p>✓ No obligation to proceed after the consultation.</p>
                </div>
              </div>
            </div>

            <BookingForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}