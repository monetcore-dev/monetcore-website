"use client";
import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";
import { capabilities } from "./content";
import styles from "./devops.module.css";
export default function DevOpsWorkflow() {
  const [active, setActive] = useState<number | null>(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = capabilities.length - 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? last : ["ArrowRight", "ArrowDown"].includes(event.key) ? (index + 1) % capabilities.length : ["ArrowLeft", "ArrowUp"].includes(event.key) ? (index + last) % capabilities.length : null;
    if (next !== null) { event.preventDefault(); buttons.current[next]?.focus(); }
  }
  return <div className={styles.workflow}>
    <p className={styles.hint}>Select a stage to explore its handover. Use arrow keys to move between stages.</p>
    <ol>{capabilities.map((item, index) => <li key={item.id} data-active={active === index}>
      <button type="button" ref={node => { buttons.current[index] = node; }} id={`devops-step-${item.id}`} aria-expanded={active === index} aria-controls={`devops-panel-${item.id}`} onKeyDown={event => navigate(event, index)} onClick={() => setActive(active === index ? null : index)}>
        <span className={styles.stepNumber}>0{index + 1}</span><span>{item.short}</span><ChevronDown size={16} aria-hidden="true" />
      </button>
      <div id={`devops-panel-${item.id}`} role="region" aria-labelledby={`devops-step-${item.id}`} hidden={active !== index} className={styles.stepDetail}><p>{item.deliverable}.</p><a href={`#capability-${item.id}`}>Explore this capability <span aria-hidden="true">↗</span></a></div>
    </li>)}</ol>
  </div>;
}
