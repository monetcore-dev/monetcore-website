import type { MetadataRoute } from "next";
import { publicRoutes, siteOrigin } from "./lib/metadata";
import { isReviewPreview } from "./lib/previewSafety";
export default function sitemap(): MetadataRoute.Sitemap {
  return isReviewPreview()
    ? []
    : publicRoutes.map((path) => ({
        url: `${siteOrigin}${path === "/" ? "" : path}`,
      }));
}
