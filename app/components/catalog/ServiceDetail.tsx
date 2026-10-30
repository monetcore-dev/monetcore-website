import PageHero from "../PageHero";
import { serviceHeroVisuals } from "../../config/pageHeroes";
import { hybridPricing } from "../../config/websitePackages";
import OfferingSchema from "./OfferingSchema";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Cpu,
  Code2,
  Globe2,
  PlugZap,
  Smartphone,
  Megaphone,
  Compass,
} from "lucide-react";
import type { ReactNode } from "react";
import SiteHeader from "../SiteHeader";
import {
  enquiryHref,
  products,
  services,
  type Service,
} from "../../config/offeringCatalog";
import {
  websitePackages,
  packagePrice,
  packageRenewal,
  renewalTerms,
} from "../../config/websitePackages";
const icons = [Cpu, Code2, Globe2, PlugZap, Smartphone, Megaphone, Compass];
export default function ServiceDetail({
  item,
  demo,
}: {
  item: Service;
  demo?: ReactNode;
}) {
  const Icon = icons[services.findIndex((s) => s.slug === item.slug)];
  const related = products.filter((p) => p.related === item.slug);
  return (
    <>
      <SiteHeader />
      <OfferingSchema kind="services" slug={item.slug} title={item.title} />
      <main id="main-content" className={`offering-page offering-${item.demo}`}>
        <PageHero
          title={item.headline}
          description={item.intro}
          eyebrow={item.title}
          backgroundVisual={
            serviceHeroVisuals[item.slug as keyof typeof serviceHeroVisuals]
          }
          supplement={
            <aside className="offering-hero-card">
              <Icon size={36} aria-hidden="true" />
              <p className="offering-eyebrow">Built around your business</p>
              <h2>
                A clear scope.
                <br />A useful solution.
              </h2>
              <ul>
                {item.features.slice(0, 3).map((f) => (
                  <li key={f}>
                    <Check size={16} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <p>
                Scope, delivery milestones, provider costs and support are
                agreed before implementation.
              </p>
            </aside>
          }
          breadcrumb={
            <nav aria-label="Breadcrumb" className="offering-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/services">Services</Link>
              <span>/</span>
              <span>{item.title}</span>
            </nav>
          }
        >
          <div className="offering-actions">
            <Link
              className="offering-primary"
              href={enquiryHref("service", item.slug)}
            >
              {hybridPricing.customLabel}{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            <Link
              className="offering-secondary"
              href={enquiryHref("service", item.slug, true)}
            >
              Book a Consultation
            </Link>
            {demo && (
              <a className="offering-text-link" href="#experience">
                Explore Demo ↓
              </a>
            )}
          </div>
          <p>{hybridPricing.customDescription}</p>
        </PageHero>
        <section className="offering-section">
          <div className="offering-wrap">
            <p className="offering-eyebrow">Start with the problem</p>
            <h2>Where this can make a difference</h2>
            <div className="offering-grid three">
              {item.challenges.map((c, i) => (
                <article className="offering-card" key={c}>
                  <span className="offering-number">0{i + 1}</span>
                  <h3>{c}</h3>
                  <p>
                    {
                      [
                        "Map the current process and identify the points where information or effort is lost.",
                        "Design a focused improvement that your team can understand, review and use.",
                        "Agree measurable acceptance criteria and a practical support plan before launch.",
                      ][i]
                    }
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="offering-section offering-tint" id="capabilities">
          <div className="offering-wrap offering-split">
            <div>
              <p className="offering-eyebrow">Capabilities & benefits</p>
              <h2>{item.title}, with the details considered.</h2>
              <p>
                Choose a focused starting point or a connected implementation.
                Every capability is scoped to your requirements, data
                permissions and operating constraints.
              </p>
              <h3 className="offering-small-heading">Designed for</h3>
              <div className="offering-tags">
                {item.industries.map((x) => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            </div>
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
              <p className="offering-eyebrow">Explore before you enquire</p>
              <h2>Try a representative experience</h2>
              <p className="offering-section-intro">
                A local simulation, built to explain a workflow. No live AI,
                customer records, messages, payments or bookings are involved.
              </p>
              {demo}
              <div
                className="offering-actions"
                role="group"
                aria-label={`Next steps for ${item.title}`}
              >
                <Link
                  className="offering-primary"
                  href={enquiryHref("service", item.slug)}
                >
                  {hybridPricing.customLabel}
                </Link>
                <Link
                  className="offering-secondary"
                  href={enquiryHref("service", item.slug, true)}
                >
                  Book a Consultation
                </Link>
              </div>
            </div>
          </section>
        )}
        <section className="offering-section offering-example">
          <div className="offering-wrap offering-split">
            <div>
              <p className="offering-eyebrow">
                Illustrative use case · Nigeria
              </p>
              <h2>A practical starting point.</h2>
              <p>{item.usecase}</p>
              <p>
                This is an example scenario, not a client case study or a
                promise of specific results.
              </p>
            </div>
            <div className="offering-note">
              <h3>From idea to an agreed scope</h3>
              <ol>
                {[
                  "Understand the team, process and constraints.",
                  "Define requirements, responsibilities and acceptance criteria.",
                  "Build in reviewable stages and test with approved data.",
                  "Launch only after approval, with support and ownership agreed.",
                ].map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
          </div>
        </section>
        {item.slug === "website-development" && (
          <section className="offering-section">
            <div className="offering-wrap offering-pricing">
              <div>
                <p className="offering-eyebrow">Smart Website Solutions</p>
                <h2>Start with a clear package.</h2>
                <p>
                  Smart Starter: {packagePrice(websitePackages[0])} (one-time
                  package setup). First-year standard .com domain, hosting and
                  SSL are included for 12 months. Annual renewal:{" "}
                  {packageRenewal(websitePackages[0])} after 12 months.
                </p>
                <p>{renewalTerms.included}</p>
                <p>
                  {renewalTerms.excluded} {renewalTerms.limits}
                </p>
                <p>
                  Final quotations depend on your requirements. Premium domains,
                  optional automation and third-party usage are separately
                  quoted; no unlimited AI usage is promised.
                </p>
              </div>
              <Link className="offering-primary" href="/website-packages">
                Explore Website Packages
              </Link>
            </div>
          </section>
        )}
        <section className="offering-section">
          <div className="offering-wrap">
            <p className="offering-eyebrow">Useful answers</p>
            <h2>Before we begin</h2>
            <div className="offering-faq">
              {[
                [
                  `Can ${item.title.toLowerCase()} fit our existing systems?`,
                  "We first review your workflow and the tools involved. Compatibility, access permissions, data quality and provider limits determine the integration scope.",
                ],
                [
                  "What will the project cost?",
                  hybridPricing.customDescription,
                ],
                [
                  "Are the examples live products?",
                  "The demonstrations on this page are local simulations. Real implementation, integrations and commercial availability must be confirmed in your written scope.",
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
            <h2>Keep exploring</h2>
            <div className="offering-grid three">
              {related.map((p) => (
                <Link
                  className="offering-card offering-link-card"
                  href={`/products/${p.slug}`}
                  key={p.slug}
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
              {services
                .filter((s) => s.slug !== item.slug)
                .slice(0, related.length ? 1 : 3)
                .map((s) => (
                  <Link
                    className="offering-card offering-link-card"
                    href={`/services/${s.slug}`}
                    key={s.slug}
                  >
                    <p className="offering-eyebrow">Related expertise</p>
                    <h3>
                      {s.title}{" "}
                      <ArrowUpRight
                        className="inline-block align-middle"
                        size={16}
                        aria-hidden="true"
                      />
                    </h3>
                    <p>{s.intro}</p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
        <section className="offering-section">
          <div className="offering-wrap offering-closing">
            <p className="offering-eyebrow">Your next step</p>
            <h2>Let’s shape the right solution.</h2>
            <p>
              Tell us what needs to work better. We’ll discuss a realistic next
              step.
            </p>
            <div className="offering-actions">
              <Link
                className="offering-primary"
                href={enquiryHref("service", item.slug)}
              >
                {hybridPricing.customLabel}
              </Link>
              <Link
                className="offering-secondary"
                href={enquiryHref("service", item.slug, true)}
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
