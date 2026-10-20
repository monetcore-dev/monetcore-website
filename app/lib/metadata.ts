import type { Metadata } from "next";
import { services, products } from "../config/offeringCatalog";
export const siteOrigin = "https://monetcore.dev";
export const publicRoutes = [
  "/",
  "/services",
  "/products",
  "/about",
  "/contact",
  "/book",
  "/website-packages",
  "/demo/fintech",
  ...services.map((item) => `/services/${item.slug}`),
  ...products.map((item) => `/products/${item.slug}`),
];
export function pageMetadata(
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Monetcore System Solutions`,
      description,
      url: path,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Monetcore System Solutions — Business Technology",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Monetcore System Solutions`,
      description,
      images: ["/og-image.png"],
    },
  };
}
