import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import PageHero from "../../components/PageHero";
import { pageMetadata } from "../../lib/metadata";
import { enquiryHref } from "../../config/offeringCatalog";
export const metadata = pageMetadata(
  "/products/fintech-products",
  "Fintech Products",
  "Discuss financial technology software requirements with Monetcore System Solutions. A product category, not a launched payment application.",
);
export default function FintechProductsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="corporate-page offering-page">
        <PageHero
          eyebrow="Monetcore System Solutions · Product category"
          title="Fintech Products"
          backgroundVisual="fintech"
          description="Financial technology software starts with a clear business need, a practical scope and the right responsibilities. Talk to us about your requirements."
          cta={[
            {
              href: enquiryHref("service", "software-development"),
              label: "Request a Quotation",
            },
            {
              href: enquiryHref("service", "software-development", true),
              label: "Book a Consultation",
              secondary: true,
            },
          ]}
        >
          <div className="page-hero-note">
            <strong>A category, not a launched payment application.</strong>
            <p>
              No banking, lending, investment or payment processing is offered
              on this website. Availability, integrations and any applicable
              regulatory requirements must be considered before an
              implementation is agreed.
            </p>
          </div>
        </PageHero>
        <section className="offering-section">
          <div className="offering-wrap">
            <p className="offering-eyebrow">Start with your requirements</p>
            <h2>Discuss a scoped financial technology project.</h2>
            <p className="offering-section-intro">
              We can discuss software interfaces, reporting and business
              workflows. These are areas for project discovery, not claims of
              completed products or operational financial integrations.
            </p>
            <div className="offering-grid three">
              {[
                "Customer and business interfaces",
                "Reporting and operational workflows",
                "Integration requirements and feasibility",
              ].map((title) => (
                <article className="offering-card" key={title}>
                  <h3>{title}</h3>
                  <p>
                    Define users, permissions, provider dependencies and
                    acceptance criteria before committing to a build.
                  </p>
                </article>
              ))}
            </div>
            <div className="offering-actions">
              <Link
                className="offering-primary"
                href="/services/software-development"
              >
                Explore Software Development
              </Link>
              <a
                className="offering-secondary"
                href="https://wa.me/2347065880558?text=Hello%20Monetcore%2C%20I%27d%20like%20to%20discuss%20Fintech%20Products."
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
