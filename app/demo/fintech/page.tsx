import { permanentRedirect } from "next/navigation";
/** Retired public demo URL; preserve bookmarks without advertising an unfinished app. */
export default function RetiredFintechDemo() {
  permanentRedirect("/products/fintech-products");
}
