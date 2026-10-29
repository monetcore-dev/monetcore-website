import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  discoveryProducts,
  discoveryContent,
} from "../config/productDiscovery";
import DiscoveryIllustration from "./DiscoveryIllustration";
import styles from "./product-discovery.module.css";
export default function ProductDiscovery() {
  return (
    <section
      id="live-demos"
      className={styles.discovery}
      aria-labelledby="discovery-title"
    >
      <div className={styles.wrap}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Ideas you can explore</p>
            <h2 id="discovery-title">Discover what we&apos;re building.</h2>
          </div>
          <p>
            Explore practical digital products and intelligent software
            solutions designed to simplify business operations, improve customer
            experiences and support growth.
          </p>
        </div>
        <div className={styles.discoveryGrid}>
          {discoveryProducts.map((item) => (
            <article key={item.id} className={styles.discoveryCard}>
              <div className={styles.cardVisual}>
                <DiscoveryIllustration id={item.id} />
              </div>
              <div className={styles.discoveryContent}>
                <p className={styles.category}>{item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <p className={styles.concept}>
                  Illustrative concept · local demonstration available
                </p>
                <Link href={discoveryContent(item).demoHref}>
                  View Demonstration
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.exploreRow}>
          <p>
            Discover the possibilities, understand the product status, and
            discuss the right solution for your business.
          </p>
          <Link href="/product-showcase" className={styles.primary}>
            Explore All Products
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
