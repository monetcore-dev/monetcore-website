import { isTrustedVpsProduction, vpsProductionOrigin } from "./vpsDeployment";
/** Identify Vercel previews and the private VPS review environment. */
export function isReviewPreview() {
  return (
    process.env.VERCEL_ENV === "preview" ||
    ((process.env.MONETCORE_STAGING !== undefined || process.env.MONETCORE_VPS_REVIEW !== undefined) &&
      process.env.VERCEL_ENV !== "production")
  );
}

export const previewFormMessage =
  "Review preview: form submissions and booking availability are disabled. No enquiry, email or booking has been sent. WhatsApp, telephone and email links contact Monetcore directly.";

/**
 * Only an explicitly authorized VPS review may activate test integrations.
 * Vercel deployments must never qualify.
 */
function isAuthorizedVpsReview() {
  return (
    process.env.MONETCORE_STAGING === "true" &&
    process.env.MONETCORE_VPS_REVIEW === "true" &&
    process.env.MONETCORE_VPS_PROXY_VERIFIED === "true" &&
    !process.env.VERCEL_ENV &&
    !process.env.VERCEL &&
    !process.env.VERCEL_GIT_COMMIT_REF &&
    process.env.NODE_ENV === "production"
  );
}

export function isStagingContactEnabled() {
  return (
    isAuthorizedVpsReview() &&
    process.env.STAGING_CONTACT_ENABLED === "true"
  );
}

export function isStagingBookingEnabled() {
  return (
    isAuthorizedVpsReview() &&
    process.env.STAGING_BOOKING_ENABLED === "true"
  );
}

/** Only the dedicated VPS's verified, loopback-only Nginx ingress may supply
 * external origin metadata. Never enable the attestation behind an untrusted
 * proxy; Nginx must overwrite Host/forwarded headers, not append client values.
 */
export function submissionOrigin(request: Request): string | null {
  if (isTrustedVpsProduction()) return vpsProductionOrigin(request);
  const url = new URL(request.url);
  if (!isAuthorizedVpsReview()) return url.origin;
  const canonical = "https://review.monetcore.dev";
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const protocol = request.headers.get("x-forwarded-proto");
  if ((host !== null && host !== "review.monetcore.dev") ||
      (forwardedHost !== null && forwardedHost !== "review.monetcore.dev") ||
      (protocol !== null && protocol !== "https")) return null;
  if (url.origin === canonical) return canonical;
  return host === "review.monetcore.dev" && protocol === "https" ? canonical : null;
}
