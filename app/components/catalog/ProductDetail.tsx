import PageHero from "../PageHero";
import { productHeroVisuals } from "../../config/pageHeroes";
import { hybridPricing } from "../../config/websitePackages";
import OfferingSchema from "./OfferingSchema";
import Link from "next/link";
import type { ReactNode } from "react";
import { Layers3, Check, ArrowUpRight } from "lucide-react";
import SiteHeader from "../SiteHeader";
import {
  enquiryHref,
  findService,
  products,
  type Product,
} from "../../config/offeringCatalog";
export default function ProductDetail({
  item,
  demo,
}: {
  item: Product;
  demo?: ReactNode;
}) {
  const related = findService(item.related)!;
  return (
    <>
      <SiteHeader />
      <OfferingSchema kind="products" slug={item.slug} title={item.title} />
      <main id="main-content" className={`offering-page offering-${item.demo}`}>
        <PageHero
          title={item.headline}
          description={item.intro}
          eyebrow={item.title}
          backgroundVisual={
            productHeroVisuals[item.slug as keyof typeof productHeroVisuals]
          }
          supplement={
            <aside className="offering-hero-card">
              <Layers3 size={36} aria-hidden="true" />
              <p className="offering-eyebrow">Product status</p>
              <h2>{item.status}</h2>
              <p>{item.disclosure}</p>
            </aside>
          }
          breadcrumb={
            <nav className="offering-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/products">Products</Link>
              <span>/</span>
              <span>{item.title}</span>
            </nav>
          }
        >
          <div className="offering-actions">
            {demo && (
              <a className="offering-primary" href="#experience">
                Explore Demo <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            )}
            <Link
              className="offering-secondary"
              href={enquiryHref("product", item.slug)}
            >
              {hybridPricing.customLabel}
            </Link>
          </div>
          <p>{hybridPricing.customDescription}</p>
        </PageHero>
        <section className="offering-section">
          <div className="offering-wrap offering-split">
            <div>
              <p className="offering-eyebrow">The problem behind the idea</p>
              <h2>A clearer way to manage the next step.</h2>
              <p>{related.intro}</p>
              <p>
                Designed as a discussion starting point for{" "}
                {related.industries.join(", ").toLowerCase()}. Availability,
                implementation and support must be confirmed before any
                commercial commitment.
              </p>
            </div>
            <div className="offering-note">
              <h3>What you can explore here</h3>
              <p>{item.disclosure}</p>
              <p>
                No purchasing, subscription activation, provider connection or
                customer-data import is available on this product information
                page.
              </p>
            </div>
          </div>
        </section>
        <section className="offering-section offering-tint">
          <div className="offering-wrap">
            <p className="offering-eyebrow">Product capability concept</p>
            <h2>Explore the shape of the solution.</h2>
            <p className="offering-section-intro">
              These features describe potential project scope, not a
              ready-to-use product. Availability, implementation, integrations
              and support require a written agreement.
            </p>
            <ul className="offering-feature-list">
              {item.features.map((f) => (
                <li key={f}>
                  <Check size={18} aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>
        {demo && (
          <section className="offering-section" id="experience">
            <div className="offering-wrap">
              <p className="offering-eyebrow">Try the local experience</p>
              <h2>Explore a fictional business workflow.</h2>
              <p className="offering-section-intro">
                Synthetic data and local interactions only. No live AI, external
                messages, customer records, payments or bookings. Reloading
                clears demo changes.
              </p>
              {demo}
              <div className="mt-8 rounded-2xl border border-slate-200 p-5 sm:p-6">
                <h3>Interested in this solution?</h3>
                <div className="offering-actions">
                  <Link
                    className="offering-primary"
                    href={enquiryHref("product", item.slug)}
                  >
                    Request This Solution
                  </Link>
                  <Link
                    className="offering-secondary"
                    href={enquiryHref("product", item.slug, true)}
                  >
                    Book a Consultation
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
        <section className="offering-section offering-example">
          <div className="offering-wrap offering-split">
            <div>
              <p className="offering-eyebrow">Illustrative use case</p>
              <h2>A scenario to discuss.</h2>
              <p>{related.usecase}</p>
              <p>
                This is not a customer case study or a claim that this product
                is commercially deployed.
              </p>
            </div>
            <div className="offering-note">
              <h3>From concept to a supported implementation</h3>
              <ol>
                {[
                  "Discuss the business need and confirm product maturity.",
                  "Agree a scoped pilot, data permissions and third-party costs.",
                  "Validate the workflow, integrations and failure handling in isolation.",
                  "Consider launch only after acceptance, support and ownership are agreed.",
                ].map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>
        {item.slug === "smart-booking" && (
          <section className="offering-section">
            <div className="offering-wrap offering-note">
              <h2>Book a real Monetcore consultation</h2>
              <p>
                The company consultation form is separate from this simulation.
                Review previews disable real submissions; the simulation above
                never uses that API.
              </p>
              <Link
                className="offering-text-link"
                href={enquiryHref("product", item.slug, true)}
              >
                Go to company consultation booking{" "}
                <ArrowUpRight
                  className="ml-2 shrink-0"
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </section>
        )}
        <section className="offering-section">
          <div className="offering-wrap">
            <h2>Product questions</h2>
            <div className="offering-faq">
              {[
                [
                  "Can I buy or activate this product here?",
                  "No. Use the expression-of-interest or consultation pathway to discuss availability, implementation and support. This information page is not a subscription or purchase.",
                ],
                ["Is this a launched product?", item.disclosure],
                [
                  "How is pricing agreed?",
                  hybridPricing.customDescription +
                    " Product availability must be confirmed; no unlimited AI usage is promised.",
                ],
              ].map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="offering-section offering-tint">
          <div className="offering-wrap">
            <h2>Related expertise & experiences</h2>
            <div className="offering-grid three">
              <Link
                className="offering-card offering-link-card"
                href={`/services/${related.slug}`}
              >
                <p className="offering-eyebrow">Monetcore service</p>
                <h3>
                  {related.title}{" "}
                  <ArrowUpRight
                    className="inline-block align-middle"
                    size={16}
                    aria-hidden="true"
                  />
                </h3>
                <p>{related.intro}</p>
              </Link>
              {products
                .filter((p) => p.slug !== item.slug)
                .slice(0, 2)
                .map((p) => (
                  <Link
                    className="offering-card offering-link-card"
                    key={p.slug}
                    href={`/products/${p.slug}`}
                  >
                    <p className="offering-eyebrow">{p.status}</p>
                    <h3>
                      {p.title}{" "}
                      <ArrowUpRight
                        className="inline-block align-middle"
                        size={16}
                        aria-hidden="true"
                      />
                    </h3>
                    <p>{p.intro}</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
        <section
          className="offering-section"
          id={demo ? undefined : "experience"}
        >
          <div className="offering-wrap offering-closing">
            <p className="offering-eyebrow">Start with a conversation</p>
            <h2>Is this the right direction for your business?</h2>
            <p>
              Discuss your requirements and confirm what is available before
              planning a purchase or implementation.
            </p>
            <div className="offering-actions">
              <Link
                className="offering-primary"
                href={enquiryHref("product", item.slug)}
              >
                {hybridPricing.customLabel}
              </Link>
              <Link
                className="offering-secondary"
                href={enquiryHref("product", item.slug, true)}
              >
                Book a Consultation
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
