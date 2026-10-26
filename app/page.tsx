import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Code2,
  Layers3,
  Workflow,
  Cpu,
  Globe2,
  PlugZap,
  Compass,
  Lightbulb,
  Expand,
  Sparkles,
  Building2,
  ArrowRight,
  MessageCircle,
  CalendarDays,
  Mail,
  Phone,
  CircleHelp,
  Megaphone,
  Smartphone,
} from "lucide-react";
import ContactForm from "./ContactForm";
import SolutionExplorer from "./components/SolutionExplorer";
import { ProjectPlanProvider } from "./components/ProjectPlanContext";
import ProjectWorkflow from "./components/ProjectWorkflow";
import CorporateFAQ from "./components/CorporateFAQ";
import SiteHeader from "./components/SiteHeader";
import AICore from "./components/AICore";
import { corporateSolutions } from "./config/corporateSolutions";
import {
  packagePrice,
  hybridPricing,
  renewalTerms,
  websitePackages,
} from "./config/websitePackages";

const starter = websitePackages[0];
const solutionIcons = [
  Cpu,
  Code2,
  Workflow,
  PlugZap,
  Globe2,
  Compass,
  Megaphone,
  Smartphone,
];
export const metadata: Metadata = {
  title: {
    absolute: "Monetcore System Solutions | Software, AI & Business Technology",
  },
  description:
    "Monetcore System Solutions develops custom software, AI automation, websites, applications and business integrations. Explore practical technology solutions for your business.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "Monetcore System Solutions | Build smarter. Automate faster. Grow further.",
    description:
      "Software, AI automation, digital products and technology consulting for businesses. Based in Abuja, Nigeria.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Monetcore System Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Monetcore System Solutions | Business Technology",
    description:
      "Custom software, AI automation, applications, websites and business integrations.",
    images: ["/og-image.png"],
  },
};
const primary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-800";
const secondary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100";
const faqs = [
  [
    "What can Monetcore help my business build?",
    "We work across custom software, websites, web and mobile applications, AI automation, sales workflows and business integrations. Start with the problem you want to solve; we will discuss a suitable scope and approach.",
  ],
  [
    "Are all the product showcases live services?",
    "No. Showcase interfaces illustrate possibilities. MonePay is a fictional interactive prototype, and the lead automation demo is hosted separately. Booking is an existing integration-dependent workflow. We confirm availability and scope before any engagement; unfinished or optional tools are not sold as fully operational services.",
  ],
  [
    "Do you also offer business websites?",
    `Yes. Smart Website Solutions offers ${starter.name}: ${packagePrice(starter)} (one-time package setup). Standard first-year domain and hosting are included. ${renewalTerms.included} ${renewalTerms.excluded} ${renewalTerms.limits} Confirm your requirements and written quotation; see the website packages page for renewal amounts and full conditions.`,
  ],
  [
    "How do we start a project?",
    "Send an enquiry or request a free consultation. We will discuss your goals, current systems and requirements before agreeing deliverables, pricing, third-party costs and a timeline.",
  ],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="corporate-page bg-white text-slate-950"
      >
        <section
          id="corporate-hero"
          className="relative overflow-hidden bg-[#f3f6fc] px-5 pb-20 pt-36 lg:px-8 lg:pb-24 lg:pt-44"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-52 top-0 h-[800px] w-[800px] rounded-full border-[110px] border-blue-100/60"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1fr_1fr]">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase leading-6 tracking-[0.16em] text-blue-800">
                Monetcore System Solutions · Business technology
              </p>
              <h1 className="mt-6 text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Build smarter.
                <br />
                <span className="text-blue-700">Automate faster.</span>
                <br />
                Grow further.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                We develop technology solutions for businesses. Custom software,
                AI automation, websites and digital applications — connected to
                the way your business works.
              </p>
              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                From a professional online presence to a connected business
                workflow, Monetcore brings software engineering and practical
                technology thinking to your next step.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#contact" className={primary}>
                  Start Your Project{" "}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
                <Link href="#services" className={secondary}>
                  Explore Our Solutions
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-700">
                {[
                  "Custom software",
                  "AI & automation",
                  "Web & mobile",
                  "Business integrations",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check
                      size={14}
                      aria-hidden="true"
                      className="text-blue-700"
                    />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="min-w-0">
              <AICore />
            </div>
          </div>
          <div className="company-snapshot relative mx-auto mt-14 grid max-w-7xl gap-4 sm:grid-cols-3">
            {[
              [
                "Established in 2016",
                "A company focused on useful technology.",
              ],
              [
                "Abuja, Nigeria",
                "Business technology with local understanding.",
              ],
              [
                "Built around your workflow",
                "Start with the problem. Shape the right solution.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <p className="text-lg font-bold">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="services" className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  What Monetcore does
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  Technology built around
                  <br />
                  business outcomes.
                </h2>
              </div>
              <p className="max-w-xl self-end leading-8 text-slate-600">
                We combine software development, artificial intelligence,
                automation and consulting to address practical challenges in
                operations, customer experience and growth. Your goals guide the
                technology. {hybridPricing.customDescription}
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {corporateSolutions.map((item) => (
                <Link
                  key={item.number}
                  href={item.href}
                  className="solution-card group"
                >
                  <span className="flex items-center justify-between text-sm font-bold text-blue-700">
                    <span className="solution-icon">
                      {(() => {
                        const Icon = solutionIcons[Number(item.number) - 1];
                        return (
                          <Icon
                            size={23}
                            strokeWidth={1.6}
                            aria-hidden="true"
                          />
                        );
                      })()}
                    </span>
                    <ArrowUpRight size={19} aria-hidden="true" />
                  </span>
                  <h3 className="mt-6 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="products"
          className="bg-slate-950 px-5 py-20 text-white lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Digital products & applications
                </p>
                <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight">
                  Focused solutions.
                  <br />
                  Part of a bigger picture.
                </h2>
              </div>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:underline"
              >
                Explore product information{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="corporate-product-card rounded-2xl border border-white/20 bg-white/5 p-7 sm:p-9">
                <Workflow
                  size={30}
                  aria-hidden="true"
                  className="text-blue-300"
                />
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-blue-200">
                  External demonstration
                </p>
                <h3 className="mt-3 text-2xl font-bold">AI Lead Automation</h3>
                <p className="mt-4 leading-7 text-slate-300">
                  Explore the concept of capturing enquiries, organising leads
                  and preparing AI-assisted follow-ups. Discuss the
                  configuration and integrations your business would need.
                </p>
                <div className="mt-7 flex flex-wrap gap-4">
                  <Link
                    href="/products/ai-lead-automation"
                    className="font-bold text-blue-200 hover:underline"
                  >
                    Product details →
                  </Link>
                  <a
                    href="https://monetcore-lead-demo.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-200 hover:underline"
                  >
                    Explore Demo ↗
                  </a>
                </div>
              </article>
              <article className="corporate-product-card rounded-2xl border border-white/20 bg-white/5 p-7 sm:p-9">
                <Layers3
                  size={30}
                  aria-hidden="true"
                  className="text-blue-300"
                />
                <p className="mt-6 text-xs font-bold uppercase tracking-widest text-blue-200">
                  Integration-dependent workflow
                </p>
                <h3 className="mt-3 text-2xl font-bold">Smart Booking</h3>
                <p className="mt-4 leading-7 text-slate-300">
                  An existing consultation flow with availability, booking
                  records, calendar and notification integrations. Explore
                  scheduling for your business as a separately scoped solution.
                </p>
                <div className="mt-7 flex flex-wrap gap-4">
                  <Link
                    href="/products/smart-booking"
                    className="font-bold text-blue-200 hover:underline"
                  >
                    Product details →
                  </Link>
                  <Link
                    href="/book"
                    className="font-bold text-blue-200 hover:underline"
                  >
                    Book a Consultation →
                  </Link>
                </div>
              </article>
            </div>
            <p className="mt-6 text-xs leading-6 text-slate-400">
              Product availability, credentials and third-party services must be
              confirmed for each engagement. Illustrative interfaces are not
              evidence of a deployed customer system.
            </p>
          </div>
        </section>

        <section id="smart-websites" className="px-5 py-16 lg:px-8">
          <div
            id="website-packages"
            className="mx-auto grid max-w-7xl gap-8 rounded-3xl border border-blue-200 bg-blue-50/60 p-7 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">
                One of our solutions
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Smart Website Solutions
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Professional business websites with first-year standard domain
                and hosting, WhatsApp click-to-chat and a basic rule-based
                lead-gathering assistant. A digital home that works alongside
                your social media.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600">
                One-time package setup
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                {packagePrice(starter)}
              </p>
              <Link href="/website-packages" className={`${primary} mt-5`}>
                Explore Website Packages{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <p className="mt-3 text-xs leading-6 text-slate-600">
                Final quotations depend on your requirements. Annual
                renewals apply after 12 months. {renewalTerms.included} Full
                scope and exclusions are on the packages page.
              </p>
            </div>
          </div>
        </section>

        <section id="live-demos" className="bg-slate-50 px-5 py-16 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Explore the possibilities
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">
                Technology you can explore.
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                Experience our existing demonstrations and workflows, with a
                clear distinction between a prototype and a real enquiry.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/demo/fintech"
                className="rounded-2xl border border-emerald-200 bg-emerald-950 p-6 text-white"
              >
                <Code2
                  size={26}
                  aria-hidden="true"
                  className="text-emerald-300"
                />
                <h3 className="mt-5 text-xl font-bold">
                  MonePay fintech concept ↗
                </h3>
                <p className="mt-3 text-sm leading-7 text-emerald-100">
                  Interactive simulated transfers, payments and savings.
                  Fictional prototype; no real money moves.
                </p>
              </Link>
              <Link
                href="/book"
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <Layers3
                  size={26}
                  aria-hidden="true"
                  className="text-blue-700"
                />
                <h3 className="mt-5 text-xl font-bold">
                  Book a Consultation →
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Explore our existing form. This is a real request flow outside
                  review previews. Only submit to request an appointment.
                </p>
              </Link>
            </div>
          </div>
        </section>

        <section id="about" className="about-enhanced px-5 py-20 lg:px-8">
          <div className="about-layout mx-auto max-w-7xl">
            <div className="about-introduction">
              <p className="eyebrow">About Monetcore</p>
              <h2>
                Experience behind us.
                <br />
                <span>A smarter future ahead.</span>
              </h2>
              <div className="company-milestone">
                <span>
                  <Building2 size={25} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <div>
                  <p>Our foundation</p>
                  <strong>Established in 2016</strong>
                  <small>Useful technology for businesses.</small>
                </div>
              </div>
              <Link href="/about" className="about-meet-button">
                Meet Monetcore <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="about-story">
              <p className="about-lead">
                Monetcore System Solutions was established in 2016 with a focus
                on useful technology for businesses. Our work spans modern
                applications, software engineering, intelligent automation and
                digital products.
              </p>
              <p>
                We start with your business context, agree a realistic scope and
                work toward a solution that fits your team. Our company brings
                these capabilities together; each product has its own purpose
                and place.
              </p>
              <div className="company-values">
                {[
                  {
                    title: "Practical",
                    text: "Real workflows.",
                    detail: "Start with the way your business works.",
                    icon: Lightbulb,
                  },
                  {
                    title: "Scalable",
                    text: "Room to evolve.",
                    detail: "Plan for the next chapter, at the right scope.",
                    icon: Expand,
                  },
                  {
                    title: "Intelligent",
                    text: "AI where useful.",
                    detail: "Choose technology for its practical value.",
                    icon: Sparkles,
                  },
                ].map(({ title, text, detail, icon: Icon }) => (
                  <article key={title} className="company-value-card">
                    <span>
                      <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <small>{detail}</small>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="process-enhanced px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="process-heading">
              <div>
                <p className="eyebrow">How we work</p>
                <h2>A clear path from problem to solution.</h2>
              </div>
              <p>
                Four connected steps. Select a card to explore how we move from
                understanding your goals to an approved launch.
              </p>
            </div>
            <ProjectWorkflow />
          </div>
        </section>

        <section id="faq" className="faq-enhanced px-5 py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="faq-introduction">
              <span className="faq-section-icon">
                <CircleHelp size={27} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <p className="eyebrow">Before we begin</p>
              <h2>
                Your questions.
                <br />A useful starting point.
              </h2>
              <p>
                Get to know our approach, explore the available solutions, and
                find the right place to start.
              </p>
              <Link href="/contact#consultation">
                Have another question? Let&apos;s talk{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <CorporateFAQ items={faqs} />
          </div>
        </section>

        <ProjectPlanProvider>
          <SolutionExplorer />
          <section id="contact" className="contact-enhanced px-5 py-20 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="corporate-conversion">
                <div className="conversion-copy">
                  <p className="eyebrow">
                    Your next chapter starts with a conversation
                  </p>
                  <h2>
                    Have a business challenge?
                    <br />
                    Let&apos;s build the right solution.
                  </h2>
                  <p>
                    Tell us what you want to build, connect or improve. We can
                    explore the right software, application, website or
                    automation approach with you.
                  </p>
                </div>
                <div className="conversion-actions">
                  <Link href="/book" className="conversion-primary">
                    <CalendarDays size={19} aria-hidden="true" />
                    Book a Consultation
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                  <Link
                    href="#project-enquiry"
                    className="conversion-secondary"
                  >
                    <ArrowRight size={19} aria-hidden="true" />
                    Start a Project
                  </Link>
                  <a
                    href="https://wa.me/2347065880558?text=Hello%20Monetcore%2C%20I%27d%20like%20to%20discuss%20a%20business%20technology%20project."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="conversion-whatsapp"
                  >
                    <MessageCircle size={19} aria-hidden="true" />
                    Chat on WhatsApp
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </div>
              </div>
              <div id="project-enquiry" className="project-enquiry-layout">
                <div className="enquiry-introduction">
                  <p className="eyebrow">Start a conversation</p>
                  <h3>Have a business problem technology can solve?</h3>
                  <p>
                    Send the details using our existing project enquiry form, or
                    get in touch directly.
                  </p>
                  <address>
                    <a href="mailto:hello@monetcore.dev">
                      <Mail size={19} aria-hidden="true" />
                      <span>
                        <small>Email</small>hello@monetcore.dev
                      </span>
                    </a>
                    <a href="tel:+2347065880558">
                      <Phone size={19} aria-hidden="true" />
                      <span>
                        <small>Phone</small>07065880558
                      </span>
                    </a>
                  </address>
                  <p>Based in Maitama, Abuja, Nigeria.</p>
                  <Link
                    className="enquiry-consultation"
                    href="/contact#consultation"
                  >
                    Request a free consultation{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
                <div>
                  <ContactForm />
                </div>
              </div>
            </div>
          </section>
        </ProjectPlanProvider>
      </main>
    </>
  );
}
