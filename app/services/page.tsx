import { pageMetadata } from "../lib/metadata";
import OfferingOverview from "../components/catalog/OfferingOverview";
export const metadata = pageMetadata(
  "/services",
  "Technology Services",
  "Explore Monetcore AI automation, custom software, websites, integrations, mobile apps, digital marketing and technology consulting.",
);
export default function ServicesPage() {
  return <OfferingOverview kind="services" />;
}
