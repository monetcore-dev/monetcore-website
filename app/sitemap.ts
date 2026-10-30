import type { MetadataRoute } from "next";
import { indexableRoutes, siteOrigin } from "./lib/metadata";
import { isReviewPreview } from "./lib/previewSafety";
export default function sitemap(): MetadataRoute.Sitemap {
  return isReviewPreview()
    ? []
    : indexableRoutes.map((path) => ({
        url: `${siteOrigin}${path === "/" ? "" : path}`,
      }));
}
