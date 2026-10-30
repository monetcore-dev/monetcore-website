import { pageMetadata } from "../../lib/metadata";
export const metadata = {
  ...pageMetadata(
    "/products/fintech-products",
    "Fintech Products",
    "Discuss financial technology software requirements with Monetcore System Solutions. A product category, not a launched payment application.",
  ),
  robots: { index: false, follow: true },
};
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
