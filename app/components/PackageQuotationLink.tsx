"use client";
import Link from "next/link";
import { packageSelectionEvent } from "../config/websitePackages";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** Keep the native deep link, but navigate the query separately from form scrolling. */
export default function PackageQuotationLink({
  href,
  ...props
}: {
  href: string;
  className: string;
  "aria-label": string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      {...props}
      href={href}
      scroll={false}
      onNavigate={(event) => {
        event.preventDefault();
        const target = new URL(href, window.location.origin);
        window.dispatchEvent(
          new CustomEvent(packageSelectionEvent, {
            detail: target.searchParams.get("package"),
          }),
        );
        // Cached query/fragment round trips must not append duplicate quotation hashes.
        router.push(target.pathname + target.search, { scroll: false });
        const section = document.getElementById("quotation");
        section?.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
        section
          ?.querySelector<HTMLSelectElement>('select[name="packageId"]')
          ?.focus({ preventScroll: true });
      }}
    />
  );
}
