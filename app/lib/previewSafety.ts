/** Vercel sets VERCEL_ENV=preview for branch/PR deployments. */
export function isReviewPreview() {
  return process.env.VERCEL_ENV === "preview";
}

export const previewFormMessage =
  "Review preview: form submissions and booking availability are disabled. No enquiry, email or booking has been sent. WhatsApp, telephone and email links contact Monetcore directly.";
