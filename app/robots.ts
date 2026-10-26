import type { MetadataRoute } from "next";
import { isReviewPreview } from "./lib/previewSafety";
import { siteOrigin } from "./lib/metadata";
export default function robots(): MetadataRoute.Robots {
  return isReviewPreview()
    ? { rules: { userAgent: "*", disallow: "/" } }
    : {
        rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/customer"] },
        sitemap: `${siteOrigin}/sitemap.xml`,
      };
}
