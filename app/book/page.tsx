import PageHero from "../components/PageHero";
import { resolveInterest } from "../config/offeringCatalog";
import { pageMetadata } from "../lib/metadata";
export const metadata = pageMetadata(
  "/book",
  "Book a Consultation",
  "Choose a consultation to discuss your software, AI automation, website or business integration project with Monetcore System Solutions.",
);

import BookingForm from "../BookingForm";
import PrivacyNotice from "../components/PrivacyNotice";
import { isStagingBookingEnabled } from "../lib/previewSafety";
import SiteHeader from "../components/SiteHeader";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string | string[] }>;
}) {
  const initialInterest = resolveInterest((await searchParams).interest, true);
  return (
    <main id="main-content" className="corporate-page min-h-screen bg-slate-50">
      <SiteHeader />

      <PageHero
        eyebrow="Book a Consultation"
        backgroundVisual="calendar"
        title="Talk through your next technology project."
        description="Schedule a focused consultation with Monetcore to discuss AI automation, software development, sales systems, or business integrations."
        cta={[{ href: "#booking-form", label: "Choose a consultation" }]}
      />
      <section className="px-6 pb-24 pt-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
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

            <div id="booking-form" className="min-w-0 scroll-mt-32">
              <BookingForm
                initialInterest={initialInterest}
                stagingTesting={isStagingBookingEnabled()}
              />
              <PrivacyNotice booking />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
