import type { Metadata } from "next";
import { services, products } from "../config/offeringCatalog";
export const siteOrigin = "https://monetcore.dev";
export const publicRoutes = [
  "/",
  "/services",
  "/products",
  "/product-showcase",
  "/about",
  "/contact",
  "/privacy",
  "/book",
  "/website-packages",
  "/products/fintech-products",
  ...services.map((item) => `/services/${item.slug}`),
  ...products.map((item) => `/products/${item.slug}`),
];
// Product concept pages remain navigable, but are not advertised for indexing.
export const indexableRoutes = publicRoutes.filter(
  (path) => !products.some((product) => path === `/products/${product.slug}`),
);
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
