import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import styles from "./site-footer.module.css";
import { serviceNavigation } from "../config/offeringNavigation";

const columns = [
  {
    title: "Explore",
    links: [
      ["Home", "/"],
      ["Solutions", "/services"],
      ["Products", "/products"],
      ["Service demonstrations", "/services#service-demonstrations"],
      ["How it works", "/#process"],
    ],
  },
  {
    title: "Services",
    links: [
      ...serviceNavigation.map((item) => [item.title, item.href]),
      ["Website packages", "/website-packages"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Monetcore", "/about"],
      ["Contact", "/contact"],
      ["Privacy Policy", "/privacy"],
      ["Free consultation", "/contact#consultation"],
      ["Book an appointment", "/book"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer
      className={`${styles.footer} site-footer border-t border-slate-200 bg-slate-950 text-slate-300`}
    >
      <div className={`${styles.shell} mx-auto max-w-7xl px-5 py-16 lg:px-8`}>
        <div
          className={`${styles.intro} footer-intro mb-12 flex flex-col justify-between gap-6 border-b border-white/15 pb-10 sm:flex-row sm:items-center`}
        >
          <div>
            <Link
              href="/"
              className={`${styles.brand} brand-lockup`}
              title="Monetcore System Solutions home"
            >
              <span className="brand-mark">
                M<span />
              </span>
              <span>
                <strong>MONETCORE</strong> <small>SYSTEM SOLUTIONS</small>
              </span>
            </Link>
            <p
              className="mt-4 max-w-xl text-2xl font-medium tracking-tight text-white sm:text-3xl"
              style={{ fontFamily: "var(--font-manrope), sans-serif" }}
            >
              Technology for your next chapter.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
              Software. Automation. Business technology. Built around your
              goals, with room to grow.
            </p>
          </div>
          <a
            href="https://wa.me/2347065880558?text=Hello%20Monetcore%2C%20I%27d%20like%20to%20discuss%20a%20business%20technology%20project."
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.action} w-fit rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-blue-100`}
          >
            Let&apos;s talk on WhatsApp{" "}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-bold text-white">{column.title}</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="hover:text-white hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h2 className="text-sm font-bold text-white">Contact</h2>
            <address className="mt-5 space-y-3 text-sm not-italic">
              <a
                className="block break-all hover:text-white"
                href="mailto:hello@monetcore.dev"
              >
                hello@monetcore.dev
              </a>
              <a className="block hover:text-white" href="tel:+2347065880558">
                +234 706 588 0558
              </a>
              <p>
                Ventures Park, 5 Kwaji Close,
                <br />
                Maitama, Abuja, Nigeria
              </p>
            </address>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              <a
                href="https://www.facebook.com/monetcore"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline"
              >
                Facebook
              </a>
              <a
                href="https://x.com/monetcore"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Monetcore on X"
                className="hover:text-white hover:underline"
              >
                X
              </a>
              <a
                href="https://wa.me/2347065880558"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white hover:underline"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
        <p className="mt-12 border-t border-white/15 pt-6 text-xs leading-6">
          © {new Date().getFullYear()} Monetcore System Solutions. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
