import Link from "next/link";
import { ArrowUpRight, ArrowRight, CalendarDays, MapPin, Zap, Code2, BrainCircuit, MonitorSmartphone, Layers3, ChartNoAxesCombined } from "lucide-react";
import styles from "./premium-corporate.module.css";
import ElectronHeroBackground from "./ElectronHeroBackground";

/** Corporate content stays server-rendered; only the decorative electron field has a motion control. */
const capabilityItems = [{icon:Code2,label:"Custom Software"},{icon:BrainCircuit,label:"AI & Automation"},{icon:MonitorSmartphone,label:"Web & Mobile Apps"},{icon:Layers3,label:"Business Integrations"},{icon:ChartNoAxesCombined,label:"Digital Marketing"}];
export default function PremiumCorporateHero() {
  return <section id="corporate-hero" className={styles.hero} aria-labelledby="premium-hero-title">
    <ElectronHeroBackground />
    <div className={styles.heroGrid}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}><span />Software. Intelligence. Possibility.</p>
        <h1 id="premium-hero-title">Build smarter.<br /><span>Automate <em>faster.</em></span><br />Grow further<span className={styles.period}>.</span></h1>
        <p className={styles.lead}>Your next chapter.<br />Engineered around your business.</p>
        <p className={styles.description}>Custom software, AI automation, websites and digital applications — connected to the way your business works.</p>
        <div className={styles.actions}>
          <Link href="/services" className={styles.primary}>Explore Solutions <ArrowUpRight size={19} aria-hidden="true" /></Link>
          <Link href="/book" className={styles.secondary}>Book Consultation <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <Link href="/contact#consultation" className={styles.textLink}>Have a project in mind? Let&apos;s talk <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>

    </div>
    <div className={styles.capabilities}>
      {capabilityItems.map(({icon:Icon,label})=><span key={label}><Icon size={25} strokeWidth={1.7} aria-hidden="true"/>{label}</span>)}
    </div>
    <div className={styles.foundation}>
      <div><CalendarDays size={24} aria-hidden="true" /><span><strong>Established in 2016</strong><small>A company focused on useful technology.</small></span></div>
      <div><MapPin size={24} aria-hidden="true" /><span><strong>Abuja, Nigeria</strong><small>Business technology with local understanding.</small></span></div>
      <div><Zap size={24} aria-hidden="true" /><span><strong>Built around your workflow</strong><small>Start with the problem. Shape the right solution.</small></span></div>
    </div>
  </section>;
}

export function ServiceGraphic({ index }: { index: number }) {
  return <div className={`${styles.serviceGraphic} ${index < 2 ? styles.featureGraphic : ""}`} aria-hidden="true">
    <span className={styles.diagramTag}>{["INTELLIGENT WORKFLOWS", "PURPOSE-BUILT SOFTWARE", "CUSTOMER JOURNEYS", "CONNECTED SYSTEMS", "DIGITAL EXPERIENCES", "CLARITY BEFORE CODE", "CONTENT → CONVERSATION", "MOBILE EXPERIENCES"][index]}</span>
    {index === 1 ? <div className={styles.codeDiagram}><span>&lt;your.next.chapter&gt;</span><i /><i /><i /><span>&lt;/built.around.you&gt;</span></div> : index === 4 ? <div className={styles.siteDiagram}><span /><div><i /><i /><i /></div></div> : index === 7 ? <div className={styles.phoneDiagram}><span><i /><i /><i /></span><span><i /><i /><i /></span></div> : index === 6 ? <div className={styles.marketingDiagram}><span>Content</span><ArrowRight size={11} /><span>Campaign</span><ArrowRight size={11} /><span>Conversation</span></div> : <div className={styles.nodeDiagram}><span /><i /><span /><i /><span /></div>}
    <span className={styles.diagramCaption}>Designed around your business</span>
  </div>;
}
