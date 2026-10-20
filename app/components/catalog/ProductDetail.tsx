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
      <main id="main-content" className={`offering-page offering-${item.demo}`}>
        <section className="offering-hero">
          <div className="offering-wrap offering-hero-grid">
            <div>
              <nav className="offering-breadcrumb" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span>/</span>
                <Link href="/products">Products</Link>
                <span>/</span>
                <span>{item.title}</span>
              </nav>
              <p className="offering-eyebrow">{item.title}</p>
              <h1>{item.headline}</h1>
              <p>{item.intro}</p>
              <div className="offering-actions">
                {demo && (
                  <a className="offering-primary" href="#experience">
                    Explore the Demo{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                )}
                <Link
                  className="offering-secondary"
                  href={enquiryHref("product", item.slug)}
                >
                  Express Interest
                </Link>
              </div>
            </div>
            <aside className="offering-hero-card">
              <Layers3 size={36} aria-hidden="true" />
              <p className="offering-eyebrow">Product status</p>
              <h2>{item.status}</h2>
              <p>{item.disclosure}</p>
            </aside>
          </div>
        </section>
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
                customer-data import is offered by this demonstration.
              </p>
            </div>
          </div>
        </section>
        <section className="offering-section offering-tint">
          <div className="offering-wrap">
            <p className="offering-eyebrow">Product capability concept</p>
            <h2>Explore the shape of the solution.</h2>
            <p className="offering-section-intro">
              These features describe the intended product scope. A demo may
              illustrate part of a workflow; it does not establish production
              support for every integration or feature.
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
        {item.slug === "ai-lead-automation" && (
          <section className="offering-section">
            <div className="offering-wrap offering-note">
              <h2>Existing external prototype</h2>
              <p>
                An independently hosted lead-automation prototype also exists.
                Its external implementation, data handling and production
                readiness are outside this local demo’s verified scope. Do not
                enter real customer information.
              </p>
              <a
                className="offering-text-link"
                href="https://monetcore-lead-demo.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open external lead prototype ↗
              </a>
            </div>
          </section>
        )}
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
                Go to company consultation booking ↗
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
                  "No. Use the expression-of-interest or consultation pathway to discuss availability, implementation and support. The local demo is not a subscription or purchase.",
                ],
                ["Does this demo use live integrations?", item.disclosure],
                [
                  "How is pricing agreed?",
                  "Request a scoped quotation. Implementation, subscriptions, AI/API/messaging usage and support must be explicitly agreed. No unlimited usage or unapproved product price is promised.",
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
                <h3>{related.title} ↗</h3>
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
                    <h3>{p.title} ↗</h3>
                    <p>{p.intro}</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
        <section className="offering-section">
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
                Request a Quotation
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
