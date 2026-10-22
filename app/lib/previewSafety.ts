/** Vercel sets VERCEL_ENV=preview for branch/PR deployments. */
export function isReviewPreview() {
  return process.env.VERCEL_ENV === "preview" ||
    process.env.MONETCORE_DEPLOYMENT_ENV === "review";
}

export const previewFormMessage =
  "Review preview: form submissions and booking availability are disabled. No enquiry, email or booking has been sent. WhatsApp, telephone and email links contact Monetcore directly.";

/** Server-only opt-in; never changes production behavior or booking guards. */
export function isStagingContactEnabled() {
  return (
    isReviewPreview() &&
    process.env.STAGING_CONTACT_ENABLED === "true" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/monetcore-stage1-websites"
  );
}

/** Explicit opt-in on exactly one non-production branch. */
export function isStagingBookingEnabled() {
  return (
    isReviewPreview() &&
    process.env.STAGING_BOOKING_ENABLED === "true" &&
    process.env.VERCEL_GIT_COMMIT_REF === "feature/monetcore-stage1-websites"
  );
}
