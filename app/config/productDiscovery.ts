import { enquiryHref, findProduct, findService } from "./offeringCatalog";

/** Discovery copy describes possibilities, not a declaration of product availability. */
export const discoveryProducts = [
  {
    id: "websites",
    title: "Smart Website Solutions",
    category: "Customer engagement",
    description:
      "Explore professional websites, lead capture and customer engagement in one clear digital home.",
    kind: "service",
    slug: "website-development",
    benefit:
      "Help visitors understand your business and find the right next step.",
    example:
      "A business website that explains services and guides visitors toward an enquiry.",
    scenarios: ["Services", "Enquiries"],
  },
  {
    id: "automation",
    title: "AI Business Automation",
    category: "Intelligent workflows",
    description:
      "Explore intelligent lead handling, follow-ups and connected business workflows.",
    kind: "product",
    slug: "ai-lead-automation",
    benefit:
      "Give teams a clearer view of enquiries and reduce repetitive follow-up work.",
    example:
      "An enquiry moves from capture to review and a prepared follow-up, with a human handoff.",
    scenarios: ["Qualification", "Follow-up"],
  },
  {
    id: "booking",
    title: "Smart Booking",
    category: "Appointments",
    description:
      "Explore appointment scheduling, availability management and an organized customer journey.",
    kind: "product",
    slug: "smart-booking",
    benefit:
      "Make scheduling easier to understand for both your team and your customers.",
    example:
      "A visitor reviews example availability before discussing an appointment workflow.",
    scenarios: ["Morning", "Afternoon"],
  },
  {
    id: "management",
    title: "Business Management",
    category: "Operations & visibility",
    description:
      "Explore operations, reporting and custom workflow systems shaped around your business.",
    kind: "product",
    slug: "crm",
    benefit:
      "Bring activity, responsibilities and next actions into a shared view.",
    example:
      "A team reviews synthetic tasks and reporting before defining a tailored operational workspace.",
    scenarios: ["Operations", "Reporting"],
  },
] as const;
export type DiscoveryProduct = (typeof discoveryProducts)[number];

export function discoveryContent(item: DiscoveryProduct) {
  const product = item.kind === "product" ? findProduct(item.slug) : undefined;
  const service = item.kind === "service" ? findService(item.slug) : undefined;
  return {
    features: (product ?? service)!.features,
    status:
      product?.status ?? "Website service · illustrative website demonstration",
    disclosure:
      product?.disclosure ??
      "The website preview is a local illustration using fictional content. Website development is a service; final scope, integrations and delivery are agreed in a quotation.",
    demoHref:
      item.kind === "service" ? `/services/${item.slug}#experience` : undefined,
    consultationHref: enquiryHref(item.kind, item.slug, true),
    enquiryHref: enquiryHref(item.kind, item.slug),
  };
}
