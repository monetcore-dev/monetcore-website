"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  ChevronDown,
  Code2,
  Compass,
  Cpu,
  Globe2,
  Layers3,
  Mail,
  Menu,
  MonitorPlay,
  PlugZap,
  Workflow,
  X,
} from "lucide-react";

import {
  serviceNavigation,
  productNavigation,
} from "../config/offeringNavigation";

const menus = [
  {
    id: "solutions",
    title: "Solutions & Services",
    eyebrow: "Technology, with purpose",
    description:
      "The right expertise for your next business challenge. Start with what you want to achieve.",
    links: serviceNavigation.map((item, index) => ({
      ...item,
      icon: [Cpu, Code2, Globe2, PlugZap, MonitorPlay, Workflow, Compass][
        index
      ],
    })),
    overview: "/services",
    overviewLabel: "Explore all services",
  },
  {
    id: "products",
    title: "Products",
    eyebrow: "Ideas made useful",
    description:
      "Explore our product information, digital applications and clearly labelled demonstrations.",
    links: [
      {
        title: "Products Overview",
        description: "Capabilities, concepts and honest product status.",
        href: "/products",
        icon: Layers3,
      },
      ...productNavigation.map((item, index) => ({
        ...item,
        icon: [Cpu, CalendarDays, Mail, Layers3, Workflow, Compass][index],
      })),
      {
        title: "Smart Website Packages",
        description: "Website packages, Naira pricing and renewal terms.",
        href: "/website-packages",
        icon: Globe2,
      },
      {
        title: "Existing Digital Applications",
        description: "MonePay · fictional interactive prototype.",
        href: "/products#digital-applications",
        icon: MonitorPlay,
      },
    ],
    overview: "/#live-demos",
    overviewLabel: "Explore demonstrations",
  },
  {
    id: "company",
    title: "Company",
    eyebrow: "Meet Monetcore",
    description:
      "Software engineering, practical thinking and a company built around useful technology.",
    links: [
      {
        title: "About Monetcore",
        description: "Our story and the approach behind our work.",
        href: "/about",
        icon: Building2,
      },
      {
        title: "Contact",
        description: "Tell us what you want to build or improve.",
        href: "/contact",
        icon: Mail,
      },
      {
        title: "Consultation Booking",
        description: "Choose a time to discuss your project.",
        href: "/book",
        icon: CalendarDays,
      },
    ],
    overview: "/#process",
    overviewLabel: "How we work",
  },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1200px)");
    const reset = () => {
      setMobileOpen(false);
      setOpenMenu(null);
    };
    media.addEventListener("change", reset);
    return () => media.removeEventListener("change", reset);
  }, []);

  function closeNavigation() {
    setOpenMenu(null);
    setMobileOpen(false);
  }
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const media = window.matchMedia("(max-width: 1199px)");
    const previousOverflow = document.body.style.overflow;
    const syncScroll = () => {
      document.body.style.overflow = media.matches
        ? "hidden"
        : previousOverflow;
    };
    syncScroll();
    media.addEventListener("change", syncScroll);
    return () => {
      document.body.style.overflow = previousOverflow;
      media.removeEventListener("change", syncScroll);
    };
  }, [mobileOpen]);
  useEffect(() => {
    if (!openMenu && !mobileOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [openMenu, mobileOpen]);

  return (
    <header
      ref={header}
      className={`site-header ${scrolled ? "is-scrolled" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          closeNavigation();
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab" && mobileOpen && window.innerWidth < 1200) {
          const controls = Array.from(
            header.current?.querySelectorAll<HTMLElement>("a[href], button") ?? [],
          ).filter((element) => element.getClientRects().length > 0 && !element.classList.contains("skip-link"));
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
        if (event.key === "Escape") {
          event.preventDefault();
          if (openMenu) {
            triggers.current[openMenu]?.focus();
            setOpenMenu(null);
          } else if (mobileOpen) {
            setMobileOpen(false);
            mobileTrigger.current?.focus();
          }
        }
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="navigation-shell">
        <Link
          href="/"
          onClick={closeNavigation}
          title="Monetcore System Solutions home"
          className="brand-lockup"
        >
          <span className="brand-mark">
            M<span />
          </span>
          <span>
            <strong>MONETCORE</strong>
            <small>SYSTEM SOLUTIONS</small>
          </span>
        </Link>
        <button
          ref={mobileTrigger}
          type="button"
          aria-controls="primary-navigation"
          aria-expanded={mobileOpen}
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          onClick={() => {
            setMobileOpen(!mobileOpen);
            setOpenMenu(null);
          }}
          className="mobile-menu-toggle"
        >
          {mobileOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
          <span>{mobileOpen ? "Close" : "Menu"}</span>
        </button>
        <nav
          id="primary-navigation"
          aria-label="Main navigation"
          className={`primary-navigation ${mobileOpen ? "is-mobile-open" : ""}`}
        >
          <Link
            href="/"
            onClick={closeNavigation}
            aria-current={pathname === "/" ? "page" : undefined}
            className="nav-home"
          >
            Home
          </Link>
          {menus.map((menu) => {
            const active = openMenu === menu.id;
            const current =
              menu.id === "solutions"
                ? pathname === "/services" || pathname.startsWith("/services/")
                : menu.id === "products"
                  ? [
                      "/products",
                      "/website-packages",
                      "/demo/fintech",
                    ].includes(pathname) || pathname.startsWith("/products/")
                  : ["/about", "/contact", "/book"].includes(pathname);
            return (
              <div key={menu.id} className="nav-disclosure">
                <button
                  ref={(element) => {
                    triggers.current[menu.id] = element;
                  }}
                  id={`trigger-${menu.id}`}
                  type="button"
                  aria-expanded={active}
                  aria-controls={`panel-${menu.id}`}
                  className={`nav-trigger ${current ? "is-current" : ""}`}
                  onClick={() => setOpenMenu(active ? null : menu.id)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      setOpenMenu(menu.id);
                      requestAnimationFrame(() =>
                        document
                          .querySelector<HTMLAnchorElement>(
                            `#panel-${menu.id} ${event.key === "ArrowUp" ? ".mega-bottom a" : "a"}`,
                          )
                          ?.focus(),
                      );
                    }
                  }}
                >
                  {menu.title}
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                    className={active ? "rotate-180" : ""}
                  />
                </button>
                <div
                  id={`panel-${menu.id}`}
                  role="region"
                  aria-labelledby={`trigger-${menu.id}`}
                  hidden={!active}
                  className={`mega-panel ${menu.id === "company" ? "company-panel" : ""}`}
                >
                  <div className="mega-introduction">
                    <p className="eyebrow">{menu.eyebrow}</p>
                    <h2>{menu.title}</h2>
                    <p>{menu.description}</p>
                    <Link href={menu.overview} onClick={closeNavigation}>
                      {menu.overviewLabel}
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="mega-links">
                    {menu.links.map(
                      ({ title, description, href, icon: Icon }) => (
                        <Link
                          key={title}
                          href={href}
                          onClick={closeNavigation}
                          className="mega-link"
                        >
                          <span className="mega-icon">
                            <Icon
                              size={21}
                              strokeWidth={1.6}
                              aria-hidden="true"
                            />
                          </span>
                          <span>
                            <strong>{title}</strong>
                            <small>{description}</small>
                          </span>
                          <ArrowUpRight
                            size={15}
                            aria-hidden="true"
                            className="mega-arrow"
                          />
                        </Link>
                      ),
                    )}
                  </div>
                  <div className="mega-bottom">
                    <span>
                      Built around your business. Designed for what comes next.
                    </span>
                    <Link
                      href="/contact#consultation"
                      onClick={closeNavigation}
                    >
                      Discuss a project{" "}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="nav-actions">
            <Link
              href="/contact"
              onClick={closeNavigation}
              className="nav-contact"
            >
              Contact Us
            </Link>
            <Link
              href="/book"
              onClick={closeNavigation}
              className="nav-consult"
            >
              Book a Consultation <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
