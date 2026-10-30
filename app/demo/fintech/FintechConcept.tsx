"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageHero from "../../components/PageHero";

/* MonePay — code-only fintech concept. No images, icon libraries, or sliders. */
const services = [
  { symbol: "↗", name: "Send Money", display: "Instant Transfer", desc: "Send money in seconds", tone: "mint" },
  { symbol: "▦", name: "Scan & Pay", display: "Scan to Pay", desc: "Fast QR checkout", tone: "blue" },
  { symbol: "✳", name: "Save & Invest", display: "Savings Goals", desc: "Save with purpose", tone: "mint" },
  { symbol: "✦", name: "Grow Wealth", display: "Grow Wealth", desc: "Explore investments", tone: "peach" },
  { symbol: "₦", name: "Loans", display: "Flexible Loans", desc: "Preview repayments", tone: "lavender" },
  { symbol: "▥", name: "Business", display: "Merchant Payments", desc: "Manage your business", tone: "blue" },
  { symbol: "▤", name: "Pay Bills", display: "Pay Bills", desc: "Utilities and services", tone: "lavender" },
  { symbol: "◉", name: "Airtime & Data", display: "Airtime & Data", desc: "Top up in a tap", tone: "peach" },
];

type Transaction = { title: string; detail: string; amount: number };
const initialTransactions: Transaction[] = [
  { title: "Salary payment", detail: "Today · 9:42 AM", amount: 350000 },
  { title: "Coffee & Co.", detail: "Yesterday · 11:20 AM", amount: -12500 },
  { title: "Transfer to Ada", detail: "Monday · 2:18 PM", amount: -75000 },
];
const money = (n: number) => `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function MonePayBrand({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return <span className={`inline-flex items-center ${compact ? "gap-1.5" : "gap-3"}`}>
    <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" className={compact ? "h-5 w-5 shrink-0" : "h-10 w-10 shrink-0"}>
      <rect x="4" y="13" width="37" height="29" rx="7" fill="#52F0B9" />
      <path d="M10 13V9.5C10 7.3 11.5 5.5 13.8 5L34.5 1.8C37 1.4 39 3.3 39 5.7V13" stroke="#52F0B9" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 22H43V34H28C24.7 34 22 31.3 22 28S24.7 22 28 22Z" fill="#0B8B69" />
      <circle cx="30" cy="28" r="2.6" fill="#D3FFF0" />
    </svg>
    <span className={`${compact ? "text-[16px]" : "text-[29px] sm:text-[32px]"} font-black leading-none tracking-[-.065em] ${light ? "text-white" : "text-[#073c30]"}`} style={{fontFamily:'"Arial Rounded MT Bold", "Nunito Sans", "Arial", sans-serif'}}>
      Mone<span className="text-[#47E5AE]">Pay</span>
    </span>
  </span>;
}

function Logo({ light = false }: { light?: boolean }) {
  return <a href="#top" className="inline-flex items-center" aria-label="MonePay home"><MonePayBrand light={light}/></a>;
}

function AppPhone({ compact = false, balance, transactions, onAction }: { compact?: boolean; balance: number; transactions: Transaction[]; onAction: (name: string) => void }) {
  return <div className={`relative shrink-0 rounded-[37px] border-[7px] border-[#182524] bg-[#182524] p-[3px] shadow-[0_35px_65px_-18px_rgba(0,0,0,.45)] ${compact ? "w-[222px] rotate-[9deg] sm:w-[246px]" : "w-[246px] -rotate-[8deg] sm:w-[270px]"}`}>
    <div className="relative overflow-hidden rounded-[28px] bg-[#f7faf9] text-[#123b32]">
      <div className="absolute left-1/2 top-2 z-10 h-4 w-[77px] -translate-x-1/2 rounded-full bg-[#14211e]" />
      <div className="flex justify-between bg-white px-5 pb-3 pt-7 text-[9px] font-extrabold"><span>9:41</span><span>● ▰ ▰</span></div>
      <div className="flex items-center justify-between bg-white px-4 pb-4"><MonePayBrand compact/><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold">MP</span></div>
      <div className="px-3 pt-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#0d8665] via-[#07654f] to-[#034a3e] p-4 text-white shadow-lg shadow-emerald-950/10">
          <div className="flex justify-between text-[10px] text-emerald-100"><span>Available balance</span><span>◉</span></div>
          <p className="mt-2 text-[22px] font-black tracking-[-.055em]">{money(balance)}</p>
          <p className="mt-1 text-[9px] text-emerald-100">MonePay personal wallet</p>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {services.slice(0, 4).map((item) => <button type="button" key={item.name} onClick={() => onAction(item.name)} className="flex flex-col items-center gap-1.5 rounded-xl bg-white py-2.5 text-center shadow-sm hover:bg-emerald-50"><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-100 text-[16px] font-bold text-emerald-700">{item.symbol}</span><span className="text-[8px] font-bold leading-tight">{item.name === "Send Money" ? "Send" : item.name === "Scan & Pay" ? "Scan" : item.name === "Save & Invest" ? "Save" : "Invest"}</span></button>)}
        </div>
        <div className="mt-4 rounded-xl bg-[#e5f8ee] p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-black">Your savings goal</span><span className="text-[9px] font-bold text-emerald-700">70%</span></div><div className="mt-2 h-1.5 rounded-full bg-white"><div className="h-full w-[70%] rounded-full bg-[#12b981]" /></div><p className="mt-2 text-[9px] text-slate-600">₦700,000 of ₦1,000,000</p></div>
        <div className="mt-4 flex justify-between text-[10px] font-bold"><span>Recent activity</span><span className="text-emerald-600">See all</span></div>
        <div className="mt-2 space-y-2 pb-3">{transactions.slice(0, 3).map((tx, i) => <div key={`${tx.title}-${i}`} className="flex items-center gap-2 rounded-lg bg-white p-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e8f8f0] text-xs text-emerald-700">{tx.amount < 0 ? "↗" : "↙"}</span><span className="min-w-0 flex-1"><span className="block truncate text-[9px] font-bold">{tx.title}</span><span className="block text-[8px] text-slate-400">{tx.detail}</span></span><span className={`text-[9px] font-extrabold ${tx.amount < 0 ? "text-slate-800" : "text-emerald-600"}`}>{tx.amount < 0 ? "−" : "+"}{money(tx.amount).replace(".00", "")}</span></div>)}</div>
      </div>
      <div className="flex justify-around border-t border-slate-100 bg-white py-3 text-[9px] font-bold text-slate-500"><span className="text-emerald-700">⌂ Home</span><span>▣ Cards</span><span>▦ Pay</span><span>☰ More</span></div>
      <div className="mx-auto mb-2 h-1 w-20 rounded-full bg-slate-800" />
    </div>
  </div>;
}

function PayPhone({ onAction }: { onAction: (name: string) => void }) {
  return <div className="w-[220px] rotate-[8deg] rounded-[37px] border-[7px] border-[#182524] bg-[#182524] p-[3px] shadow-[0_35px_65px_-18px_rgba(0,0,0,.4)] sm:w-[245px]">
    <div className="relative overflow-hidden rounded-[28px] bg-[#f7faf9] text-[#123b32]">
      <div className="absolute left-1/2 top-2 h-4 w-[77px] -translate-x-1/2 rounded-full bg-[#14211e]" />
      <div className="flex justify-between bg-white px-5 pb-4 pt-7 text-[9px] font-extrabold"><span>9:41</span><span>● ▰ ▰</span></div>
      <div className="bg-white px-4 pb-4"><MonePayBrand compact/></div>
      <div className="px-4 py-5"><div className="text-center"><span className="inline-grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">✓</span><p className="mt-3 text-[11px] font-bold text-emerald-700">Payment successful</p><p className="mt-2 text-[26px] font-black tracking-tight">₦25,000.00</p><p className="mt-2 text-[10px] text-slate-500">Paid to MonePay Demo Store</p></div>
        <div className="my-5 border-t border-dashed border-slate-200" />
        <div className="space-y-3 text-[10px]"><div className="flex justify-between"><span className="text-slate-500">Payment method</span><strong>Wallet</strong></div><div className="flex justify-between"><span className="text-slate-500">Status</span><strong className="text-emerald-600">Completed</strong></div><div className="flex justify-between"><span className="text-slate-500">Reference</span><strong>MP-DEMO-2026</strong></div></div>
        <button type="button" onClick={() => onAction("Scan & Pay")} className="mt-7 w-full rounded-xl bg-emerald-600 py-3 text-[11px] font-bold text-white hover:bg-emerald-700">Try a demo payment</button>
        <p className="mt-4 text-center text-[9px] text-slate-400">Illustrative transaction · No real money</p>
      </div>
      <div className="flex justify-around border-t border-slate-100 bg-white py-3 text-[9px] font-bold text-slate-500"><span>⌂ Home</span><span className="text-emerald-700">▦ Pay</span><span>▣ Cards</span><span>☰ More</span></div><div className="mx-auto mb-2 h-1 w-20 rounded-full bg-slate-800" />
    </div>
  </div>;
}

export default function MonePayDemo() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePhone, setActivePhone] = useState<"wallet" | "payment" | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!action) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setAction(null); }
      if (event.key !== "Tab") return;
      const items = focusable(); const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previousOverflow; opener?.focus(); };
  }, [action]);
  const [amount, setAmount] = useState("25000");
  const [recipient, setRecipient] = useState("MonePay Demo Store");
  const [balance, setBalance] = useState(2450000);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [notice, setNotice] = useState("");
  const [savings, setSavings] = useState(700000);
  const [loanTenor, setLoanTenor] = useState("6");
  const [provider, setProvider] = useState("Electricity");
  const [demoTab, setDemoTab] = useState("overview");
  const openAction = (name: string) => {
    setAction(name);
    setNotice("");
    setDemoTab("overview");
    setAmount(name === "Send Money" ? "15000" : name === "Loans" ? "500000" : name === "Save & Invest" ? "50000" : name === "Airtime & Data" ? "2000" : "25000");
    setRecipient(name === "Send Money" ? "Jude Nwabueze" : name === "Airtime & Data" ? "08012345678" : "MonePay Demo Store");
  };
  const confirm = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || n > balance || !Number.isInteger(n)) {
      setNotice("Enter a whole-naira amount greater than zero and within the demo wallet balance.");
      return;
    }
    if ((action === "Send Money" || action === "Airtime & Data") && !recipient.trim()) {
      setNotice("Enter a recipient or phone number to continue.");
      return;
    }
    setBalance((old) => old - n);
    if (action === "Save & Invest") setSavings((old) => old + n);
    const label = action === "Save & Invest" ? "Savings contribution" : action === "Send Money" ? `Transfer to ${recipient.trim()}` : action === "Pay Bills" ? `${provider} bill` : action === "Airtime & Data" ? `Airtime for ${recipient.trim()}` : `Payment to ${action === "Business" ? "MonePay Demo Merchant" : recipient.trim()}`;
    setTransactions((old) => [{ title: label, detail: "Just now · Simulated", amount: -n }, ...old]);
    setNotice(`Successful demo: ${money(n)}. No real money was moved.`);
  };
  const loanAmount = Number(amount);
  const months = Number(loanTenor);
  const validLoan = Number.isFinite(loanAmount) && loanAmount >= 10000 && loanAmount <= 1000000 && Number.isInteger(loanAmount);
  const loanTotal = validLoan ? loanAmount * (1 + 0.12 * months / 12) : 0;

  return <main id="main-content" className="corporate-page demo-page min-h-screen bg-white text-[#0b3028]" style={{fontFamily:'var(--font-inter), "Segoe UI", Arial, sans-serif'}}>
    <span id="top" />
    <style>{`
      .mp-float{display:flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid rgba(145,255,212,.32);border-radius:999px;background:rgba(8,85,67,.82);box-shadow:0 12px 30px rgba(0,24,19,.24),inset 0 1px 0 rgba(255,255,255,.1);backdrop-filter:blur(10px);color:#e9fff6;font-size:10px;font-weight:750;white-space:nowrap;letter-spacing:.01em;animation:mp-hover 5s ease-in-out infinite;will-change:transform}
      .mp-token-icon{display:grid;place-items:center;width:25px;height:25px;flex:none;border-radius:50%;background:#5ce7b6;color:#064638;font-size:14px;font-weight:900}
      .mp-float-2{animation-delay:-1.5s}.mp-float-3{animation-delay:-2.8s}.mp-float-4{animation-delay:-.7s}.mp-float-5{animation-delay:-3.5s}.mp-float-6{animation-delay:-2.1s}
      @keyframes mp-hover{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-11px,0)}}
      @media(max-width:639px){.mp-float{font-size:9px;padding:5px 7px;gap:4px}.mp-token-icon{width:20px;height:20px;font-size:12px}.mp-float-3,.mp-float-4{display:none}}
      @media(prefers-reduced-motion:reduce){.mp-float{animation:none}}
    `}</style>
    <div className="bg-[#073f33] text-white">
      <header className="mx-auto flex max-w-[1260px] items-center justify-between px-5 py-6 sm:px-8">
        <Logo light />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-emerald-50/85 md:flex"><a href="#features" className="hover:text-white">Personal</a><a href="#business" className="hover:text-white">Business</a><a href="#features" className="hover:text-white">Features</a><a href="#about" className="hover:text-white">About</a></nav>
        <div className="flex items-center gap-3"><a href="#explore" className="hidden rounded-full bg-[#47e3b0] px-6 py-3 text-sm font-bold text-[#063d30] transition hover:bg-[#77f6cc] sm:inline-flex">Explore Demo ↗</a><button type="button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="rounded-lg border border-white/20 px-3 py-2 text-lg md:hidden">☰</button></div>
      </header>
      {menuOpen && <nav className="flex flex-col gap-4 border-t border-white/10 px-6 py-5 text-sm font-semibold md:hidden"><a href="#features" onClick={() => setMenuOpen(false)}>Personal</a><a href="#business" onClick={() => setMenuOpen(false)}>Business</a><a href="#about" onClick={() => setMenuOpen(false)}>About</a><a href="#explore" onClick={() => setMenuOpen(false)}>Explore Demo</a></nav>}
      <PageHero compact eyebrow="Modern money, made simple · Illustrative fintech concept" backgroundVisual="fintech"
        title={<>One app.<br />Every money possibility.</>}
        description="Send, spend, save and grow — with a financial experience designed around your everyday life."
        cta={[{href:"#explore",label:"Explore MonePay ↗"},{href:"#features",label:"See how it works",secondary:true}]}
      >
        <p>✓ Built for everyday payments · ✓ Simple by design</p>
      </PageHero>
      <section aria-label="Interactive wallet demonstration" className="relative mx-auto max-w-[1260px] overflow-hidden px-5 pb-10 sm:px-8">
        <div className="relative flex min-h-[550px] items-center justify-center sm:min-h-[605px]">
          <div className="pointer-events-none absolute h-[390px] w-[390px] rounded-full bg-[#0b8064]/50 blur-3xl sm:h-[490px] sm:w-[490px]" />
          <div className="pointer-events-none absolute h-[450px] w-[450px] rounded-full border border-emerald-300/10 sm:h-[570px] sm:w-[570px]" />
          <div role="group" aria-label="Illustrative wallet phone" onPointerDown={() => setActivePhone("wallet")} onFocusCapture={() => setActivePhone("wallet")} style={{ zIndex: activePhone === "wallet" ? 40 : 10 }} className="absolute left-[calc(50%-165px)] top-[75px] z-10 sm:left-[calc(50%-205px)] sm:top-[55px]"><AppPhone balance={balance} transactions={transactions} onAction={openAction}/></div>
          <div role="group" aria-label="Illustrative payment phone" onPointerDown={() => setActivePhone("payment")} onFocusCapture={() => setActivePhone("payment")} style={{ zIndex: activePhone === "payment" ? 40 : 20 }} className="absolute left-[calc(50%-15px)] top-[125px] z-20 sm:left-[calc(50%+10px)] sm:top-[112px]"><PayPhone onAction={openAction}/></div>
          {/* Floating feature tokens: independent CSS animation, no slider or image assets. */}
          <div aria-label="MonePay features" className="pointer-events-none absolute inset-0 z-30">
            <div className="mp-float mp-float-1 absolute left-[1%] top-[12%] sm:left-[3%] sm:top-[13%]">
              <span className="mp-token-icon">▦</span><span>Scan to Pay</span>
            </div>
            <div className="mp-float mp-float-2 absolute right-[0%] top-[7%] sm:right-[1%] sm:top-[8%]">
              <span className="mp-token-icon">↗</span><span>Instant Transfer</span>
            </div>
            <div className="mp-float mp-float-3 absolute left-[0%] top-[47%] sm:left-[0%] sm:top-[45%]">
              <span className="mp-token-icon">✦</span><span>Grow Wealth</span>
            </div>
            <div className="mp-float mp-float-4 absolute right-[0%] top-[43%] sm:right-[0%] sm:top-[44%]">
              <span className="mp-token-icon">◉</span><span>Savings</span>
            </div>
            <div className="mp-float mp-float-5 absolute left-[3%] bottom-[12%] sm:left-[3%] sm:bottom-[13%]">
              <span className="mp-token-icon">₦</span><span>Loans</span>
            </div>
            <div className="mp-float mp-float-6 absolute right-[0%] bottom-[9%] sm:right-[0%] sm:bottom-[13%]">
              <span className="mp-token-icon">▥</span><span>Merchant Payments</span>
            </div>
          </div>
          <div className="absolute bottom-7 left-[18%] z-30 hidden rounded-2xl border border-white/10 bg-[#0d6b53]/95 px-4 py-3 shadow-2xl backdrop-blur sm:bottom-12 sm:left-[20%] lg:block"><p className="text-[10px] text-emerald-100">One app. More possibilities.</p><p className="mt-1 text-sm font-extrabold">MonePay Concept</p></div>
        </div>
      </section>
    </div>

    <section id="explore" className="relative z-10 mx-auto max-w-[1260px] px-5 py-16 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-600">Explore MonePay</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Everything you need, in one place.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Explore our interactive concept and see how everyday money management could feel.</p></div>
             <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
         {services.map((item, index) => <button type="button" key={item.name} onClick={() => openAction(item.name)} className="group flex min-h-[174px] flex-col items-start justify-between rounded-[24px] border border-[#e6efeb] bg-[#f7faf9] p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-[0_18px_35px_-20px_rgba(4,76,54,.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:min-h-[190px] sm:p-6">
           <span className="flex w-full items-start justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl font-extrabold ${index % 4 === 0 ? "bg-[#d6f8e9] text-[#067757]" : index % 4 === 1 ? "bg-[#dfeaff] text-[#2758c8]" : index % 4 === 2 ? "bg-[#f2e8ff] text-[#7346ba]" : "bg-[#fff0df] text-[#b95a21]"}`}>{item.symbol}</span><span className="text-lg text-emerald-600 transition-transform group-hover:translate-x-1">↗</span></span>
           <span className="mt-6"><strong className="block text-[16px] font-extrabold tracking-[-.03em] sm:text-[18px]">{item.display}</strong><small className="mt-1 block text-[12px] leading-5 text-slate-500">{item.desc}</small></span>
         </button>)}
       </div>
    </section>

    <section id="features" className="bg-[#f4f9f7] py-20"><div className="mx-auto max-w-[1260px] px-5 sm:px-8"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-600">Designed around you</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Simple tools. More control.</h2><p className="mt-4 text-sm leading-7 text-slate-500">A thoughtful concept for payments, saving, borrowing and managing a growing business.</p></div>
      <div className="mt-10 grid gap-5 md:grid-cols-3"><article className="rounded-[28px] bg-white p-7 shadow-sm"><span className="text-3xl text-emerald-600">↗</span><h3 className="mt-5 text-xl font-bold">Payments that flow</h3><p className="mt-3 text-sm leading-7 text-slate-500">Send money, pay bills and make merchant payments through a clean, intuitive interface.</p><button type="button" onClick={() => openAction("Scan & Pay")} className="mt-6 text-sm font-bold text-emerald-700">Try demo payments →</button></article><article className="rounded-[28px] bg-white p-7 shadow-sm"><span className="text-3xl text-emerald-600">✳</span><h3 className="mt-5 text-xl font-bold">Savings with purpose</h3><p className="mt-3 text-sm leading-7 text-slate-500">Visualize savings goals, track progress and explore future possibilities.</p><button type="button" onClick={() => openAction("Save & Invest")} className="mt-6 text-sm font-bold text-emerald-700">Explore savings →</button></article><article id="business" className="rounded-[28px] bg-white p-7 shadow-sm"><span className="text-3xl text-emerald-600">▥</span><h3 className="mt-5 text-xl font-bold">Made for businesses</h3><p className="mt-3 text-sm leading-7 text-slate-500">A simple concept for merchant checkout, payment records and business tools.</p><button type="button" onClick={() => openAction("Business")} className="mt-6 text-sm font-bold text-emerald-700">Explore business →</button></article></div>
    </div></section>

    <section id="about" className="mx-auto flex max-w-[1260px] flex-col items-start justify-between gap-8 px-5 py-20 sm:px-8 md:flex-row md:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-600">Powered by Monetcore</p><h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-[-.05em] sm:text-4xl">Your next fintech idea starts here.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">MonePay demonstrates how a polished financial product could look and feel. Built as a concept by Monetcore System Solutions.</p></div><div className="w-full md:max-w-sm"><h3 className="text-lg font-bold">Interested in this solution?</h3><div className="mt-4 flex flex-wrap gap-3"><Link href="/contact?interest=service%3Asoftware-development#consultation" className="rounded-full bg-[#087657] px-6 py-4 text-sm font-bold text-white hover:bg-[#075f49]">Request This Solution</Link><Link href="/book?interest=service%3Asoftware-development" className="rounded-full border border-emerald-700 px-6 py-4 text-sm font-bold text-emerald-800 hover:bg-emerald-50">Book a Consultation</Link></div></div></section>
    <div className="bg-[#062e26] px-5 py-9 text-white"><div className="mx-auto flex max-w-[1260px] flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><Logo light/><p className="max-w-xl text-xs leading-6 text-[#a5c8bd]">MonePay is a fictional demonstration by Monetcore System Solutions. It does not provide banking, lending, payment processing, or investment services. All balances and transactions are simulated.</p></div></div>

         {action && <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-[#041c17]/75 p-3 backdrop-blur-sm sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) setAction(null); }}>
       <section ref={dialog} role="dialog" aria-modal="true" aria-label={`${action} demonstration`} className="max-h-[92dvh] w-full max-w-[490px] overflow-y-auto rounded-[28px] bg-white p-5 text-[#0b3028] shadow-2xl sm:p-8">
         <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-emerald-600">MonePay · Interactive concept</span><button type="button" aria-label="Close dialog" onClick={() => setAction(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xl hover:bg-slate-200">×</button></div>
         <h2 className="mt-4 text-2xl font-extrabold tracking-tight">{services.find((item) => item.name === action)?.display ?? action}</h2>
         <p className="mt-2 text-sm leading-6 text-slate-500">{services.find((item) => item.name === action)?.desc}. Experience this feature using simulated data.</p>
         <div className="mt-5 rounded-2xl bg-[#073f33] p-4 text-white">
           <div className="flex items-center justify-between"><span className="text-xs text-emerald-100">Demo wallet</span><span className="rounded-full bg-white/10 px-2 py-1 text-[10px]">SIMULATED</span></div>
           <p className="mt-2 text-[27px] font-extrabold tracking-tight">{money(balance)}</p>
           <p className="mt-1 text-[11px] text-emerald-200">No bank account or real funds required</p>
         </div>
         {action === "Scan & Pay" && <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f7faf9] p-5 text-center">
           <div className="mx-auto grid h-[136px] w-[136px] grid-cols-11 gap-[2px] rounded-lg bg-white p-2 shadow-sm" role="img" aria-label="Decorative example of a QR payment code, not a scannable code">
             {Array.from({length:121},(_,i)=>{const r=Math.floor(i/11),c=i%11;const corner=(r<4&&c<4)||(r<4&&c>6)||(r>6&&c<4);const border=corner&&((r%7===0||r%7===3)||(c%7===0||c%7===3));const center=corner&&r%7===1&&c%7===1;return <span key={i} className={`rounded-[1px] ${(border||center||(!corner&&((r*13+c*7+r*c)%5<2)))?"bg-[#07513f]":"bg-white"}`} />;})}
           </div>
           <p className="mt-3 text-sm font-bold">MonePay Demo Store</p><p className="mt-1 text-xs text-slate-500">Illustrative QR only · not scannable</p>
         </div>}
         {action === "Save & Invest" && <div className="mt-5 rounded-2xl bg-[#e9f9f0] p-5"><div className="flex justify-between text-sm font-bold"><span>Your savings goal</span><span>{Math.min(100,Math.round(savings/1000000*100))}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{width:`${Math.min(100,savings/1000000*100)}%`}}/></div><p className="mt-3 text-sm text-slate-600">{money(savings)} saved toward {money(1000000)}</p></div>}
         {action === "Grow Wealth" && <div className="mt-5 space-y-4"><div className="grid grid-cols-3 gap-2">{["Funds","Stocks","Bonds"].map((tab)=><button type="button" key={tab} aria-pressed={demoTab===tab} onClick={()=>setDemoTab(tab)} className={`rounded-xl px-2 py-3 text-xs font-bold ${demoTab===tab?"bg-emerald-600 text-white":"bg-emerald-50 text-emerald-800"}`}>{tab}</button>)}</div><div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Investment explorer</p><p className="mt-2 text-xl font-extrabold">{demoTab === "overview" ? "Choose a category" : demoTab}</p><p className="mt-3 text-sm leading-6 text-slate-500">Explore how investment options could be presented, with risk information and portfolio tracking. This prototype does not offer or recommend investments.</p><div className="mt-4 flex h-20 items-end gap-2">{[38,55,47,68,52,75,62,88,74,94].map((v,i)=><span key={i} className="flex-1 rounded-t bg-emerald-200" style={{height:`${v}%`}}/>)}</div><p className="mt-2 text-[10px] text-slate-400">Illustrative graphic, not performance data</p></div></div>}
         {action === "Loans" && <div className="mt-5 space-y-4"><label className="block text-xs font-bold">Illustrative loan amount (NGN)<input type="number" min="10000" max="1000000" step="1000" value={amount} onChange={(e)=>setAmount(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"/></label><label className="block text-xs font-bold">Repayment period<select value={loanTenor} onChange={(e)=>setLoanTenor(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option></select></label><div className="rounded-2xl bg-emerald-50 p-5"><p className="text-xs text-slate-600">Estimated monthly repayment</p><p className="mt-2 text-2xl font-extrabold">{validLoan?money(loanTotal/months):"Enter ₦10,000–₦1,000,000"}</p><p className="mt-2 text-xs text-slate-500">Example calculation only: 12% annual simple interest, no fees. Not a loan offer, eligibility check or application.</p></div></div>}
         {action === "Business" && <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f7faf9] p-5"><div className="flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase text-emerald-700">Merchant checkout</p><h3 className="mt-1 text-lg font-extrabold">MonePay Demo Merchant</h3></div><span className="rounded-xl bg-emerald-100 px-3 py-2 text-lg">▥</span></div><p className="mt-3 text-xs leading-5 text-slate-500">Preview a customer checkout. A successful simulation will update the demo wallet and transaction history.</p></div>}
         {action === "Pay Bills" && <div className="mt-5"><label className="block text-xs font-bold">Bill category<select value={provider} onChange={(e)=>setProvider(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option>Electricity</option><option>Internet</option><option>TV Subscription</option><option>Water</option></select></label></div>}
         {(action === "Send Money" || action === "Airtime & Data") && <label className="mt-5 block text-xs font-bold">{action === "Send Money" ? "Recipient name" : "Phone number"}<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" value={recipient} onChange={(e)=>setRecipient(e.target.value)}/></label>}
         {["Scan & Pay","Send Money","Save & Invest","Business","Pay Bills","Airtime & Data"].includes(action) && <div className="mt-5 space-y-4"><label className="block text-xs font-bold">{action === "Save & Invest" ? "Add to savings (NGN)" : "Amount (NGN)"}<input type="number" min="1" step="1" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" value={amount} onChange={(e)=>setAmount(e.target.value)}/></label><button type="button" onClick={confirm} disabled={notice.startsWith("Successful demo:")} className="w-full rounded-xl bg-emerald-600 px-4 py-4 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{action === "Save & Invest" ? "Add simulated savings" : action === "Send Money" ? "Confirm demo transfer" : "Confirm demo payment"}</button></div>}
         {notice && <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${notice.startsWith("Successful demo:") ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>{notice}</p>}
         <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">Fictional prototype by Monetcore. No real financial services or transactions.</p>
       </section>
     </div>}
  </main>;
}
