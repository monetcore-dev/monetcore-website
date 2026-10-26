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
        <section className="offering-hero">
          <div className="offering-wrap">
            <p className="offering-eyebrow">
              Monetcore System Solutions · {kind}
            </p>
            <h1>
              {isService
                ? "Technology expertise, built around your business."
                : "Explore ideas. Understand what is ready."}
            </h1>
            <p>
              {isService
                ? "Custom software, AI, integrations, websites, mobile experiences, marketing and consulting. Start with the challenge; we will define the right scope."
                : "Product concepts, local interactive demonstrations and existing prototypes. Clear status labels help distinguish what you can explore from what is commercially available."}
            </p>
            <p>{hybridPricing.customDescription}</p>
            <div className="offering-actions">
              <Link className="offering-primary" href="/contact#consultation">
                {hybridPricing.customLabel}
              </Link>
              <Link
                className="offering-secondary"
                href={isService ? "/products" : "/services"}
              >
                {isService
                  ? "Explore products & demos"
                  : "Explore our services"}
              </Link>
            </div>
          </div>
        </section>
        <section className="offering-section">
          <div className="offering-wrap">
            <p className="offering-eyebrow">
              {isService ? "Our expertise" : "Product portfolio"}
            </p>
            <h2>
              {isService
                ? "Seven connected service areas."
                : "Six product experiences. Honest status."}
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
                Existing digital applications & prototypes
              </p>
              <h2>Explore existing demonstrations.</h2>
              <div className="offering-grid three">
                <article className="offering-card">
                  <h3>MonePay</h3>
                  <p>
                    Existing fictional fintech prototype with interactive
                    payment, savings and loan experiences. No money moves.
                  </p>
                  <Link className="offering-text-link" href="/demo/fintech">
                    Explore Demo ↗
                  </Link>
                </article>
                <article className="offering-card">
                  <h3>External lead prototype</h3>
                  <p>
                    Existing independently hosted demo. External data handling
                    and production readiness are unverified; use fictional
                    details only.
                  </p>
                  <a
                    className="offering-text-link"
                    href="https://monetcore-lead-demo.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore Demo ↗
                  </a>
                </article>
                <article className="offering-card">
                  <h3>Smart Website Solutions</h3>
                  <p>
                    Compare website packages, first-year inclusions and annual
                    renewal terms, then request a quotation for your requirements.
                  </p>
                  <Link className="offering-text-link" href="/website-packages">
                    Compare website packages ↗
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
