/** Proposed commercial terms. Obtain business approval before public publication. */
export const pricingConditions = [
  "All package prices and renewal amounts are proposed and require final Monetcore business approval before publication. Confirm the final scope and quotation before purchase.",
  "First-year standard .com domain registration, hosting and SSL are included for 12 months. Annual domain and hosting renewal fees apply after the first 12 months.",
  "Premium domains are charged separately and domain availability must be confirmed.",
  "Third-party API, AI and messaging usage fees are excluded unless explicitly included in your written quotation. No package promises unlimited AI usage.",
  "Advanced automation and complex integrations are separately quoted. Optional features are not included in the advertised base price unless confirmed in writing.",
  "Starter uses a rule-based enquiry assistant, not generative AI. Advanced WhatsApp Business Platform automation is not included in Starter or Business and requires a separately approved integration.",
] as const;

export const websitePackages = [
  {
    id: "starter",
    name: "Smart Starter",
    price: 99000,
    renewal: 45000,
    from: false,
    tagline: "A focused first home for your business.",
    audience: "For businesses that need the essentials in one clear page.",
    features: [
      "One-page professional website",
      "Standard .com domain for 12 months",
      "Hosting and SSL for 12 months",
      "Mobile-responsive design",
      "WhatsApp click-to-chat",
      "Basic rule-based lead-gathering assistant",
      "Customer enquiry form",
      "Email lead notifications",
      "Basic SEO",
      "Two revision rounds",
    ],
    comparison: [
      "One page",
      "Included",
      "Included",
      "Included",
      "Basic rule-based assistant",
      "Enquiry form + email notifications",
      "Basic SEO",
      "Two rounds",
      "Not included",
      "Not included",
      "Not included",
      "Not included",
    ],
  },
  {
    id: "business",
    name: "Smart Business",
    price: 179000,
    renewal: 60000,
    from: false,
    tagline: "More room to tell your business story.",
    audience: "For growing businesses with services and work to showcase.",
    features: [
      "Everything in Smart Starter, plus:",
      "Up to five pages",
      "Services and portfolio sections",
      "Enhanced lead capture",
      "Configurable chatbot questions",
      "Quotation and contact forms",
      "Google Maps integration",
      "Three revision rounds",
    ],
    comparison: [
      "Up to five pages",
      "Included",
      "Included",
      "Included",
      "Configurable rule-based questions",
      "Enhanced capture + quotation/contact forms",
      "Basic SEO + portfolio sections",
      "Three rounds",
      "Included",
      "Not included",
      "Not included",
      "Not included",
    ],
  },
  {
    id: "pro",
    name: "Smart Business Pro",
    price: 299000,
    renewal: 90000,
    from: true,
    tagline: "A tailored foundation for your next chapter.",
    audience: "For businesses that need custom design and connected workflows.",
    features: [
      "Up to ten pages",
      "First-year standard .com domain, hosting and SSL",
      "Mobile-responsive custom design",
      "Custom design and scoped integrations",
      "Advanced lead capture",
      "Optional booking system — separately quoted",
      "Optional AI chatbot — separately quoted",
      "Optional WhatsApp Business Platform automation — separately quoted",
      "Analytics and business integrations",
    ],
    comparison: [
      "Up to ten pages",
      "Included",
      "Included",
      "Included",
      "Advanced workflows; AI optional at extra cost",
      "Advanced lead capture",
      "Analytics + scoped business integrations",
      "Agreed in quotation",
      "Scoped in quotation",
      "Optional · separately quoted",
      "Optional · separately quoted",
      "Optional · separately quoted",
    ],
  },
] as const;

export const comparisonLabels = [
  "Website size",
  "Standard .com domain · first 12 months",
  "Hosting & SSL · first 12 months",
  "Mobile-responsive design",
  "Enquiry assistant",
  "Forms & lead capture",
  "Visibility & integrations",
  "Revision rounds",
  "Google Maps",
  "Booking system",
  "Generative AI chatbot",
  "WhatsApp Business Platform automation",
] as const;

export type WebsitePackage = (typeof websitePackages)[number];
export function getWebsitePackage(id: unknown): WebsitePackage | undefined {
  return typeof id === "string"
    ? websitePackages.find((item) => item.id === id)
    : undefined;
}
export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
export function packagePrice(item: WebsitePackage) {
  return `${item.from ? "From " : ""}${formatNaira(item.price)}`;
}
export function packageRenewal(item: WebsitePackage) {
  return `${item.from ? "From " : ""}${formatNaira(item.renewal)}`;
}
export function packageQuotationHref(item: WebsitePackage) {
  return `/website-packages?package=${item.id}#quotation`;
}
export function packageWhatsAppHref(item: WebsitePackage) {
  const text = `Hello Monetcore System Solutions, I'd like to enquire about ${item.name} (${packagePrice(item)}, proposed). Proposed annual renewal: ${packageRenewal(item)} after 12 months. Please confirm final scope, pricing and availability. I understand optional integrations and third-party usage may cost extra.`;
  return `https://wa.me/2347065880558?text=${encodeURIComponent(text)}`;
}
