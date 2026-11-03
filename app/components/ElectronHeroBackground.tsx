"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./electron-hero-background.module.css";
function ellipse(rx:number,ry:number,degrees:number){const a=degrees*Math.PI/180,k=.5522847498;const p=(x:number,y:number)=>`${(1140+x*Math.cos(a)-y*Math.sin(a)).toFixed(2)} ${(345+x*Math.sin(a)+y*Math.cos(a)).toFixed(2)}`;return `M ${p(rx,0)} C ${p(rx,k*ry)} ${p(k*rx,ry)} ${p(0,ry)} C ${p(-k*rx,ry)} ${p(-rx,k*ry)} ${p(-rx,0)} C ${p(-rx,-k*ry)} ${p(-k*rx,-ry)} ${p(0,-ry)} C ${p(k*rx,-ry)} ${p(rx,-k*ry)} ${p(rx,0)} Z`;}
const orbits=[
 {path:ellipse(405,145,-31),color:'#29ddff',seconds:32,delay:-12},
 {path:ellipse(350,140,41),color:'#bb65ff',seconds:41,delay:-21},
 {path:ellipse(390,117,8),color:'#ff8a24',seconds:48,delay:-3},
 {path:ellipse(318,166,86),color:'#4083ff',seconds:55,delay:-33},
];
/** Four original CSS/SVG orbits. No Canvas, Earth, textures or animation loop. */
export default function ElectronHeroBackground(){
 const [paused,setPaused]=useState(false),[reduced,setReduced]=useState(false);const root=useRef<HTMLElement>(null),id=useId().replace(/:/g,'');
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{const el=root.current;if(!el)return;let visible=false;const sync=()=>{el.dataset.visible=String(visible&&!document.hidden);};const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.01});observer.observe(el);document.addEventListener('visibilitychange',sync);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',sync);};},[]);
 return <figure ref={root} className={styles.background} data-electron-background data-motion={paused||reduced?'paused':'running'} aria-label="Illustrative electron-orbit technology background. No live customer data.">
  <div className={styles.ambience} aria-hidden="true"/>
  <svg className={styles.orbits} viewBox="0 0 1600 900" preserveAspectRatio="xMaxYMin meet" aria-hidden="true" focusable="false">
   <defs>{orbits.map((o,i)=><radialGradient id={`${id}-core-${i}`} key={o.color}><stop offset="0" stopColor="#ffffff"/><stop offset=".19" stopColor="#fff8ed"/><stop offset=".48" stopColor={o.color}/><stop offset="1" stopColor={o.color} stopOpacity="0"/></radialGradient>)}</defs>
   {orbits.map((o,i)=>{const timing={animationDuration:`${o.seconds}s`,animationDelay:`${o.delay}s`,animationDirection:i%2?'reverse':'normal'};return <g key={o.color} color={o.color} data-reference-orbit={i} className={styles.ring}>
    <path d={o.path} className={styles.track}/><path d={o.path} className={styles.halo}/><path d={o.path} pathLength="1000" className={styles.trail} style={timing}/>
    <g className={styles.electron} data-reference-electron={i} style={{...timing,offsetPath:`path('${o.path}')`}}><circle r="35" fill="currentColor" opacity=".045"/><circle r="23" fill="currentColor" opacity=".09"/><circle r="18" fill={`url(#${id}-core-${i})`}/><circle r="4" fill="#faffff"/></g>
   </g>;})}
   <g className={styles.stars}>{Array.from({length:22},(_,i)=><circle key={i} cx={730+(i*137)%800} cy={90+(i*91)%650} r={i%4?1.2:2.1} fill={['#8a6dff','#28d8ff','#ff9c4f'][i%3]} opacity={i%4?.45:.8}/>)}</g>
  </svg>
  <svg className={styles.ribbons} viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id={`${id}-wave`}><stop stopColor="#822fff"/><stop offset=".45" stopColor="#0f75f3"/><stop offset=".8" stopColor="#ff801a"/><stop offset="1" stopColor="#b952e2"/></linearGradient><linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#5c24a3" stopOpacity=".23"/><stop offset="1" stopColor="#07122c" stopOpacity="0"/></linearGradient></defs><path d="M0 714 C300 875 450 930 650 868 C870 799 1035 1000 1260 847 C1420 737 1520 732 1600 747 L1600 900 L0 900Z" fill={`url(#${id}-fill)`}/><path d="M0 714 C300 875 450 930 650 868 C870 799 1035 1000 1260 847 C1420 737 1520 732 1600 747" fill="none" stroke={`url(#${id}-wave)`} strokeWidth="1.4"/><path d="M0 0 L220 0 C90 30 20 64 0 104Z" fill="#f97316" opacity=".09"/><path d="M0 104 Q55 40 220 0" stroke="#ff9a3a" strokeWidth="1.2" fill="none" opacity=".6"/></svg>
  <figcaption>Illustrative technology visual · no live customer data</figcaption>
  <button className={styles.motion} type="button" disabled={reduced} aria-pressed={paused||reduced} aria-label={reduced?'Reduced motion enabled':paused?'Resume electron background animation':'Pause electron background animation'} onClick={()=>setPaused(!paused)}>{paused||reduced?<Play size={12} aria-hidden="true"/>:<Pause size={12} aria-hidden="true"/>}{reduced?'Reduced motion':paused?'Resume motion':'Pause motion'}</button>
 </figure>;
}
