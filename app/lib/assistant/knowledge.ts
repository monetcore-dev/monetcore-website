import "server-only";
import {
  websitePackages,
  packagePrice,
  packageRenewal,
  renewalTerms,
  pricingConditions,
} from "../../config/websitePackages";
import { services, products, enquiryHref } from "../../config/offeringCatalog";
export type Answer = {
  id: string;
  label: string;
  text: string;
  links: { label: string; href: string }[];
};
export const knowledge: Answer[] = [
  {
    id: "company",
    label: "Company and contact",
    text: "Monetcore System Solutions develops technology solutions for businesses, including AI automation, custom software, websites, integrations, mobile apps, digital marketing and consulting. Office: Ventures Park, 5 Kwaji Close, Maitama, Abuja, Nigeria. Email: hello@monetcore.dev. Phone: 07065880558.",
    links: [{ label: "Contact Monetcore", href: "/contact#consultation" }],
  },
  {
    id: "renewals",
    label: "Website renewals and exclusions",
    text: `${renewalTerms.included} ${renewalTerms.excluded} ${renewalTerms.limits} ${pricingConditions[0]}`,
    links: [{ label: "Website packages", href: "/website-packages" }],
  },
  ...websitePackages.map((p) => ({
    id: `package-${p.id}`,
    label: p.name,
    text: `${p.name}: ${packagePrice(p)}. Proposed one-time package setup; proposed annual renewal: ${packageRenewal(p)} after 12 months. ${p.features.join("; ")}. ${renewalTerms.included} ${renewalTerms.excluded} ${pricingConditions[0]} Third-party API, AI and messaging fees are excluded unless agreed in writing; no unlimited AI usage.`,
    links: [
      { label: "Compare packages", href: "/website-packages" },
      {
        label: "Request a quotation",
        href: `/website-packages?package=${p.id}#quotation`,
      },
    ],
  })),
  ...services.map((s) => ({
    id: `service-${s.slug}`,
    label: s.title,
    text: `${s.title}: ${s.intro} This is a scoped service offering, not a guarantee of results, delivery dates or a ready-made product. Request a Quote: final scope, one-time fees and recurring hosting, maintenance, API, subscription and third-party charges are agreed separately. Page demonstrations are local simulations.`,
    links: [
      { label: "Service details", href: `/services/${s.slug}` },
      { label: "Request a quotation", href: enquiryHref("service", s.slug) },
    ],
  })),
  ...products.map((p) => ({
    id: `product-${p.slug}`,
    label: p.title,
    text: `${p.title}. Status: ${p.status}. ${p.disclosure} Features shown are illustrative, not a promise of commercial availability. Contact Monetcore to discuss requirements and availability.`,
    links: [
      { label: "Product details", href: `/products/${p.slug}` },
      {
        label: "Enquire about this solution",
        href: enquiryHref("product", p.slug),
      },
    ],
  })),
];
export const fallback: Answer = {
  id: "unknown",
  label: "Human assistance",
  text: "I can only help with approved Monetcore company, service, product and website-package information. I cannot confirm custom prices, availability, guarantees or commitments. Please contact our team to discuss your requirements.",
  links: [{ label: "Contact Monetcore", href: "/contact#consultation" }],
};
export function assemble(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Classification");
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== 1 ||
    !Array.isArray(record.topics) ||
    record.topics.length < 1 ||
    record.topics.length > 2 ||
    new Set(record.topics).size !== record.topics.length ||
    (record.topics.includes("unknown") && record.topics.length !== 1)
  )
    throw new Error("Classification");
  return record.topics.map((id: unknown) => {
    if (id === "unknown") return fallback;
    const entry = knowledge.find((k) => k.id === id);
    if (!entry) throw new Error("Classification");
    return entry;
  });
}
