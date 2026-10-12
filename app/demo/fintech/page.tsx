

"use client";

import Image from "next/image";

import Link from "next/link";

import { useState } from "react";

import { ArrowUpRight, Menu, X, Send, ReceiptText, Smartphone, PiggyBank, HandCoins, Store, Wallet, CreditCard, Sparkles, ShieldCheck, CheckCircle2, ArrowRight, TrendingUp, Landmark, ArrowDownLeft, Eye, EyeOff, BadgeCheck, CalendarDays, Target } from "lucide-react";

type Service = "wallet" | "payments" | "loans" | "savings";

type Transaction = {

  name: string;

  amount: number;

  type: string;

};

const initialTransactions: Transaction[] = [

  { name: "Client Payment", amount: 250000, type: "Credit" },

  { name: "Transfer to Ada", amount: -75000, type: "Transfer" },

  { name: "Electricity Bill", amount: -18500, type: "Bill Payment" },

];

const serviceCards = [

  {

    id: "wallet" as Service,

    Icon: Send,

    name: "Digital Wallet",

    detail: "Transfers, balances and everyday payments.",

    color: "bg-emerald-100 text-emerald-700",

  },

  {

    id: "payments" as Service,

    Icon: CreditCard,

    name: "Merchant Payments",

    detail: "Payment requests, checkout and invoices.",

    color: "bg-blue-100 text-blue-700",

  },

  {

    id: "loans" as Service,

    Icon: HandCoins,

    name: "Loans",

    detail: "Loan applications and repayment plans.",

    color: "bg-orange-100 text-orange-700",

  },

  {

    id: "savings" as Service,

    Icon: PiggyBank,

    name: "Savings & Investment",

    detail: "Savings goals and portfolio concepts.",

    color: "bg-purple-100 text-purple-700",

  },

];

const shortcuts = [

  { label: "Send Money", Icon: Send, service: "wallet" as Service, color: "bg-emerald-100 text-emerald-700" },

  { label: "Pay Bills", Icon: ReceiptText, service: "wallet" as Service, color: "bg-indigo-100 text-indigo-700" },

  { label: "Airtime & Data", Icon: Smartphone, service: "wallet" as Service, color: "bg-blue-100 text-blue-700" },

  { label: "Save & Invest", Icon: PiggyBank, service: "savings" as Service, color: "bg-teal-100 text-teal-700" },

  { label: "Access Loans", Icon: HandCoins, service: "loans" as Service, color: "bg-orange-100 text-orange-700" },

  { label: "Business Payments", Icon: Store, service: "payments" as Service, color: "bg-violet-100 text-violet-700" },

];

function money(amount: number) {

  return new Intl.NumberFormat("en-NG", {

    style: "currency",

    currency: "NGN",

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  }).format(amount);

}

