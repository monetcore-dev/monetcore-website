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
      "Explore product categories and clearly labelled concepts, then discuss a solution with our team.",
    links: [
      {
        title: "Products Overview",
        description: "Capabilities, concepts and honest product status.",
        href: "/products",
        icon: Layers3,
      },
      ...productNavigation.map((item, index) => ({
        ...item,
        icon: [Layers3, Code2][index],
      })),
      {
        title: "Smart Website Packages",
        description: "Website packages, Naira pricing and renewal terms.",
        href: "/website-packages",
        icon: Globe2,
      },
    ],
    overview: "/product-showcase",
    overviewLabel: "Explore product categories",
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

  // A breakpoint change must not resurrect an old mobile or desktop disclosure.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1200px)");
    const reset = () => {
      const focused = document.activeElement;
      const panel = focused instanceof HTMLElement
        ? focused.closest<HTMLElement>(".mega-panel")
        : null;
      const needsFocus = focused instanceof HTMLElement &&
        header.current?.contains(focused) &&
        (focused.getClientRects().length === 0 || panel !== null);
      const trigger = panel?.getAttribute("aria-labelledby");
      setMobileOpen(false);
      setOpenMenu(null);
      if (needsFocus) {
        requestAnimationFrame(() => {
          const target = desktop.matches
            ? (trigger ? header.current?.querySelector<HTMLElement>(`#${trigger}`) : null)
              ?? header.current?.querySelector<HTMLElement>(".nav-home")
            : mobileTrigger.current;
          if (target?.getClientRects().length) target.focus({ preventScroll: true });
        });
      }
    };
    desktop.addEventListener("change", reset);
    return () => desktop.removeEventListener("change", reset);
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
                      "/product-showcase",
                    ].includes(pathname) || pathname.startsWith("/products/")
                  : ["/about", "/contact", "/book"].includes(pathname);
            return (
              <div
                key={menu.id}
                className="nav-disclosure"
                onPointerEnter={(event) => {
                  if (
                    openMenu &&
                    event.pointerType === "mouse" &&
                    window.matchMedia("(min-width: 1200px)").matches
                  )
                    setOpenMenu(menu.id);
                }}
                onPointerLeave={(event) => {
                  if (
                    event.pointerType === "mouse" &&
                    window.matchMedia("(min-width: 1200px)").matches &&
                    !event.currentTarget.contains(document.activeElement)
                  )
                    setOpenMenu(null);
                }}
              >
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
                      const last = event.key === "ArrowUp";
                      setOpenMenu(menu.id);
                      requestAnimationFrame(() => {
                        const links = Array.from(
                          header.current?.querySelectorAll<HTMLAnchorElement>(
                            `#panel-${menu.id} a[href]`,
                          ) ?? [],
                        ).filter(link => link.getClientRects().length > 0 &&
                          link.tabIndex >= 0 && link.getAttribute("aria-disabled") !== "true");
                        (last ? links.at(-1) : links[0])?.focus();
                      });
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
