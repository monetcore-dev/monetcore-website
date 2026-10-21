import { pageMetadata } from "../../lib/metadata";
export const metadata = pageMetadata(
  "/demo/fintech",
  "MonePay Interactive Fintech Demo",
  "Explore a fictional fintech prototype by Monetcore System Solutions. Payments, balances, savings and loan examples are simulated; no real money moves.",
);
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