export default function MonePayDemo() {

  const [service, setService] = useState<Service>("wallet");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [balance, setBalance] = useState(2450000);
  const [showBalance, setShowBalance] = useState(true);

  const [amount, setAmount] = useState("");

  const [recipient, setRecipient] = useState("");

  const [notice, setNotice] = useState("");

  const [transactions, setTransactions] =

    useState<Transaction[]>(initialTransactions);

  function selectService(next: Service) {

    setService(next);

    setAmount("");

    setRecipient("");

    setNotice("");

    document.getElementById("demo")?.scrollIntoView({

      behavior: "smooth",

    });

  }

  function simulate() {

    const value = Number(amount);

    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {

      setNotice("Please enter a valid amount.");

      return;

    }

    if (value > 1000000 || Math.abs(Math.round(value * 100) - value * 100) > 0.000001) {

      setNotice("Enter an amount up to ₦1,000,000 with at most two decimal places.");

      return;

    }

    if (service === "wallet") {

      if (!recipient.trim()) {

        setNotice("Please enter a demo recipient name.");

        return;

      }

      if (value > balance) {

        setNotice("Insufficient demo balance.");

        return;

      }

      setBalance((current) => Math.round((current - value) * 100) / 100);

      setTransactions((current) => [

        {

          name: `Transfer to ${recipient.trim()}`,

          amount: -value,

          type: "Transfer",

        },

        ...current,

      ]);

    }

    const messages: Record<Service, string> = {

      wallet: "Demo transfer completed.",

      payments: "Demo payment request created.",

      loans: "Demo loan application submitted. No lending decision was made.",

      savings: "Demo savings goal created.",

    };

    setNotice(`${messages[service]} No real money was moved.`);

    setAmount("");

    setRecipient("");

  }

  return (

    <main className="min-h-screen bg-white text-slate-950">

      <div className="bg-emerald-950 px-4 py-2 text-center text-xs font-semibold text-white">

        MONEPAY CONCEPT BY MONETCORE — DEMONSTRATION ONLY — NO REAL FINANCIAL SERVICES

      </div>

      <header className="sticky top-0 z-50 border-b border-emerald-100/70 bg-white/90 shadow-sm shadow-emerald-950/5 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">

          <Link href="/demo/fintech" className="flex shrink-0 items-center gap-3">

            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 text-2xl font-black text-white shadow-lg shadow-emerald-200">

              M

            </span>

            <span className="text-2xl font-black tracking-tight text-slate-950">

              Mone<span className="text-emerald-600">Pay</span>

            </span>

          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex" aria-label="Main navigation">

            <a href="#features" className="transition hover:text-emerald-700">Personal</a>

            <a href="#solutions" className="transition hover:text-emerald-700">Business</a>

            <a href="#demo" className="transition hover:text-emerald-700">Explore Demo</a>

            <a href="#about" className="transition hover:text-emerald-700">About</a>

          </nav>

          <Link href="/#contact" className="hidden items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 lg:inline-flex">

            Build With Monetcore

            <ArrowUpRight className="h-4 w-4" />

          </Link>

          <button

            type="button"

            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}

            aria-expanded={mobileMenuOpen}

            aria-controls="monepay-mobile-menu"

            onClick={() => setMobileMenuOpen((open) => !open)}

            className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-800 lg:hidden"

          >

            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}

          </button>

        </div>

        {mobileMenuOpen && (

          <nav id="monepay-mobile-menu" aria-label="Mobile navigation" className="border-t border-emerald-100 bg-white px-5 pb-6 pt-3 shadow-xl lg:hidden">

            {[

              { label: "Personal", href: "#features" },

              { label: "Business", href: "#solutions" },

              { label: "Explore Demo", href: "#demo" },

              { label: "About", href: "#about" },

            ].map((item) => (

              <a

                key={item.href}

                href={item.href}

                onClick={() => setMobileMenuOpen(false)}

                className="block border-b border-slate-100 px-3 py-4 text-sm font-semibold text-slate-700 hover:text-emerald-700"

              >

                {item.label}

              </a>

            ))}

            <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white">

              Build With Monetcore

              <ArrowUpRight className="h-4 w-4" />

            </Link>

          </nav>

        )}

      </header>

              {/* PREMIUM HERO — approved image remains unchanged */}

        <section className="relative isolate overflow-hidden bg-[#f5fff9]">

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_28%,rgba(16,185,129,0.18),transparent_52%),radial-gradient(ellipse_at_12%_90%,rgba(110,231,183,0.16),transparent_46%)]" />

          <div className="pointer-events-none absolute -right-28 top-0 h-[540px] w-[540px] rounded-full border border-emerald-200/50" />

          <div className="pointer-events-none absolute -right-12 top-16 h-[410px] w-[410px] rounded-full border border-emerald-200/60" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-14 sm:px-8 lg:min-h-[670px] lg:grid-cols-[1fr_1.05fr] lg:gap-8 lg:pb-24 lg:pt-16">

            <div className="relative z-10">

              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/85 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-800 shadow-sm">

                <Sparkles className="h-4 w-4" /> Your financial world, reimagined

              </p>

              <h1 className="mt-8 max-w-2xl text-[clamp(2.8rem,5vw,5.1rem)] font-black leading-[1.05] tracking-[-0.055em] text-[#092b22]">

                Your money. <br />Your future. <br />

                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">One MonePay.</span>

              </h1>

              <p className="mt-7 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">

                An elegant way to explore payments, transfers, savings and business finance — all in one modern digital experience.

              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">

                <a href="#demo" className="inline-flex min-h-14 items-center gap-3 rounded-2xl bg-emerald-600 px-6 font-bold text-white shadow-[0_15px_35px_-12px_rgba(5,150,105,0.6)] transition hover:-translate-y-0.5 hover:bg-emerald-700">

                  Explore the Demo <ArrowRight className="h-5 w-5" />

                </a>

                <Link href="/#contact" className="inline-flex min-h-14 items-center gap-2 rounded-2xl border border-emerald-200 bg-white/90 px-6 font-bold text-emerald-950 shadow-sm transition hover:bg-white">

                  Build Your Fintech App <ArrowUpRight className="h-4 w-4" />

                </Link>

              </div>

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-emerald-900/80 sm:text-sm">

                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Intuitive design</span>

                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Security-minded concept</span>

              </div>

              <p className="mt-7 text-xs text-slate-500">A fictional fintech experience created by Monetcore System Solutions.</p>

            </div>

            <div className="relative mx-auto flex w-full max-w-[660px] items-center justify-center lg:min-h-[550px]">

              <div className="pointer-events-none absolute inset-5 rounded-full bg-emerald-300/25 blur-3xl" />

              <div className="relative w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/25 p-2 shadow-[0_32px_90px_-30px_rgba(6,78,59,0.25)] backdrop-blur-sm sm:p-3">

                <Image

                  src="/images/monepay-hero-woman-phone.png"

                  alt="Smiling woman holding a smartphone displaying the MonePay fintech app concept"

                  width={1100}

                  height={900}

                  priority

                  className="h-auto w-full rounded-[1.45rem] object-contain"

                />

              </div>

              <div className="absolute -bottom-5 left-0 z-10 flex items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md sm:-left-4 sm:bottom-7">

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span>

                <span><span className="block text-xs font-extrabold text-slate-900">Thoughtfully designed</span><span className="block text-[11px] text-slate-500">Modern fintech concept</span></span>

              </div>

              <div className="absolute -right-1 top-3 z-10 hidden items-center gap-2 rounded-2xl border border-white/90 bg-white/90 px-4 py-3 text-xs font-bold text-emerald-800 shadow-lg backdrop-blur sm:flex">

                <Sparkles className="h-4 w-4" /> One app. More possibilities.

              </div>

            </div>

          </div>

        </section>

