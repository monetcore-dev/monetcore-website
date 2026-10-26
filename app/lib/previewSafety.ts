/** Identify Vercel previews and the private VPS review environment. */
export function isReviewPreview() {
  return (
    process.env.VERCEL_ENV === "preview" ||
    (process.env.MONETCORE_STAGING === "true" &&
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
