"use client";
import { useState } from "react";
import type { DiscoveryProduct } from "../config/productDiscovery";
import DiscoveryIllustration from "./DiscoveryIllustration";
import styles from "./product-discovery.module.css";
export default function DiscoveryPreview({
  id,
  title,
  scenarios,
}: {
  id: DiscoveryProduct["id"];
  title: string;
  scenarios: readonly string[];
}) {
  const [selected, setSelected] = useState(0);
  return (
    <div className={styles.largePreview}>
      <div className={styles.previewToolbar}>
        <span>Interactive illustration</span>
        <div role="group" aria-label={`${title} example views`}>
          {scenarios.map((name, i) => (
            <button
              type="button"
              key={name}
              aria-pressed={selected === i}
              aria-controls={`preview-${id}`}
              onClick={() => setSelected(i)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div id={`preview-${id}`}>
        <DiscoveryIllustration id={id} alternate={selected === 1} />
      </div>
      <p className={styles.previewNotice} role="status">
        Showing {scenarios[selected].toLowerCase()} example. Local simulation
        only; nothing is saved, sent or booked.
      </p>
    </div>
  );
}
