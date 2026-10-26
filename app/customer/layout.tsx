import type { Metadata } from "next";
import Link from "next/link";
import { customerEnabled } from "../lib/customer/config";
import "./customer.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Customer Platform",
  description: "Secure Monetcore customer project workspace.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/customer" },
};
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main id="main-content" className="customer-platform">
      <a className="skip-link" href="#customer-content">
        Skip to customer content
      </a>
      <header className="customer-top">
        <Link href="/" className="customer-brand">
          Monetcore <span>Customer Platform</span>
        </Link>
        <Link href="/contact">Contact Monetcore</Link>
      </header>
      {!customerEnabled() ? (
        <section
          id="customer-content"
          className="customer-empty"
          aria-labelledby="customer-unavailable"
        >
          <p className="customer-eyebrow">Customer platform foundation</p>
          <h1 id="customer-unavailable">
            Your project workspace is being prepared.
          </h1>
          <p>
            Customer access and registration are not enabled. To discuss a
            project or get help, contact Monetcore directly.
          </p>
          <Link className="customer-button" href="/contact">
            Contact Monetcore
          </Link>
          <p>
            <Link href="/privacy">Privacy Policy</Link>
          </p>
        </section>
      ) : (
        <div className="customer-shell">
          <nav aria-label="Customer navigation">
            <Link href="/customer">Overview & projects</Link>
            <Link href="/customer/projects/new">New project request</Link>
            <Link href="/customer/account">Account settings</Link>
            <Link href="/contact">Support & contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </nav>
          <div id="customer-content" className="customer-content">
            {children}
          </div>
        </div>
      )}
    </main>
  );
}
