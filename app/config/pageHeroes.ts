/** Decorative themes only: no claims of live processing or product availability. */
export const serviceHeroVisuals = {
  "ai-automation": "neural",
  "software-development": "code",
  "website-development": "devices",
  "business-integrations": "network",
  "mobile-app-development": "mobile",
  "digital-marketing": "marketing",
  "technology-consulting": "strategy",
} as const;
export const productHeroVisuals = {
  "ai-lead-automation": "pipeline",
  "smart-booking": "calendar",
  "ai-receptionist": "receptionist",
  crm: "workspace",
  "business-automation": "workflow",
  "ai-marketing-manager": "campaign",
} as const;
export type PageHeroVisual =
  | (typeof serviceHeroVisuals)[keyof typeof serviceHeroVisuals]
  | (typeof productHeroVisuals)[keyof typeof productHeroVisuals]
  | "company"
  | "contact"
  | "privacy"
  | "portfolio"
  | "fintech";
export const internalHeroRoutes = {
  "/about": "company",
  "/contact": "contact",
  "/book": "calendar",
  "/privacy": "privacy",
  "/assistant": "neural",
  "/website-packages": "devices",
  "/product-showcase": "portfolio",
  "/services": "network",
  "/products": "portfolio",
  "/products/fintech-products": "fintech",
  ...Object.fromEntries(
    Object.entries(serviceHeroVisuals).map(([slug, visual]) => [
      `/services/${slug}`,
      visual,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(productHeroVisuals).map(([slug, visual]) => [
      `/products/${slug}`,
      visual,
    ]),
  ),
} satisfies Record<string, PageHeroVisual>;
