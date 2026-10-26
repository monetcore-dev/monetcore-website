import "server-only";
export const customerOrigin = "https://review.monetcore.dev";
export class CustomerError extends Error {
  status: number;
  category: string;
  constructor(status: number, category: string) {
    super(category);
    this.status = status;
    this.category = category;
  }
}
/** Phase 2 is review-VPS only. No production or Vercel activation path. */
export function customerEnabled() {
  return (
    process.env.CUSTOMER_PLATFORM_ENABLED === "true" &&
    process.env.NODE_ENV === "production" &&
    process.env.MONETCORE_STAGING === "true" &&
    process.env.MONETCORE_VPS_REVIEW === "true" &&
    process.env.MONETCORE_VPS_PROXY_VERIFIED === "true" &&
    !process.env.VERCEL &&
    !process.env.VERCEL_ENV &&
    !process.env.VERCEL_GIT_COMMIT_REF &&
    process.env.CUSTOMER_DATABASE_NAME === "monetcore_customer_staging" &&
    !!process.env.CUSTOMER_AUTH_DB_PASSWORD &&
    !!process.env.CUSTOMER_APP_DB_PASSWORD &&
    (process.env.CUSTOMER_AUTH_SECRET?.length ?? 0) >= 32
  );
}
export function assertCustomerEnabled() {
  if (!customerEnabled()) throw new CustomerError(503, "platform_disabled");
}
export function customerRegistrationEnabled() {
  return (
    customerEnabled() &&
    process.env.CUSTOMER_REGISTRATION_ENABLED === "true" &&
    customerEmailEnabled()
  );
}
export function customerEmailEnabled() {
  return (
    customerEnabled() &&
    process.env.CUSTOMER_AUTH_EMAIL_ENABLED === "true" &&
    process.env.CUSTOMER_AUTH_SMTP_USER === "hello@monetcore.dev" &&
    !!process.env.CUSTOMER_AUTH_SMTP_PASSWORD &&
    testEmails().length > 0
  );
}
export function testEmails() {
  return (process.env.CUSTOMER_AUTH_TEST_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
}
export function assertTestEmail(email: string) {
  if (!testEmails().includes(email.toLowerCase()))
    throw new CustomerError(403, "test_recipient_required");
}
/** Trust only the explicitly attested loopback VPS proxy, exact host and HTTPS. */
export function validateCustomerOrigin(request: Request, mutation = false) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const proto = request.headers.get("x-forwarded-proto");
  if (
    host !== "review.monetcore.dev" ||
    (forwardedHost && forwardedHost !== host) ||
    (proto && proto !== "https")
  )
    throw new CustomerError(403, "invalid_origin");
  if (
    url.origin !== customerOrigin &&
    !(
      proto === "https" &&
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)
    )
  )
    throw new CustomerError(403, "invalid_origin");
  const origin = request.headers.get("origin");
  if (
    (mutation && origin !== customerOrigin) ||
    (origin && origin !== customerOrigin)
  )
    throw new CustomerError(403, "invalid_origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (mutation && fetchSite && !["same-origin", "none"].includes(fetchSite))
    throw new CustomerError(403, "invalid_origin");
}
export function customerResponseError(error: unknown) {
  const known = error instanceof CustomerError;
  const status = known ? error.status : 503;
  const category = known ? error.category : "service_unavailable";
  // Category only: never DB errors, identifiers, emails or request bodies.
  if (status >= 500) console.error("Customer platform:", category);
  return Response.json(
    {
      error:
        category === "slot"
          ? "Request unavailable."
          : status === 401
            ? "Please sign in again."
            : status === 403
              ? "You do not have access to this resource."
              : status === 409
                ? "This request was already submitted with different details. Review your request history before retrying."
                : status === 400
                  ? "Please check the form fields."
                  : status === 429
                    ? "Too many requests. Please try again later."
                    : "Customer platform is unavailable. Please contact hello@monetcore.dev.",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 ? { "Retry-After": "900" } : {}),
      },
    },
  );
}
