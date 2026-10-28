import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Opt-in for the secret-free review artifact only; normal builds are unchanged.
  ...(process.env.MONETCORE_REVIEW_ARTIFACT === "true" &&
    process.env.MONETCORE_STAGING === "true" &&
    process.env.MONETCORE_VPS_REVIEW === "true" &&
    !process.env.VERCEL_ENV && !process.env.VERCEL
      ? { output: "standalone" as const } : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          {
            key: "Content-Security-Policy",
            value:
              "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'",
          },
          ...((process.env.VERCEL_ENV === "preview" || (process.env.MONETCORE_STAGING === "true" && process.env.VERCEL_ENV !== "production"))
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
            : []),
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};
export default nextConfig;
