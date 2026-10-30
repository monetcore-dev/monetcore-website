import PageHero from "../PageHero";
import { hybridPricing } from "../../config/websitePackages";
import Link from "next/link";
import {
  ArrowUpRight,
  Cpu,
  Code2,
  Globe2,
  PlugZap,
  Smartphone,
  Megaphone,
  Compass,
  Layers3,
} from "lucide-react";
import SiteHeader from "../SiteHeader";
import { services, products, enquiryHref } from "../../config/offeringCatalog";
const icons = [Cpu, Code2, Globe2, PlugZap, Smartphone, Megaphone, Compass];
export default function OfferingOverview({
  kind,
}: {
  kind: "services" | "products";
}) {
  const isService = kind === "services";
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="offering-page">
        <PageHero
          title={
            isService
              ? "Technology expertise, built around your business."
              : "Product ideas. A conversation before a commitment."
          }
          description={
            isService
              ? "Custom software, AI, integrations, websites, mobile experiences, marketing and consulting. Start with the challenge; we will define the right scope."
              : "Explore product categories and clearly labelled concepts. Contact our team about a scoped implementation; these are not ready-to-activate applications."
          }
          eyebrow={`Monetcore System Solutions · ${kind}`}
          backgroundVisual={isService ? "network" : "portfolio"}
        >
          <p>{hybridPricing.customDescription}</p>
          <div className="offering-actions">
            <Link className="offering-primary" href="/contact#consultation">
              {hybridPricing.customLabel}
            </Link>
            <Link
              className="offering-secondary"
              href={isService ? "/products" : "/services"}
            >
              {isService ? "Explore product ideas" : "Explore our services"}
            </Link>
          </div>
        </PageHero>
        <section
          className="offering-section"
          id={isService ? "service-demonstrations" : "product-ideas"}
        >
          <div className="offering-wrap">
            <p className="offering-eyebrow">
              {isService ? "Our expertise" : "Product portfolio"}
            </p>
            <h2>
              {isService
                ? "Seven connected service areas."
                : "Product ideas, with clear expectations."}
            </h2>
            <div className="offering-grid two">
              {isService
                ? services.map((s, i) => {
                    const Icon = icons[i];
                    return (
                      <article
                        className="offering-card offering-overview-card"
                        id={
                          s.slug === "software-development"
                            ? "custom-software"
                            : s.slug
                        }
                        key={s.slug}
                      >
                        <Icon size={28} aria-hidden="true" />
                        <p className="offering-eyebrow">Service 0{i + 1}</p>
                        <h3>{s.title}</h3>
                        <p>{s.intro}</p>
                        <div className="offering-tags">
                          {s.features.slice(0, 3).map((x) => (
                            <span key={x}>{x}</span>
                          ))}
                        </div>
                        <div className="offering-actions">
                          <Link
                            className="offering-text-link"
                            href={`/services/${s.slug}`}
                          >
                            Explore {s.title}{" "}
                            <ArrowUpRight size={16} aria-hidden="true" />
                          </Link>
                          <Link
                            className="offering-text-link"
                            href={enquiryHref("service", s.slug)}
                          >
                            {hybridPricing.customLabel}
                          </Link>
                        </div>
                      </article>
                    );
                  })
                : products.map((p) => (
                    <article
                      className="offering-card offering-overview-card"
                      id={p.slug}
                      key={p.slug}
                    >
                      <Layers3 size={28} aria-hidden="true" />
                      <p className="offering-eyebrow">{p.status}</p>
                      <h3>{p.title}</h3>
                      <p>{p.intro}</p>
                      <p>{p.disclosure}</p>
                      <div className="offering-actions">
                        <Link
                          className="offering-text-link"
                          href={`/products/${p.slug}`}
                        >
                          Explore {p.title.replace("Monetcore ", "")}{" "}
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                        <Link
                          className="offering-text-link"
                          href={enquiryHref("product", p.slug)}
                        >
                          {hybridPricing.customLabel}
                        </Link>
                      </div>
                    </article>
                  ))}
            </div>
          </div>
        </section>
        {isService ? (
          <section
            className="offering-section offering-tint"
            id="ai-sales-systems"
          >
            <div className="offering-wrap offering-split">
              <div>
                <p className="offering-eyebrow">Connected capabilities</p>
                <h2>Intelligent sales systems.</h2>
                <p>
                  Lead capture, qualification, prioritisation, assisted
                  follow-up and communication tracking combine automation with
                  custom software and integrations.
                </p>
              </div>
              <div className="offering-actions">
                <Link
                  className="offering-primary"
                  href="/products/ai-lead-automation"
                >
                  Explore lead automation
                </Link>
                <Link
                  className="offering-secondary"
                  href="/services/ai-automation"
                >
                  AI automation expertise
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section
            className="offering-section offering-tint"
            id="digital-applications"
          >
            <div className="offering-wrap">
              <p className="offering-eyebrow">
                Software categories & scoped services
              </p>
              <h2>Discuss the right solution for your business.</h2>
              <div className="offering-grid three">
                <article className="offering-card">
                  <h3>Fintech Products</h3>
                  <p>
                    A financial technology software category, not a launched
                    payment application. Discuss your requirements and an
                    appropriate scope.
                  </p>
                  <Link
                    className="offering-text-link"
                    href="/products/fintech-products"
                  >
                    Explore Fintech Products{" "}
                    <ArrowUpRight
                      className="ml-2 shrink-0"
                      size={16}
                      aria-hidden="true"
                    />
                  </Link>
                </article>
                <article className="offering-card">
                  <h3>Custom business software</h3>
                  <p>
                    Work with Monetcore to define and develop software around
                    your processes, users and integrations.
                  </p>
                  <Link
                    className="offering-text-link"
                    href="/services/software-development"
                  >
                    Explore software development{" "}
                    <ArrowUpRight
                      className="ml-2 shrink-0"
                      size={16}
                      aria-hidden="true"
                    />
                  </Link>
                </article>
                <article className="offering-card">
                  <h3>Smart Website Solutions</h3>
                  <p>
                    Compare website packages, first-year inclusions and annual
                    renewal terms, then request a quotation for your
                    requirements.
                  </p>
                  <Link className="offering-text-link" href="/website-packages">
                    Compare website packages{" "}
                    <ArrowUpRight
                      className="ml-2 shrink-0"
                      size={16}
                      aria-hidden="true"
                    />
                  </Link>
                </article>
              </div>
            </div>
          </section>
        )}
        <section className="offering-section">
          <div className="offering-wrap offering-closing">
            <h2>Start with a business challenge.</h2>
            <p>
              We will discuss what is available, what needs to be built and how
              to define a practical next step.
            </p>
            <div className="offering-actions">
              <Link className="offering-primary" href="/book">
                Book a Consultation
              </Link>
              <Link className="offering-secondary" href="/contact#consultation">
                Contact Monetcore
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
