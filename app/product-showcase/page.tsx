import PageHero from "../components/PageHero";
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import SiteHeader from "../components/SiteHeader";
import DiscoveryIllustration from "../components/DiscoveryIllustration";
import {
  discoveryProducts,
  discoveryContent,
} from "../config/productDiscovery";
import { pageMetadata } from "../lib/metadata";
import styles from "../components/product-discovery.module.css";
export const metadata = pageMetadata(
  "/product-showcase",
  "Product Showcase",
  "Explore Monetcore product categories, illustrative concepts and scoped business technology possibilities. Contact our team to discuss your requirements.",
);
export default function ProductShowcasePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className={styles.showcasePage}>
        <PageHero
          eyebrow="The Monetcore product showcase"
          backgroundVisual="portfolio"
          title={
            <>
              Explore the possibilities.
              <br />
              Shape what comes next.
            </>
          }
          description="Practical digital products and intelligent software, built around the way businesses work. Explore our ideas and talk to us about your requirements."
          breadcrumb={
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Product showcase</span>
            </nav>
          }
        >
          <div className="page-hero-note">
            <strong>Clarity before commitment.</strong>
            <p>
              These previews show concepts and prototypes, not a catalogue of
              ready-to-activate software. Product demonstrations are temporarily
              unavailable. Scope, availability and integrations are confirmed
              for each engagement.
            </p>
          </div>
          <nav aria-label="Product categories" className={styles.categoryNav}>
            {discoveryProducts.map((item) => (
              <a key={item.id} href={`#showcase-${item.id}`}>
                {item.title}
                <ArrowDownRight size={16} aria-hidden="true" />
              </a>
            ))}
          </nav>
        </PageHero>
        {discoveryProducts.map((item, index) => {
          const content = discoveryContent(item);
          return (
            <section
              key={item.id}
              id={`showcase-${item.id}`}
              className={styles.productSection}
              aria-labelledby={`title-${item.id}`}
            >
              <div className={styles.wrap}>
                <div className={styles.productLayout}>
                  <div className={styles.productCopy}>
                    <p className={styles.eyebrow}>
                      0{index + 1} / {item.category}
                    </p>
                    <h2 id={`title-${item.id}`}>{item.title}</h2>
                    <p className={styles.productIntro}>{item.description}</p>
                    <div className={styles.statusNote}>
                      <strong>{content.status}</strong>
                      <p>{content.disclosure}</p>
                    </div>
                    <h3>Business possibilities</h3>
                    <p>{item.benefit}</p>
                    <p>{item.example}</p>
                    <h3>Features to discuss</h3>
                    <ul className={styles.features}>
                      {content.features.map((feature) => (
                        <li key={feature}>
                          <Check size={16} aria-hidden="true" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className={styles.scopeNote}>
                      Feature scope is illustrative and subject to agreement.
                      This preview does not connect live integrations.
                    </p>
                    <div className={styles.actions}>
                      <Link
                        href={content.enquiryHref}
                        className={styles.primary}
                      >
                        Request a Quotation
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </Link>
                      <Link
                        href={content.consultationHref}
                        className={styles.secondary}
                      >
                        Book a Consultation
                      </Link>
                      {content.demoHref && (
                        <Link
                          href={content.demoHref}
                          className={styles.textLink}
                        >
                          View Service Demonstration
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className={styles.largePreview}>
                    <div className={styles.previewToolbar}>
                      <span>
                        {item.kind === "service"
                          ? "Website service · illustrative design preview"
                          : "Product concept · demonstration unavailable"}
                      </span>
                    </div>
                    <DiscoveryIllustration id={item.id} />
                    <p className={styles.previewNotice}>
                      Static illustration only. Discuss your requirements with
                      our team.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
        <section className={styles.closing}>
          <div className={styles.wrap}>
            <p className={styles.eyebrow}>
              A solution shaped around your business
            </p>
            <h2>Have a workflow in mind?</h2>
            <p>
              Tell us what you need to improve. We&apos;ll discuss a suitable
              scope and the next steps.
            </p>
            <div className={styles.actions}>
              <Link href="/contact" className={styles.primary}>
                Request a Quotation
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/products" className={styles.secondary}>
                Browse existing product pages
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
