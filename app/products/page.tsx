import { pageMetadata } from "../lib/metadata";
import OfferingOverview from "../components/catalog/OfferingOverview";
export const metadata = pageMetadata(
  "/products",
  "Products & Applications",
  "Explore Monetcore product concepts, existing prototypes and isolated interactive demonstrations with clear availability and maturity labels.",
);
export default function ProductsPage() {
  return <OfferingOverview kind="products" />;
}
