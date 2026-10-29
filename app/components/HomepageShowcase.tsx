import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  GitBranch,
  CalendarDays,
  Layers3,
} from "lucide-react";
import { enquiryHref } from "../config/offeringCatalog";
import styles from "./homepage-showcase.module.css";

const solutions = [
  {
    title: "AI Lead Automation",
    slug: "ai-lead-automation",
    icon: GitBranch,
    label: "From enquiry to opportunity",
    benefits: [
      "Capture and organize customer enquiries.",
      "Reduce repetitive follow-up tasks.",
      "Help teams respond more efficiently.",
      "Track potential customers through the sales process.",
    ],
  },
  {
    title: "Smart Booking & Scheduling",
    slug: "smart-booking",
    icon: CalendarDays,
    label: "A clearer view of your time",
    benefits: [
      "Simplify appointments and reservations.",
      "Manage availability efficiently.",
      "Support confirmations and reminders through configured integrations.",
      "Reduce manual scheduling work.",
    ],
  },
  {
    title: "Business Management & Automation",
    slug: "business-automation",
    icon: Layers3,
    label: "Bring your operations together",
    benefits: [
      "Connect internal business workflows.",
      "Organize operations and reporting.",
      "Reduce repetitive administrative tasks.",
      "Provide better visibility into business activity.",
    ],
  },
];

function Chart({ bars = false }: { bars?: boolean }) {
  return (
    <svg viewBox="0 0 280 68" className={styles.chart} aria-hidden="true">
      {[12, 34, 56].map((y) => (
        <path key={y} d={`M0 ${y}H280`} stroke="currentColor" opacity=".12" />
      ))}
      {bars ? (
        [25, 42, 30, 54, 39, 58, 45, 62, 52, 63].map((h, i) => (
          <rect
            key={i}
            x={i * 28 + 5}
            y={68 - h}
            width="15"
            height={h}
            rx="3"
            fill="currentColor"
            opacity={0.35 + i * 0.06}
          />
        ))
      ) : (
        <>
          <path
            d="M0 57L25 49L50 53L76 32L103 39L130 21L156 29L184 17L212 23L244 9L280 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M0 57L25 49L50 53L76 32L103 39L130 21L156 29L184 17L212 23L244 9L280 4V68H0Z"
            fill="currentColor"
            opacity=".09"
          />
        </>
      )}
    </svg>
  );
}

