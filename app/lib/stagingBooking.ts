import "server-only";
import { isReviewPreview, isStagingBookingEnabled } from "./previewSafety";

/** Never return identifiers or credentials to clients/logs. */
export function assertBookingIntegrationsAllowed() {
  if (!isReviewPreview()) return;
  if (!isStagingBookingEnabled()) throw new Error("Staging booking disabled");
  const calendar = process.env.STAGING_BOOKING_EXPECTED_CALENDAR_ID;
  const account = process.env.STAGING_BOOKING_EXPECTED_SERVICE_ACCOUNT_EMAIL;
  if (
    !process.env.MONETCORE_DB_PASSWORD ||
    process.env.STAGING_BOOKING_EXPECTED_DATABASE !== "monetcore_db" ||
    !calendar ||
    calendar !== process.env.GOOGLE_CALENDAR_ID ||
    !account ||
    !account.endsWith(".iam.gserviceaccount.com") ||
    account !== process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !process.env.GOOGLE_PRIVATE_KEY ||
    process.env.MONETCORE_EMAIL !== "hello@monetcore.dev" ||
    !process.env.MONETCORE_EMAIL_PASSWORD ||
    process.env.STAGING_BOOKING_CALENDAR_EXCLUSIVE !== "true" ||
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN ||
    (process.env.RATE_LIMIT_KEY_SECRET?.length ?? 0) < 32
  ) {
    throw new Error("Staging booking configuration incomplete");
  }
  stagingBookingRecipients();
}

export function stagingBookingRecipients() {
  const addresses = (process.env.STAGING_BOOKING_TEST_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase());
  if (
    !addresses.length ||
    addresses.some(
      (value) => !/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value),
    )
  )
    throw new Error("Staging recipient configuration incomplete");
  return addresses;
}

export function bookingAccessError() {
  if (!isReviewPreview()) return null;
  if (!isStagingBookingEnabled())
    return Response.json(
      {
        error: "Booking is disabled in this review preview.",
        outcome: "not_created",
      },
      { status: 403 },
    );
  try {
    assertBookingIntegrationsAllowed();
    return null;
  } catch {
    return Response.json(
      {
        error:
          "Staging booking is not ready. Please contact the site administrator.",
        outcome: "not_created",
      },
      { status: 503 },
    );
  }
}
