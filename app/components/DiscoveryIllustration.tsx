import { ArrowUpRight } from "lucide-react";
import type { DiscoveryProduct } from "../config/productDiscovery";
import styles from "./product-discovery.module.css";

/** Visuals use fixed synthetic data only; controls never connect to integrations. */
export default function DiscoveryIllustration({
  id,
  alternate = false,
}: {
  id: DiscoveryProduct["id"];
  alternate?: boolean;
}) {
  return (
    <div
      className={styles.interface}
      aria-label="Illustrative interface using synthetic data"
    >
      <div className={styles.chrome}>
        <span aria-hidden="true">● ● ●</span>
        <span>MONETCORE / {id.toUpperCase()}</span>
        <span>ILLUSTRATION</span>
      </div>
      {id === "websites" ? (
        <>
          <div className={styles.siteNav}>
            <span className={styles.brandMark} aria-hidden="true">
              M
            </span>
            <strong>BUSINESS / WEBSITE</strong>
            <span>Services · About</span>
          </div>
          <div className={styles.websiteHero}>
            <span>YOUR NEXT CHAPTER</span>
            <strong>
              A clearer digital
              <br />
              home for your business.
            </strong>
            <p>Explain your services. Start a conversation.</p>
            <span className={styles.fakeButton}>
              Explore services <ArrowUpRight size={12} aria-hidden="true" />
            </span>
          </div>
          <div className={styles.websiteTiles}>
            {(alternate
              ? ["Enquiry details", "Team review", "Next steps"]
              : ["Our expertise", "How we help", "Get in touch"]
            ).map((t) => (
              <span key={t}>
                <i aria-hidden="true" />
                {t}
              </span>
            ))}
          </div>
        </>
      ) : id === "automation" ? (
        <>
          <div className={styles.boardHeading}>
            <strong>
              {alternate ? "Follow-up workspace" : "Enquiry journey"}
            </strong>
            <span>Sample workflow</span>
          </div>
          <div className={styles.pipeline}>
            {(alternate
              ? ["Enquiry reviewed", "Draft prepared", "Human approval"]
              : ["Enquiry captured", "Needs organized", "Team handoff"]
            ).map((t, i) => (
              <div key={t}>
                <span className={styles.stageNumber}>0{i + 1}</span>
                <strong>{t}</strong>
                <small>
                  {["Local example", "No live AI", "No messages sent"][i]}
                </small>
              </div>
            ))}
          </div>
          <div className={styles.sampleRow}>
            <span>Sample enquiry</span>
            <span className={styles.status}>Ready for review</span>
          </div>
          <div className={styles.signal} aria-hidden="true">
            {[32, 60, 45, 72, 55, 85, 65, 94, 78, 100].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </>
      ) : id === "booking" ? (
        <>
          <div className={styles.boardHeading}>
            <strong>Example availability</strong>
            <span>WAT · sample week</span>
          </div>
          <div className={styles.calendarStrip}>
            {["MON", "TUE", "WED", "THU", "FRI"].map((day, i) => (
              <div
                key={day}
                className={i === 2 ? styles.activeDate : undefined}
              >
                <span>{day}</span>
                <strong>{12 + i}</strong>
              </div>
            ))}
          </div>
          <div className={styles.slots}>
            {(alternate
              ? ["13:00", "14:00", "15:00"]
              : ["09:00", "10:00", "11:00"]
            ).map((t, i) => (
              <span
                key={t}
                className={i === 1 ? styles.selectedSlot : undefined}
              >
                {t}
              </span>
            ))}
          </div>
          <div className={styles.appointment}>
            <span className={styles.appointmentIcon} aria-hidden="true">
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
            <div>
              <strong>Example consultation</strong>
              <span>Illustrative only · no reservation</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.boardHeading}>
            <strong>
              {alternate ? "Reporting overview" : "Operations workspace"}
            </strong>
            <span>Demo data</span>
          </div>
          <div className={styles.metrics}>
            {(alternate
              ? [
                  ["Reports", "04"],
                  ["Reviewed", "03"],
                  ["Draft", "01"],
                ]
              : [
                  ["Tasks", "18"],
                  ["In review", "06"],
                  ["Teams", "03"],
                ]
            ).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <svg className={styles.trend} viewBox="0 0 320 78" aria-hidden="true">
            <path
              d="M0 20H320M0 45H320M0 70H320"
              stroke="currentColor"
              opacity=".15"
            />
            <path
              d={
                alternate
                  ? "M0 65L40 40L80 50L120 30L160 40L200 15L240 25L280 8L320 14"
                  : "M0 65L40 55L80 60L120 38L160 45L200 25L240 32L280 12L320 6"
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
          <div className={styles.sampleRow}>
            <span>{alternate ? "Monthly summary" : "Team handover"}</span>
            <span className={styles.status}>
              {alternate ? "Draft report" : "Ready for review"}
            </span>
          </div>
        </>
      )}
      <p className={styles.interfaceNote}>
        Illustrative concept · synthetic data · no external actions
      </p>
    </div>
  );
}
