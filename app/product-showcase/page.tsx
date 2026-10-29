import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import SiteHeader from "../components/SiteHeader";
import DiscoveryPreview from "../components/DiscoveryPreview";
import {
  discoveryProducts,
  discoveryContent,
} from "../config/productDiscovery";
import { pageMetadata } from "../lib/metadata";
import styles from "../components/product-discovery.module.css";
export const metadata = pageMetadata(
  "/product-showcase",
  "Product Showcase",
  "Explore Monetcore’s software concepts, local product demonstrations and business technology possibilities. Review product status and discuss a tailored solution.",
);
export default function ProductShowcasePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className={styles.showcasePage}>
        <section className={styles.pageHero}>
          <div className={styles.wrap}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>Product showcase</span>
            </nav>
            <p className={styles.eyebrow}>The Monetcore product showcase</p>
            <h1>
              Explore the possibilities.
              <br />
              <span>Shape what comes next.</span>
            </h1>
            <p className={styles.heroIntro}>
              Practical digital products and intelligent software, built around
              the way businesses work. Explore our ideas, try local
              illustrations and talk to us about your requirements.
            </p>
            <div className={styles.heroNote}>
              <strong>Clarity before commitment.</strong>
              <p>
                These previews show concepts and prototypes, not a catalogue of
                ready-to-activate software. Local demonstrations use synthetic
                data. Scope, availability and integrations are confirmed for
                each engagement.
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
          </div>
        </section>
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
                        Get a Quote
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </Link>
                      <Link
                        href={content.enquiryHref}
                        className={styles.secondary}
                      >
                        Request a Demo
                      </Link>
                      <Link href={content.demoHref} className={styles.textLink}>
                        View Demonstration
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                  <DiscoveryPreview
                    id={item.id}
                    title={item.title}
                    scenarios={item.scenarios}
                  />
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
                Get a Quote
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