function InterfacePreview({ kind }: { kind: number }) {
  return (
    <div
      className={styles.preview}
      aria-label={`${solutions[kind].title} illustrative interface`}
    >
      <div className={styles.windowbar}>
        <span className={styles.dots} aria-hidden="true">
          ● ● ●
        </span>
        <span>MONETCORE / WORKSPACE</span>
        <span className={styles.demoPill}>Demo data</span>
      </div>
      {kind === 0 ? (
        <>
          <div className={styles.previewHeading}>
            <strong>Lead overview</strong>
            <span>This week · sample</span>
          </div>
          <div className={styles.stats}>
            <div>
              <span>Enquiries</span>
              <strong>24</strong>
            </div>
            <div>
              <span>Qualified</span>
              <strong>12</strong>
            </div>
            <div>
              <span>Follow-ups</span>
              <strong>08</strong>
            </div>
          </div>
          <div className={styles.chartLabel}>
            Illustrative pipeline activity
          </div>
          <Chart />
          <div className={styles.rows}>
            {["New enquiry", "Requirements reviewed", "Follow-up prepared"].map(
              (name, i) => (
                <div key={name}>
                  <span>
                    <i aria-hidden="true" />
                    {name}
                  </span>
                  <small>{["Captured", "Qualified", "Draft only"][i]}</small>
                </div>
              ),
            )}
          </div>
          <div className={styles.flow}>
            <span>Capture</span>
            <b aria-hidden="true">→</b>
            <span>Organize</span>
            <b aria-hidden="true">→</b>
            <span>Follow up</span>
          </div>
        </>
      ) : kind === 1 ? (
        <>
          <div className={styles.previewHeading}>
            <strong>Schedule workspace</strong>
            <span>Sample week</span>
          </div>
          <div className={styles.calendar}>
            <div className={styles.weekdays}>
              {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className={styles.days}>
              {Array.from({ length: 21 }, (_, i) => (
                <span
                  key={i}
                  className={
                    [4, 8, 11, 16].includes(i) ? styles.selectedDay : undefined
                  }
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.rows}>
            {["Discovery consultation", "Project review"].map((name, i) => (
              <div key={name}>
                <span>{name}</span>
                <small>{i ? "14:00" : "10:00"} WAT</small>
              </div>
            ))}
          </div>
          <div className={styles.flow}>
            <span>Availability</span>
            <b aria-hidden="true">→</b>
            <span>Appointment</span>
          </div>
        </>
      ) : (
        <>
          <div className={styles.previewHeading}>
            <strong>Business workspace</strong>
            <span>Sample overview</span>
          </div>
          <div className={styles.stats}>
            <div>
              <span>Workflows</span>
              <strong>06</strong>
            </div>
            <div>
              <span>Tasks</span>
              <strong>18</strong>
            </div>
            <div>
              <span>Reports</span>
              <strong>04</strong>
            </div>
          </div>
          <div className={styles.chartLabel}>Illustrative task activity</div>
          <Chart bars />
          <div className={styles.rows}>
            {["Enquiry routing", "Team handover", "Reporting workflow"].map(
              (name, i) => (
                <div key={name}>
                  <span>
                    <i aria-hidden="true" />
                    {name}
                  </span>
                  <small>{["Configured", "In review", "Scheduled"][i]}</small>
                </div>
              ),
            )}
          </div>
          <div className={styles.flow}>
            <span>Connect</span>
            <b aria-hidden="true">→</b>
            <span>Coordinate</span>
            <b aria-hidden="true">→</b>
            <span>Review</span>
          </div>
        </>
      )}
      <p className={styles.illustration}>
        Illustrative interface · not a live customer system
      </p>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <section
      id="products"
      className={styles.products}
      aria-labelledby="showcase-title"
    >
      <div className={styles.container}>
        <p className={styles.eyebrow}>Digital products & applications</p>
        <h2 id="showcase-title" className={styles.heading}>
          Intelligent software.
          <br />
          Real business possibilities.
        </h2>
        <p className={styles.intro}>
          From customer management to intelligent automation, Monetcore designs
          digital solutions that simplify operations, improve efficiency and
          help businesses grow.
        </p>
        <div className={styles.cards}>
          {solutions.map((solution, i) => (
            <article key={solution.slug} className={styles.card}>
              <InterfacePreview kind={i} />
              <div className={styles.cardContent}>
                <span className={styles.solutionIcon}>
                  <solution.icon size={22} aria-hidden="true" />
                </span>
                <p className={styles.kicker}>{solution.label}</p>
                <h3>{solution.title}</h3>
                <ul>
                  {solution.benefits.map((benefit) => (
                    <li key={benefit}>
                      <Check size={16} aria-hidden="true" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={enquiryHref("product", solution.slug)}
                  className={styles.quote}
                  aria-label={`Get a Quote for ${solution.title}`}
                >
                  Get a Quote
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className={styles.disclaimer}>
          Explore what we can build for your business. Interfaces and figures
          are illustrative, not live products or customer results. Availability,
          scope and integrations are confirmed in your quotation.
        </p>
      </div>
    </section>
  );
}

const technologies = [
  ["React", "react"],
  ["Next.js", "nextdotjs"],
  ["TypeScript", "typescript"],
  ["JavaScript", "javascript"],
  ["Node.js", "nodedotjs"],
  ["PostgreSQL", "postgresql"],
  ["Python", "python"],
  ["GitHub", "github"],
];

export function TechnologyStack() {
  return (
    <section
      id="smart-websites"
      className={styles.technology}
      aria-labelledby="technology-title"
    >
      <div className={styles.container}>
        <p className={styles.eyebrow}>Our technology toolkit</p>
        <h2 id="technology-title" className={styles.heading}>
          Built with modern technology.
        </h2>
        <p className={styles.intro}>
          We bring together modern programming languages, frameworks, cloud
          services and AI technologies to develop practical digital solutions.
        </p>
        <div className={styles.marquee}>
          <label className={styles.pause}>
            <input type="checkbox" />
            Pause logo motion
          </label>
          <div className={styles.viewport}>
            <div className={styles.track}>
              {[false, true].map((duplicate) => (
                <ul
                  key={String(duplicate)}
                  className={styles.logoGroup}
                  aria-label={
                    duplicate ? undefined : "Technologies used in this project"
                  }
                  aria-hidden={duplicate || undefined}
                >
                  {technologies.map(([name, slug]) => (
                    <li key={slug}>
                      <Image
                        src={`/technology/${slug}.svg`}
                        alt=""
                        width={30}
                        height={30}
                      />
                      <span>{name}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
        <p className={styles.disclaimer}>
          A selection of tools used in this project. Each solution&apos;s
          technology and integrations depend on its agreed requirements.
        </p>
      </div>
    </section>
  );
}