{/* SIX SERVICE SHORTCUTS */}

      <section id="features" className="relative z-10 px-6">

        <div className="mx-auto -mt-4 grid max-w-7xl grid-cols-2 gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/60 sm:grid-cols-3 lg:-mt-8 lg:grid-cols-6 lg:p-7">

          {shortcuts.map((item) => (

            <button

              key={item.label}

              type="button"

              onClick={() => selectService(item.service)}

              className="group flex flex-col items-center rounded-2xl p-3 text-center transition hover:bg-emerald-50"

            >

              <span

                className={`flex h-14 w-14 items-center justify-center rounded-2xl transition group-hover:scale-110 ${item.color}`}

              >

                <item.Icon className="h-7 w-7" strokeWidth={1.9} />

              </span>

              <span className="mt-4 text-sm font-bold text-slate-900">

                {item.label}

              </span>

              <span className="mt-1 text-xs text-slate-500">

                Explore demo

              </span>

            </button>

          ))}

        </div>

      </section>

      {/* PRODUCT CARDS */}

      <section id="solutions" className="px-6 py-24">

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">

                More Than a Wallet

              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">

                Complete Financial Solutions in One App

              </h2>

            </div>

            <p className="max-w-xl text-lg leading-8 text-slate-600">

              From everyday transfers to business payments

              and long-term financial goals, explore how

              MonePay could bring financial services together.

            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {serviceCards.map((item) => (

              <button

                key={item.id}

                type="button"

                onClick={() => selectService(item.id)}

                className="group rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"

              >

                <div className="flex h-36 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-white">

                  <div className={`flex h-20 w-20 items-center justify-center rounded-3xl shadow-sm ${item.color}`}>

                    <item.Icon className="h-10 w-10" strokeWidth={1.7} />

                  </div>

                </div>

                <h3 className="mt-6 text-xl font-bold">

                  {item.name}

                </h3>

                <p className="mt-3 min-h-16 leading-7 text-slate-600">

                  {item.detail}

                </p>

                <p className="mt-5 font-bold text-emerald-700">

                  Explore Feature →

                </p>

              </button>

            ))}

          </div>

        </div>

      </section>

      {/* INTERACTIVE FINTECH DEMO */}
      <section id="demo" className="scroll-mt-24 bg-[#f2f8f5] px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700"><Sparkles className="h-4 w-4" /> Interactive product experience</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-[#092b22] sm:text-5xl">Your financial command center.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">Explore four financial workflows in one refined interface. All balances and transactions are fictional.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800"><ShieldCheck className="h-4 w-4" /> Interactive prototype · No real funds</span>
          </div>

          <div className="mt-10 overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_28px_85px_-40px_rgba(6,78,59,0.3)] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="bg-[#073c2d] px-5 py-7 text-white sm:px-7 lg:min-h-[780px]">
              <div className="flex items-center gap-3 border-b border-white/15 pb-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200"><Landmark className="h-6 w-6" /></span>
                <div><p className="text-lg font-black">MonePay</p><p className="text-xs text-emerald-200">Experience dashboard</p></div>
              </div>
              <p className="mb-3 mt-7 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-300">Your workspace</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {serviceCards.map((item) => (
                  <button key={item.id} type="button" onClick={() => {setService(item.id);setAmount("");setRecipient("");setNotice("");}}
                    aria-pressed={service === item.id}
                    className={`flex min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-left text-xs font-bold transition sm:text-sm ${service === item.id ? "bg-white text-emerald-950 shadow-lg" : "text-emerald-100 hover:bg-white/10"}`}>
                    <item.Icon className="h-5 w-5 shrink-0" /> <span>{item.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-10 hidden rounded-2xl border border-white/15 bg-white/10 p-5 lg:block">
                <ShieldCheck className="h-7 w-7 text-emerald-300" />
                <p className="mt-4 text-sm font-bold">Explore with confidence</p>
                <p className="mt-2 text-xs leading-6 text-emerald-100">This is a concept interface. It does not connect to a bank or move real money.</p>
              </div>
            </aside>

            <div className="min-w-0 bg-[#fbfdfc] p-4 sm:p-7 lg:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Overview / {serviceCards.find((item) => item.id === service)?.name}</p><h3 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Welcome to MonePay <span aria-hidden="true">✦</span></h3><p className="mt-2 text-sm text-slate-500">A smarter-looking way to explore digital finance.</p></div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm"><Sparkles className="h-6 w-6" /></span>
              </div>

              {service === "wallet" ? (
                <>
                  <div className="relative mt-8 overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-[#064e3b] via-[#087a58] to-[#10a678] p-6 text-white shadow-xl shadow-emerald-900/15 sm:p-8">
                    <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[40px] border-white/10" />
                    <div className="pointer-events-none absolute bottom-0 right-20 h-40 w-40 rounded-full bg-emerald-200/10 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-emerald-100">Available demo balance</p><p className="mt-4 break-all text-3xl font-black tracking-tight sm:text-4xl">{showBalance ? money(balance) : "₦ ••••••••"}</p></div><button type="button" onClick={() => setShowBalance((v) => !v)} aria-label={showBalance ? "Hide demo balance" : "Show demo balance"} className="rounded-xl bg-white/15 p-3 hover:bg-white/25">{showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}</button></div>
                    <div className="relative mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-5 text-xs text-emerald-100"><span className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" /> MonePay digital wallet</span><span className="rounded-full bg-white/15 px-3 py-1 font-bold">DEMO ACCOUNT</span></div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[{label:"Transfer",Icon:Send},{label:"Pay Bills",Icon:ReceiptText},{label:"Airtime",Icon:Smartphone},{label:"Savings",Icon:PiggyBank}].map((action) => (
                      <button key={action.label} type="button" onClick={() => {if(action.label === "Savings") {setService("savings");setAmount("");setRecipient("");setNotice("");} else {document.getElementById("monepay-demo-form")?.scrollIntoView({behavior:"smooth",block:"center"});}}} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:shadow-md"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><action.Icon className="h-6 w-6" /></span>{action.label}</button>
                    ))}
                  </div>
                </>
              ) : (
                <div className={`relative mt-8 overflow-hidden rounded-[1.7rem] p-7 text-white shadow-lg ${service === "payments" ? "bg-gradient-to-br from-blue-950 to-blue-600" : service === "loans" ? "bg-gradient-to-br from-orange-950 to-orange-600" : "bg-gradient-to-br from-violet-950 to-violet-600"}`}>
                  <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/10" />
                  <div className="relative flex items-start justify-between"><div><p className="text-sm font-semibold text-white/75">{service === "payments" ? "Merchant collection tools" : service === "loans" ? "Explore lending journeys" : "Grow toward your goals"}</p><h4 className="mt-3 text-2xl font-black sm:text-3xl">{service === "payments" ? "Accept payments, beautifully." : service === "loans" ? "Plan your next move." : "Save with a purpose."}</h4><p className="mt-3 max-w-md text-sm leading-6 text-white/80">{service === "payments" ? "Generate a fictional payment request to preview a merchant workflow." : service === "loans" ? "Try a sample loan application journey. No credit decision is made." : "Create an illustrative savings target. No deposit or investment is made."}</p></div>{service === "payments" ? <Store className="h-9 w-9 shrink-0 text-white/80" /> : service === "loans" ? <HandCoins className="h-9 w-9 shrink-0 text-white/80" /> : <PiggyBank className="h-9 w-9 shrink-0 text-white/80" />}</div>
                  <div className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold"><BadgeCheck className="h-4 w-4" /> Concept demonstration only</div>
                </div>
              )}

              <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.85fr)]">
                <div id="monepay-demo-form" className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">{service === "wallet" ? <Send className="h-5 w-5" /> : service === "payments" ? <CreditCard className="h-5 w-5" /> : service === "loans" ? <HandCoins className="h-5 w-5" /> : <Target className="h-5 w-5" />}</span><div><h4 className="font-extrabold text-slate-900">{service === "wallet" ? "Send a demo transfer" : service === "payments" ? "Create a payment request" : service === "loans" ? "Sample loan application" : "Create a savings goal"}</h4><p className="text-xs text-slate-500">Simulation · No real financial activity</p></div></div>
                  <div className="mt-6 space-y-4">
                    {service === "wallet" && <div><label htmlFor="recipient" className="mb-2 block text-sm font-bold text-slate-700">Recipient name</label><input id="recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="e.g. Ada Okafor" maxLength={60} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white" /></div>}
                    <div><label htmlFor="amount" className="mb-2 block text-sm font-bold text-slate-700">{service === "loans" ? "Requested loan amount (NGN)" : service === "savings" ? "Savings target (NGN)" : "Amount (NGN)"}</label><input id="amount" type="number" min="0.01" max="1000000" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white" /></div>
                    <button type="button" onClick={simulate} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"><ArrowRight className="h-5 w-5" />{service === "wallet" ? "Simulate Transfer" : service === "payments" ? "Create Demo Payment Request" : service === "loans" ? "Submit Demo Application" : "Create Demo Savings Goal"}</button>
                    {notice && <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium leading-6 text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />{notice}</p>}
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-3"><h4 className="font-extrabold text-slate-900">{service === "wallet" ? "Recent activity" : "At a glance"}</h4><span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Sample data</span></div>
                  {service === "wallet" ? <div className="mt-5 space-y-3">{transactions.slice(0,8).map((transaction,index) => <div key={`${transaction.name}-${index}`} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${transaction.amount >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>{transaction.amount >= 0 ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{transaction.name}</p><p className="text-xs text-slate-500">{transaction.type}</p></div></div><span className={`shrink-0 text-xs font-extrabold sm:text-sm ${transaction.amount >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{transaction.amount >= 0 ? "+" : "−"}{money(Math.abs(transaction.amount))}</span></div>)}</div> : <div className="mt-6 space-y-4">{(service === "payments" ? [{label:"Checkout experience",Icon:CreditCard},{label:"Merchant collections",Icon:Store},{label:"Payment requests",Icon:ReceiptText}] : service === "loans" ? [{label:"Application journey",Icon:HandCoins},{label:"Illustrative repayment",Icon:CalendarDays},{label:"No credit assessment",Icon:ShieldCheck}] : [{label:"Goal planning",Icon:Target},{label:"Savings milestones",Icon:TrendingUp},{label:"No real investments",Icon:ShieldCheck}]).map((item) => <div key={item.label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><span className="rounded-lg bg-white p-2 text-emerald-700"><item.Icon className="h-5 w-5" /></span><span className="text-sm font-semibold text-slate-700">{item.label}</span><CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" /></div>)}</div>}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-xs leading-6 text-slate-500">MonePay is a fictional product concept by Monetcore System Solutions. No banking, lending, payment processing or investment services are provided.</p>
        </div>
      </section>
      {/* FINAL CTA */}

      <section id="about" className="bg-emerald-950 px-6 py-20 text-white">

        <div className="mx-auto max-w-7xl text-center">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">

            Built by Monetcore System Solutions

          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black sm:text-5xl">

            Ready to Build Your Own Fintech Platform?

          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-emerald-100">

            Monetcore builds custom web applications, mobile

            experiences, SaaS platforms and financial technology

            software prototypes for ambitious businesses.

          </p>

          <Link

            href="/#contact"

            className="mt-9 inline-block rounded-xl bg-white px-8 py-4 font-bold text-emerald-950 transition hover:bg-emerald-50"

          >

            Discuss Your Project →

          </Link>

          <p className="mt-12 text-xs leading-6 text-emerald-200">

            MonePay is a fictional product demonstration.

            It is not a licensed bank, lender, payment service

            provider or investment company. No real transactions

            are processed.

          </p>

        </div>

      </section>

    </main>

  );

}
