import Link from "next/link";

const services = [
  {
    label: "AI Automation",
    href: "/services#ai-automation",
  },
  {
    label: "Custom Software",
    href: "/services#custom-software",
  },
  {
    label: "AI Sales Systems",
    href: "/services#ai-sales-systems",
  },
  {
    label: "Business Integrations",
    href: "/services#business-integrations",
  },
];

const explore = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Products", href: "/products" },
  {
    label: "AI Lead Automation",
    href: "/products#ai-lead-automation",
  },
];

const company = [
  { label: "About Monetcore", href: "/about" },
  { label: "Our Story", href: "/about#our-story" },
  { label: "Contact", href: "/contact" },
  {
    label: "Book a Consultation",
    href: "/book",
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-blue-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_1fr_0.9fr_1.35fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white shadow-md shadow-blue-200">
                M
              </div>

              <div>
                <p className="text-sm font-extrabold tracking-[0.18em] text-blue-700">
                  MONETCORE
                </p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">
                  System Solutions
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-6 text-slate-500">
              AI automation, custom software and intelligent
              systems built around real business outcomes.
            </p>

            <div className="mt-6 text-sm leading-6 text-slate-600">
              <p className="font-semibold text-slate-900">
                Office
              </p>
              <address className="mt-2 not-italic">
                Ventures Park
                <br />
                5 Kwaji Close
                <br />
                Maitama, Abuja
                <br />
                Nigeria
              </address>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Explore
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              {explore.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-slate-500 transition hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Services
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              {services.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-slate-500 transition hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Company
            </h3>

            <div className="mt-5 flex flex-col gap-3">
              {company.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm text-slate-500 transition hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Contact
            </h3>

            <div className="mt-5 space-y-4 text-sm text-slate-500">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Email
                </p>
                <a
                  href="mailto:hello@monetcore.dev"
                  className="mt-1 inline-block font-medium text-slate-700 transition hover:text-blue-700"
                >
                  hello@monetcore.dev
                </a>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Phone
                </p>
                <a
                  href="tel:+2347065880558"
                  className="mt-1 inline-block font-medium text-slate-700 transition hover:text-blue-700"
                >
                  +234 706 588 0558
                </a>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  WhatsApp
                </p>
                <a
                  href="https://wa.me/2347065880558"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block font-medium text-slate-700 transition hover:text-emerald-600"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://www.facebook.com/monetcore"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Monetcore on Facebook"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Facebook
              </a>

              <a
                href="https://x.com/monetcore"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Monetcore on X"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                X
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} Monetcore System
            Solutions. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/"
              className="transition hover:text-blue-700"
            >
              monetcore.dev
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-blue-700"
            >
              Contact
            </Link>

            <Link
              href="/products"
              className="transition hover:text-blue-700"
            >
              Products
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}