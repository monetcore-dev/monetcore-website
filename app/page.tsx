import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Globe2,
  MessageCircle,
  MousePointer2,
  ShieldCheck,
} from "lucide-react";
import ContactForm from "./ContactForm";
import SiteHeader from "./components/SiteHeader";

export const metadata: Metadata = {
  title: "Business Websites from ₦99,000 | Monetcore System Solutions",
  description:
    "Explore proposed smart website packages for Nigerian businesses, with domain, hosting, WhatsApp contact and customer enquiry tools. Free website consultation.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Your business. Your website. More possibilities.",
    description:
      "Professional business websites from a proposed ₦99,000. Built by Monetcore System Solutions.",
    url: "/",
  },
};

const primary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-blue-800";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100";
const whatsapp =
  "https://wa.me/2347065880558?text=Hello%20Monetcore%2C%20I%27m%20interested%20in%20the%20proposed%20%E2%82%A699%2C000%20Smart%20Starter%20website.%20Please%20confirm%20pricing%20and%20availability.";
const benefits = [
  {
    icon: Globe2,
    title: "A home for your business",
    text: "Put your services, location and contact details in one place you control. Share one simple link everywhere.",
  },
  {
    icon: ShieldCheck,
    title: "Make a confident first impression",
    text: "Help prospective customers understand what you do with a professional, mobile-friendly presentation.",
  },
  {
    icon: MessageCircle,
    title: "An easier next conversation",
    text: "Let visitors send an enquiry or continue on WhatsApp, with useful details about what they need.",
  },
];
const faqs = [
  [
    "Can I keep selling through social media?",
    "Absolutely. Keep using Instagram, Facebook, TikTok and WhatsApp. Your website gives those audiences one organised place to explore your services and make an enquiry.",
  ],
  [
    "What does the proposed ₦99,000 package include?",
    "Smart Starter is proposed to include a one-page website, a standard .com domain and hosting for 12 months, SSL, WhatsApp click-to-chat, an enquiry form and a basic rule-based enquiry assistant. Final scope and pricing must be confirmed by Monetcore before purchase.",
  ],
  [
    "What happens after the first year?",
    "Annual domain and hosting renewals apply after 12 months. The proposed Smart Starter renewal is ₦45,000 per year, subject to final confirmation. Premium domains, complex integrations and third-party usage cost extra.",
  ],
  [
    "Is the Starter assistant powered by generative AI?",
    "No. The proposed Starter assistant follows configured questions and answers to gather enquiries. AI assistants and automated WhatsApp replies are optional advanced services with separate requirements and possible usage fees.",
  ],
  [
    "Can my website grow with my business?",
    "Yes. We can discuss extra pages, booking, custom software and business integrations as a separate scope. We will confirm what is practical, the cost and the services required before work begins.",
  ],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="bg-white text-slate-950">
        <section className="relative overflow-hidden bg-[#f3f6fc] px-5 pb-20 pt-36 lg:px-8 lg:pb-28 lg:pt-44">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 top-0 h-[650px] w-[650px] rounded-full border-[100px] border-blue-100/60"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
                <span className="h-2 w-2 rounded-full bg-blue-700" /> Built for
                Nigerian businesses
              </p>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Your business.
                <br />
                Your website.
                <br />
                <span className="text-blue-700">More possibilities.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
                Professional business websites that work for you — starting from
                a proposed{" "}
                <strong className="font-bold text-slate-950">₦99,000.</strong>
              </p>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Your own domain, mobile-friendly design, hosting, WhatsApp
                contact and smart enquiry tools. A clear next step for your
                business online.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#website-packages" className={primary}>
                  Explore website packages{" "}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
                <Link href="#live-demos" className={secondary}>
                  Try a live demo
                </Link>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-600">
                Proposed offer · Final pricing and scope confirmed before
                purchase.
              </p>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-700">
                {[
                  "Mobile-first design",
                  "Domain + hosting",
                  "WhatsApp ready",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="text-blue-700"
                    />
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg pb-8 lg:pl-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-blue-950/10 sm:p-5">
                <div className="mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-4">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="ml-3 text-[10px] text-slate-500">
                    your-business.com · Illustrative website
                  </span>
                </div>
                <div className="overflow-hidden rounded-xl bg-[#f5f3ed] p-5 sm:p-8">
                  <div className="flex justify-between text-[10px] font-bold tracking-widest text-slate-700">
                    <span>YOUR BUSINESS</span>
                    <span>SERVICES ↗</span>
                  </div>
                  <div className="mt-12 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-800">
                    OPEN FOR POSSIBILITIES
                  </div>
                  <p className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                    Great service.
                    <br />
                    Now online.
                  </p>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">
                    Show what makes your business special. Help customers take
                    the next step.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-3 rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold text-white">
                    Explore our services{" "}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-2">
                    {["Discover", "Enquire", "Connect"].map((word, i) => (
                      <div key={word} className="rounded-lg bg-white p-3">
                        <span className="text-xs text-blue-700">0{i + 1}</span>
                        <p className="mt-2 text-[10px] font-semibold sm:text-xs">
                          {word}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative -mt-6 ml-6 flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 shadow-lg">
                <span className="rounded-full bg-emerald-100 p-2 text-emerald-800">
                  <MessageCircle size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-950">
                    From interest to enquiry
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Give every visitor a clear next step.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Smart website solutions
              </p>
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  A professional presence.
                  <br />A practical business tool.
                </h2>
                <p className="mt-5 leading-7 text-slate-600">
                  For service providers, shops and growing businesses ready for
                  a home online. We bring your information, enquiries and
                  customer contact together.
                </p>
              </div>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, text }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 p-7"
                >
                  <Icon
                    className="text-blue-700"
                    size={28}
                    aria-hidden="true"
                  />
                  <h3 className="mt-7 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-5 py-20 text-white lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                Social media + your website
              </p>
              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Your social media attracts customers. Your smart website helps
                turn visitors into enquiries.
              </h2>
              <p className="mt-6 leading-8 text-slate-300">
                Keep the conversations going on Instagram, Facebook, TikTok and
                WhatsApp. Give interested visitors a place to see the full
                picture, even when a post has moved down their feed.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [
                  "Be easy to understand",
                  "Organise your services, business hours, location and frequently asked questions.",
                ],
                [
                  "Share one useful link",
                  "Connect your bio, posts and WhatsApp profile to one consistent business destination.",
                ],
                [
                  "Capture the details",
                  "Give customers a way to explain what they need through an enquiry form.",
                ],
                [
                  "Keep the conversation going",
                  "Let visitors choose a convenient next step: WhatsApp, email or a consultation.",
                ],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/15 bg-white/5 p-6"
                >
                  <Check
                    size={18}
                    aria-hidden="true"
                    className="text-blue-300"
                  />
                  <h3 className="mt-4 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="website-packages"
          className="bg-blue-50/60 px-5 py-20 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Start with the essentials
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-tight">
                Small business.
                <br />
                Professional first impression.
              </h2>
              <p className="mt-6 max-w-lg leading-8 text-slate-600">
                Smart Starter brings your business online with a focused,
                one-page website and simple ways for customers to reach you.
              </p>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600">
                Need more pages or a custom workflow? Request a free
                consultation so we can understand your business before
                recommending a scope.
              </p>
              <Link
                href="/contact#consultation"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-800"
              >
                Discuss your website{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <article className="rounded-3xl border border-blue-200 bg-white p-7 shadow-lg shadow-blue-950/5 sm:p-10">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800">
                Proposed package · Subject to confirmation
              </span>
              <h3 className="mt-6 text-2xl font-bold">Smart Starter</h3>
              <p className="mt-3 text-5xl font-bold tracking-tight">₦99,000</p>
              <p className="mt-2 text-sm text-slate-600">
                Proposed first-year price
              </p>
              <ul className="my-7 grid gap-3 text-sm text-slate-700">
                {[
                  "Professional one-page, mobile-friendly website",
                  "Standard .com domain + hosting for 12 months",
                  "SSL certificate and basic SEO configuration",
                  "WhatsApp click-to-chat and enquiry form",
                  "Basic rule-based enquiry assistant and email notifications",
                  "Two revision rounds",
                ].map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <Check
                      className="mt-0.5 shrink-0 text-blue-700"
                      size={16}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={`${primary} w-full`}
              >
                Ask about Smart Starter{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
              <p className="mt-5 text-xs leading-6 text-slate-600">
                Proposed annual renewal: ₦45,000 after the first 12 months.
                Final pricing and scope require Monetcore confirmation before
                purchase. Premium domains and complex integrations cost extra.
                Generative AI and automated WhatsApp replies are not included;
                third-party usage may incur separate fees.
              </p>
            </article>
          </div>
        </section>

        <section id="live-demos" className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                  Explore what is possible
                </p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight">
                  See it. Try it. Imagine yours.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-7 text-slate-600">
                Explore our existing demonstrations. These illustrate custom
                tools beyond the Starter website scope.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <article className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="bg-emerald-950 p-8 text-white">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
                    Interactive concept
                  </p>
                  <p className="mt-5 text-4xl font-black">
                    MonePay<span className="text-emerald-300">.</span>
                  </p>
                  <p className="mt-4 text-emerald-100">
                    A different kind of digital experience.
                  </p>
                  <div className="mt-7 grid grid-cols-3 gap-3 text-xs">
                    {["Send", "Save", "Explore"].map((text) => (
                      <div
                        key={text}
                        className="rounded-xl border border-white/20 p-4"
                      >
                        {text} ↗
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-7">
                  <h3 className="text-xl font-bold">
                    Fintech website & product concept
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Explore simulated payments and savings. Fictional demo; no
                    banking services or real money movement.
                  </p>
                  <Link href="/demo/fintech" className={`${secondary} mt-6`}>
                    Try MonePay <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
              <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200">
                <div className="bg-blue-100 p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-800">
                    Existing booking experience
                  </p>
                  <div className="mt-5 flex items-center gap-3 text-3xl font-bold">
                    <MousePointer2 size={28} aria-hidden="true" /> Make time to
                    connect.
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs font-bold text-blue-900">
                    {["Pick a day", "Choose a time", "Send a request"].map(
                      (text) => (
                        <div
                          key={text}
                          className="rounded-xl bg-white px-2 py-4"
                        >
                          {text}
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-xl font-bold">Consultation booking</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Explore Monetcore&apos;s appointment form. This is our real
                    booking flow, not a sandbox; only submit to request an
                    appointment. Availability depends on connected services.
                  </p>
                  <Link href="/book" className={`${secondary} mt-6 w-fit`}>
                    Explore booking{" "}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="process"
          className="border-y border-slate-200 bg-slate-50 px-5 py-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
              From first conversation to launch
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              A clear path to your new website.
            </h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Tell us about your business",
                  "Share your goals, services and the customers you want to reach.",
                ],
                [
                  "Agree the right scope",
                  "Confirm the package, content, timeline, price and renewal terms.",
                ],
                [
                  "Design and refine",
                  "Review your website and use the agreed revision rounds to refine it.",
                ],
                [
                  "Launch with confidence",
                  "Approve the final website, connect your domain and share your new link.",
                ],
              ].map(([title, text], i) => (
                <li key={title}>
                  <span className="text-sm font-bold text-blue-700">
                    0{i + 1} /
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="products" className="px-5 py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Your next chapter
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">
                Start with a website.
                <br />
                Grow into smarter systems.
              </h2>
              <p className="mt-6 leading-8 text-slate-600">
                Monetcore also offers custom software, AI automation and
                business integrations. Explore these as separately scoped
                services when your business needs more.
              </p>
              <Link href="/services" className={`${secondary} mt-6`}>
                Explore all services{" "}
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                [
                  "Custom software",
                  "Web apps, dashboards and tools shaped around your workflow.",
                  "/services#custom-software",
                ],
                [
                  "AI & business automation",
                  "Discuss practical automation, integrations and AI-assisted workflows.",
                  "/services#ai-automation",
                ],
                [
                  "Smart business tools",
                  "Explore product information and the external lead automation demo.",
                  "/products",
                ],
              ].map(([title, text, href]) => (
                <Link
                  href={href}
                  key={title}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:bg-blue-50"
                >
                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {text}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={20}
                    className="shrink-0 text-blue-700"
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-slate-50 px-5 py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                Good questions. Clear answers.
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">
                Before you get started.
              </h2>
              <Link
                href="/contact"
                className="mt-6 inline-block text-sm font-bold text-blue-800"
              >
                Have another question? Get in touch ↗
              </Link>
            </div>
            <div>
              {faqs.map(([question, answer]) => (
                <details
                  key={question}
                  className="group border-b border-slate-200 py-5"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-base font-bold">
                    {question}
                    <span
                      className="text-blue-700 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl bg-blue-700 px-6 py-12 text-white sm:px-12">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                Let&apos;s build your next step
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight">
                Your business deserves a place of its own.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-blue-50">
                Tell us about your business. Start with a free website
                consultation, with no obligation to purchase.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/contact#consultation"
                  className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-blue-800 hover:bg-blue-50"
                >
                  Request a free consultation ↗
                </Link>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-blue-200 px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-800"
                >
                  Chat with Monetcore on WhatsApp
                </a>
              </div>
            </div>
            <div className="mt-14">
              <h3 className="text-2xl font-bold">
                Prefer to send the details now?
              </h3>
              <p className="mt-3 text-slate-600">
                Use our existing enquiry form. We&apos;ll discuss the right
                scope for your business.
              </p>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
