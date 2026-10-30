import Link from "next/link";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import PageHeroVisual from "./PageHeroVisual";
import type { PageHeroVisual as Visual } from "../config/pageHeroes";
import styles from "./page-hero.module.css";

type HeroCTA = { href: string; label: string; secondary?: boolean };
type Props = {
  title: ReactNode;
  description: ReactNode;
  eyebrow?: string;
  cta?: readonly HeroCTA[];
  backgroundVisual: Visual | ReactElement;
  animation?: { enabled?: boolean; duration?: number };
  breadcrumb?: ReactNode;
  children?: ReactNode;
  supplement?: ReactNode;
  compact?: boolean;
};
/** One hero per page. Decorative SVG is in the banner, never an adjacent column. */
export default function PageHero({
  title,
  description,
  eyebrow,
  cta,
  backgroundVisual,
  animation,
  breadcrumb,
  children,
  supplement,
  compact,
}: Props) {
  const enabled = animation?.enabled !== false;
  const requestedDuration = animation?.duration ?? 24;
  const duration = Number.isFinite(requestedDuration)
    ? Math.max(12, Math.min(60, requestedDuration))
    : 24;
  return (
    <section
      className={`${styles.banner} ${compact ? styles.compact : ""}`}
      aria-labelledby="page-hero-title"
      data-page-hero
      data-motion={enabled ? "enabled" : "disabled"}
      style={{ "--hero-cycle": `${duration}s` } as CSSProperties}
    >
      {enabled && (
        <input
          id="page-hero-motion"
          type="checkbox"
          className={styles.motionToggle}
          aria-label="Pause banner background animation"
        />
      )}
      <div className={styles.background} aria-hidden="true">
        {typeof backgroundVisual === "string" ? (
          <PageHeroVisual theme={backgroundVisual as Visual} />
        ) : (
          backgroundVisual
        )}
      </div>
      <div
        className={`${styles.wrap} ${supplement ? styles.withSupplement : ""}`}
      >
        <div className={styles.copy}>
          {breadcrumb && <div className={styles.breadcrumb}>{breadcrumb}</div>}
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 className={styles.title} id="page-hero-title">
            {title}
          </h1>
          <p className={styles.description}>{description}</p>
          {!!cta?.length && (
            <div className={styles.actions}>
              {cta.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.secondary ? styles.secondary : styles.primary
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
          {children && <div className={styles.extra}>{children}</div>}
        </div>
        {supplement && <div className={styles.supplement}>{supplement}</div>}
      </div>
      {enabled && (
        <label htmlFor="page-hero-motion" className={styles.motionLabel}>
          <span aria-hidden="true">Ⅱ</span> Background motion
        </label>
      )}
    </section>
  );
}
