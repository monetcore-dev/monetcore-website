"use client";

import Link from "next/link";
import { useState } from "react";

const serviceLinks = [
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

const productLinks = [
  {
    label: "Products Overview",
    href: "/products",
  },
  {
    label: "AI Lead Automation",
    href: "/products#ai-lead-automation",
  },
  {
    label: "Live Demo",
    href: "https://monetcore-lead-demo.vercel.app/",
    external: true,
  },
];

const companyLinks = [
  {
    label: "About Monetcore",
    href: "/about",
  },
  {
    label: "Our Story",
    href: "/about#our-story",
  },
  {
    label: "Contact",
    href: "/contact",
  },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-100 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
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

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
          <Link
            href="/"
            className="transition hover:text-blue-700"
          >
            Home
          </Link>

          {/* Services dropdown */}
          <div className="group relative">
            <Link
              href="/services"
              className="flex items-center gap-1 transition hover:text-blue-700"
            >
              Services
              <span className="text-xs">⌄</span>
            </Link>

            <div className="invisible absolute left-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2 translate-y-2 rounded-2xl border border-blue-100 bg-white p-2 opacity-0 shadow-xl shadow-slate-900/10 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {serviceLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-xl px-4 py-3 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-1 border-t border-slate-100 pt-1">
                <Link
                  href="/services"
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                >
                  View All Services →
                </Link>
              </div>
            </div>
          </div>

          {/* Products dropdown */}
          <div className="group relative">
            <Link
              href="/products"
              className="flex items-center gap-1 transition hover:text-blue-700"
            >
              Products
              <span className="text-xs">⌄</span>
            </Link>

            <div className="invisible absolute left-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2 translate-y-2 rounded-2xl border border-blue-100 bg-white p-2 opacity-0 shadow-xl shadow-slate-900/10 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {productLinks.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl px-4 py-3 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Company dropdown */}
          <div className="group relative">
            <Link
              href="/about"
              className="flex items-center gap-1 transition hover:text-blue-700"
            >
              Company
              <span className="text-xs">⌄</span>
            </Link>

            <div className="invisible absolute left-1/2 top-full z-50 mt-4 w-56 -translate-x-1/2 translate-y-2 rounded-2xl border border-blue-100 bg-white p-2 opacity-0 shadow-xl shadow-slate-900/10 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {companyLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block rounded-xl px-4 py-3 text-sm text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/contact"
            className="transition hover:text-blue-700"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact#consultation"
            className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
          >
            Book a Consultation
          </Link>

          {/* Mobile button */}
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-xl text-slate-700 lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-blue-100 bg-white px-6 pb-6 lg:hidden">
          <nav className="mx-auto max-w-7xl pt-4">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block border-b border-slate-100 py-4 font-medium text-slate-700"
            >
              Home
            </Link>

            {/* Mobile services */}
            <div className="border-b border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setServicesOpen((value) => !value)
                }
                className="flex w-full items-center justify-between py-4 text-left font-medium text-slate-700"
              >
                Services
                <span>{servicesOpen ? "−" : "+"}</span>
              </button>

              {servicesOpen && (
                <div className="pb-4 pl-4">
                  {serviceLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm text-slate-500"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <Link
                    href="/services"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 block py-2 text-sm font-semibold text-blue-700"
                  >
                    View All Services →
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile products */}
            <div className="border-b border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setProductsOpen((value) => !value)
                }
                className="flex w-full items-center justify-between py-4 text-left font-medium text-slate-700"
              >
                Products
                <span>{productsOpen ? "−" : "+"}</span>
              </button>

              {productsOpen && (
                <div className="pb-4 pl-4">
                  {productLinks.map((item) =>
                    item.external ? (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block py-2 text-sm text-slate-500"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-2 text-sm text-slate-500"
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Mobile company */}
            <div className="border-b border-slate-100">
              <button
                type="button"
                onClick={() =>
                  setCompanyOpen((value) => !value)
                }
                className="flex w-full items-center justify-between py-4 text-left font-medium text-slate-700"
              >
                Company
                <span>{companyOpen ? "−" : "+"}</span>
              </button>

              {companyOpen && (
                <div className="pb-4 pl-4">
                  {companyLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm text-slate-500"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block border-b border-slate-100 py-4 font-medium text-slate-700"
            >
              Contact
            </Link>

            <Link
              href="/contact#consultation"
              onClick={() => setMobileOpen(false)}
              className="mt-5 flex justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Book a Consultation
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}