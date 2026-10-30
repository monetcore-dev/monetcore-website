import { pageMetadata } from "../lib/metadata";
import OfferingOverview from "../components/catalog/OfferingOverview";
export const metadata = pageMetadata(
  "/products",
  "Products & Applications",
  "Explore Monetcore product categories and concepts, including Fintech Products. Discuss custom software requirements; these are not ready-to-activate applications.",
);
export default function ProductsPage() {
  return <OfferingOverview kind="products" />;
}
