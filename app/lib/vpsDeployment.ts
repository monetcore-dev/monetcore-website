/** Server-side attestation only. Nginx must overwrite headers and Node must bind
 * to loopback. Never set these variables behind an untrusted/public Node port. */
export function isTrustedVpsProduction() {
  return process.env.NODE_ENV === "production" &&
    process.env.MONETCORE_VPS_PRODUCTION === "true" &&
    process.env.MONETCORE_VPS_PROXY_VERIFIED === "true" &&
    !process.env.VERCEL && !process.env.VERCEL_ENV && !process.env.VERCEL_GIT_COMMIT_REF &&
    process.env.MONETCORE_STAGING === undefined && process.env.MONETCORE_VPS_REVIEW === undefined;
}

export function vpsProductionOrigin(request: Request): string | null {
  if (!isTrustedVpsProduction()) return null;
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto");
  if (host !== "monetcore.dev" || protocol !== "https" ||
      (forwardedHost !== null && forwardedHost !== "monetcore.dev")) return null;
  // Trusted ingress overwrites these exact fields, never appends client values.
  return "https://monetcore.dev";
}
