"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const groups = [
  {
    label: "Solutions",
    links: [
      ["All services", "/services"],
      ["AI automation", "/services#ai-automation"],
      ["Custom software & applications", "/services#custom-software"],
      ["AI sales systems", "/services#ai-sales-systems"],
      ["Business integrations", "/services#business-integrations"],
      ["Technology consulting", "/contact#consultation"],
    ],
  },
  {
    label: "Products",
    links: [
      ["Product overview", "/products"],
      ["AI Lead Automation", "/products#ai-lead-automation"],
      ["Smart Booking", "/products#smart-booking"],
      ["Smart Website Solutions", "/website-packages"],
      ["Live demos & showcases", "/#live-demos"],
    ],
  },
  {
    label: "Company",
    links: [
      ["About Monetcore", "/about"],
      ["Our story", "/about#our-story"],
      ["How we work", "/#process"],
      ["Questions & answers", "/#faq"],
      ["Contact us", "/contact"],
    ],
  },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  function closeNavigation() {
    setMobileOpen(false);
    header.current
      ?.querySelectorAll("details[open]")
      .forEach((item) => item.removeAttribute("open"));
  }

  return (
    <header
      ref={header}
      className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-lg"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          closeNavigation();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        const detail = (event.target as HTMLElement).closest("details");
        if (detail?.open) {
          detail.open = false;
          detail.querySelector("summary")?.focus();
        } else {
          closeNavigation();
          toggle.current?.focus();
        }
      }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-800 focus:p-3 focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link
          href="/"
          onClick={closeNavigation}
          aria-label="Monetcore System Solutions home"
          className="flex items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="grid h-10 w-10 place-items-center rounded-xl bg-blue-700 text-xl font-black text-white"
          >
            M<span className="sr-only">.</span>
          </span>
          <span>
            <span className="block text-sm font-black tracking-[0.16em] text-slate-950">
              MONETCORE
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-600">
              System Solutions
            </span>
          </span>
        </Link>
        <button
          ref={toggle}
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="primary-navigation"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 lg:hidden"
        >
          {mobileOpen ? "Close ×" : "Menu ☰"}
        </button>
        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className={`${mobileOpen ? "flex" : "hidden"} max-h-[calc(100dvh-6rem)] w-full flex-col gap-2 overflow-y-auto text-sm font-semibold text-slate-700 lg:flex lg:w-auto lg:flex-row lg:items-center lg:gap-5 lg:overflow-visible`}
        >
          <Link
            onClick={closeNavigation}
            href="/"
            className="rounded-lg px-3 py-3 hover:bg-slate-100"
          >
            Home
          </Link>
          {groups.map((group) => (
            <details
              key={group.label}
              className="group relative"
              onToggle={(event) => {
                if (!event.currentTarget.open) return;
                const current = event.currentTarget;
                header.current
                  ?.querySelectorAll("details[open]")
                  .forEach((other) => {
                    if (other !== current) other.removeAttribute("open");
                  });
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-slate-100">
                {group.label}
                <span
                  aria-hidden="true"
                  className="transition-transform group-open:rotate-180"
                >
                  ⌄
                </span>
              </summary>
              <div className="mb-2 rounded-xl border border-slate-200 bg-white p-2 lg:absolute lg:left-0 lg:top-full lg:mb-0 lg:w-64 lg:shadow-xl">
                {group.links.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeNavigation}
                    className="block rounded-lg px-4 py-3 hover:bg-blue-50 hover:text-blue-800"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          <Link
            href="/contact#consultation"
            onClick={closeNavigation}
            className="rounded-lg bg-blue-700 px-5 py-3 text-center text-white hover:bg-blue-800"
          >
            Free consultation ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}
