import styles from "./devops.module.css";
export default function CapabilityVisual({ index, labels }: { index: number; labels: readonly string[] }) {
  return <figure className={styles.visual}>
    <svg viewBox="0 0 440 220" role="img" aria-label={`${labels.join(", ")} — illustrative technical diagram`}>
      <defs><pattern id={`grid-${index}`} width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="currentColor" opacity=".1" /></pattern></defs>
      <rect width="440" height="220" fill={`url(#grid-${index})`} />
      {index === 0 ? <g><rect x="45" y="30" width="350" height="150" rx="15" /><path d="M45 62H395" /><text x="66" y="52">BUILD / CHECK</text><path d="M88 90L72 105L88 120M135 90L151 105L135 120M120 85L103 125" /><path d="M182 92H347M182 111H305M182 130H330" /><circle cx="81" cy="155" r="6" className={styles.signal} /><text x="101" y="160">Acceptance checks</text></g>
      : index === 1 ? <g><path d="M70 60H368M70 150H190Q230 150 230 110T280 60" />{[[80,60],[185,60],[300,60],[365,60],[110,150],[185,150]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="10" />)}<text x="64" y="200">Every change has a history</text></g>
      : index === 2 ? <g>{[55,173,291].map(x => <g key={x}><rect x={x} y="38" width="94" height="123" rx="12" />{[63,90,117].map(y => <g key={y}><path d={`M${x+15} ${y}H${x+60}`} /><circle cx={x+75} cy={y} r="3" className={styles.signal} /></g>)}</g>)}<path d="M101 162V190H338V162M220 162V190" /></g>
      : index === 3 ? <g><rect x="45" y="32" width="350" height="150" rx="14" /><circle cx="66" cy="52" r="3" /><circle cx="80" cy="52" r="3" /><circle cx="94" cy="52" r="3" /><text x="66" y="95">$ review access</text><text x="66" y="125">$ inspect services</text><text x="66" y="155">$ document recovery</text><path d="M330 155H350" className={styles.signal} /></g>
      : index === 4 ? <g><rect x="30" y="75" width="100" height="75" rx="12" /><rect x="170" y="55" width="100" height="110" rx="12" /><rect x="310" y="75" width="100" height="75" rx="12" /><path d="M130 110H170M270 110H310M201 104V90A19 19 0 0 1 239 90V104" /><rect x="199" y="104" width="42" height="32" rx="6" /><circle cx="220" cy="120" r="3" className={styles.signal} /></g>
      : index === 5 ? <g><rect x="43" y="32" width="354" height="155" rx="15" /><path d="M65 118H107L122 89L139 142L155 107H205L219 78L238 140L254 113H373" className={styles.trace} />{[80,190,300].map(x => <g key={x}><rect x={x} y="158" width="64" height="7" rx="3" /><circle cx={x} cy="58" r="5" /></g>)}</g>
      : <g><path d="M61 85H380M365 133V174H76V133" />{[55,155,255,355].map((x,i) => <g key={x}><rect x={x-20} y="62" width="62" height="52" rx="12" /><text x={x} y="94">0{i+1}</text></g>)}<path d="M76 174L89 163M76 174L89 185" /><text x="152" y="201">Verified rollback path</text></g>}
    </svg>
    <div className={styles.diagramLabels}>{labels.map(label => <span key={label}>{label}</span>)}</div>
    <figcaption>Illustrative architecture · not a live system</figcaption>
  </figure>;
}
