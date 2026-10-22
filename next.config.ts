import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Opt-in only; the existing Vercel build remains unchanged.
  ...(process.env.MONETCORE_BUILD_TARGET === "cpanel" ? { output: "standalone" as const } : {}),
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
          ...((process.env.VERCEL_ENV === "preview" || process.env.MONETCORE_DEPLOYMENT_ENV === "review")
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
