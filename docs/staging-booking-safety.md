# Controlled booking staging: implementation and activation checklist

Prepared 21 October 2026 on feature/monetcore-stage1-websites. Initial implementation
approval excluded deployment. The subsequent Preview-only deployment approval
requires booking to remain disabled and all final checks to pass. No activation,
environment changes or live integration tests are authorized. Existing schema
draft artifacts are separate.

## New settings (all unset/disabled by default)

Configure only after separate activation approval, in Vercel Preview scope restricted
to feature/monetcore-stage1-websites. Do not edit Production or override VERCEL_ENV.

| Variable | Meaning |
| --- | --- |
| STAGING_BOOKING_ENABLED | Explicit `true` opt-in; leave absent/false now |
| STAGING_BOOKING_EXPECTED_SUPABASE_PROJECT_REF | Reviewed project reference for monetcore-booking-staging, not its display name |
| STAGING_BOOKING_EXPECTED_CALENDAR_ID | Exact ID of Monetcore Booking - STAGING, not its display name |
| STAGING_BOOKING_EXPECTED_SERVICE_ACCOUNT_EMAIL | Exact dedicated staging service-account email |
| STAGING_BOOKING_TEST_EMAILS | Comma-separated exact approved addresses, no wildcards/display names; normalized lowercase |
| STAGING_BOOKING_CALENDAR_EXCLUSIVE | `true` only after approving exclusive calendar use described below |

Existing staging credentials remain: NEXT_PUBLIC_SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL,
GOOGLE_PRIVATE_KEY, MONETCORE_EMAIL=hello@monetcore.dev and
MONETCORE_EMAIL_PASSWORD. Keep private keys/passwords/service keys server-only and
in Vercel sensitive storage. No credential values should enter Git/chat/logs.

Durable Redis configuration is mandatory for staging booking and availability:
UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN and RATE_LIMIT_KEY_SECRET (at least
32 characters). Use an approved isolated staging Redis store/token and independent
random HMAC secret. RATE_LIMIT_REQUIRED=true is recommended for consistent policy;
booking staging itself forces shared limiting even if that switch is absent.
No Redis service has been provisioned or cost approved by this change.

Expected identifiers are independent operator-supplied pins, not proof of resource
ownership. Review them against the actual staging dashboards before activation.
Do not set expected identifiers to production resources just to pass checks.
The URL is restricted to the expected HTTPS <project-ref>.supabase.co origin.

## Guards and rate policy

Preview endpoints and integration factories require both exact branch/opt-in and
complete matching configuration. Missing configuration fails 503, disabled/wrong
branch fails 403; no reservation side effects occur. Non-preview production keeps
its existing integration behavior. Other previews remain blocked.

Booking limits stay 10 per 10 minutes; availability 60 per minute. Shared keys use
staging-specific scopes and HMAC client addresses. Redis failure/configuration
failure never falls back to a process-local counter for staging requests. Retain
origin/size checks, validation, honeypot and timing checks. The staging honeypot
returns a generic rejection rather than a fictitious booking success; production
honeypot behavior is unchanged. Keep Vercel deployment protection enabled.

## Outcomes and retry policy

Staging API outcomes:
- not_created: explicit pre-reservation rejection or duplicate-slot response.
- unknown: a database insert was attempted but its outcome cannot be established.
- reserved_incomplete: HTTP 202, success=false; reservation persisted, but Calendar,
  customer/admin SMTP acceptance or tracking persistence is incomplete.
- confirmed: HTTP 201, success=true; reservation and required operations accepted.

Transport/parser failures may be ambiguous. The staging form conservatively locks
resubmission after uncertain submission outcomes. Saved-incomplete responses also
lock submission, retain inputs and show a persistent notice even if another slot
is selected. A reload/new session does not constitute reconciliation: the operator
must check the reservation and provider outcomes first. Duplicate-slot 409 still
refreshes availability and lets the user select another slot for a normal conflict.

The DB continues using confirmed/cancelled because that is the approved schema.
Here confirmed is a slot-reservation state, not proof of downstream completion.
No new DB status/migration is introduced. Tracking timestamps/event ID plus provider
evidence determine completion. Tracking failures are logged by operation/category
only and count as staging incomplete, without removing/repeating side effects.

Calendar requests use a SHA-256-derived event ID from the booking ID in staging.
This is a stable valid Google event ID; no attendees are included, sendUpdates is
none, and messages/events are labelled [STAGING TEST]. Deterministic IDs support
manual lookup/reconciliation; no automatic retry endpoint or event-409 recovery is
introduced. Do not blindly regenerate an event after an ambiguous timeout.

Customer emails must exactly match the server allowlist before insertion.
Administrator mail is locked to hello@monetcore.dev. SMTP accepted/rejected results
are checked. Customer staging messages say reservation recorded, not unconditional
confirmation. SMTP acceptance does not prove inbox delivery. Neither failed nor
uncertain SMTP sends are automatically repeated. Inspect mailbox/provider evidence
before approving a manual resend; exactly-once delivery is not guaranteed.
Check provider mailbox forwarding/auto-reply rules separately; code cannot control
those rules after mail reaches an approved address.

## Calendar conflict policy

For initial staging, the dedicated calendar MUST be used exclusively by this booking
system: no manually entered busy appointments, competing schedulers or independent
calendar writers. Availability uses Supabase reservations and WAT weekday slots,
not Google free/busy. The acknowledgement flag is an operator assertion, not an
API-enforced calendar ACL. If exclusive use cannot be guaranteed, do not activate;
approve a busy-time/conflict strategy first. Single-resource hourly starts and
30/45-minute durations remain the supported booking model.

## Controlled test sequence — requires separate deployment/activation approval

1. Review local code/tests and approve a preview deployment only. Keep opt-in false.
2. Review staging resource identifiers, exact DB unique index/RLS/grants, calendar
   permissions/exclusivity, mailbox rules, recipient list and isolated Redis costs.
3. Enter approved Preview/branch-only settings securely. Leave production untouched.
4. After explicit activation approval, set booking opt-in true and redeploy this
   protected preview. Default builds and ordinary previews must still deny booking.
5. Test validation and unauthorized recipients first: no reservation/event/email.
   Test missing/mismatched configuration and Redis outage only in a separate safe
   configuration; do not alter production or repeatedly attempt bad SMTP passwords.
6. Submit one synthetic future weekday appointment using an approved recipient.
   Verify DB row, deterministic Calendar event, test mailbox and tracking fields.
   Confirm WAT, requested service/product context and no customer invitations.
7. Test two simultaneous submissions to one staging slot: one booking/Calendar
   event/notification set; the loser 409. Verify cancellation/rebooking separately
   only through an explicitly approved operator action; no cancellation API exists.
8. Exercise partial/ambiguous outcomes using mocks first. For any authorized live
   failure scenario, keep the row, verify the UI warning/lock and reconcile by
   booking ID/provider evidence. Do not automatically resend mail or resubmit.
9. Review desktop/mobile interactions and recorded acceptance/inbox evidence.
10. Disable opt-in and redeploy preview after testing. Verify 403 and retain only
    approved synthetic evidence. Cleanup of external rows/events needs approval.

## Local verification

npm test includes guard/resource/recipient/Redis/duplicate/partial/failure/retry
regressions using synthetic env values and mocked integrations. The test loader
stubs only the server-only marker to exercise actual integration factory guards;
application bundling keeps the real server-only boundary.

Run tests/browser-booking-outcomes.mjs and browser-booking-conflicts.mjs only against
an optimized local preview-mode build. APIs remain disabled; browser interception
simulates responses without contacting providers. The new outcome test covers
390/1440px incomplete/unknown/confirmed responses, persistent retry lock, preserved
inputs, no overflow/errors and actual default API rejection.

Live Supabase, Google Calendar, SMTP/Redis credentials and hosted integration success
are not verified by mocked/local checks. There is no durable outbox, delivery
idempotency guarantee or automated recovery worker. These remain launch decisions.

Executed verification for this implementation: ESLint, TypeScript, optimized
production build in preview mode with booking explicitly false, 19 application
test groups and nine offline staging groups passed. Focused Chromium programs
browser-booking-outcomes and browser-booking-conflicts passed at 390/1440px using
intercepted API responses; no real-device/Safari or external provider test is
claimed. Default local booking and availability API requests returned 403.
Application contact/SMTP enquiry code, pricing/configuration, AI Core and existing
schema artifacts were not modified by this implementation. No commit/push or
remote deployment/activation has been performed.

## Final Preview preparation review

Final TypeScript, ESLint, npm test (19 groups), offline staging (nine groups), and
optimized preview-mode build passed with STAGING_BOOKING_ENABLED=false. Both
focused browser programs passed again at 390/1440px with intercepted responses.
Actual local Preview booking/availability requests returned 403. Direct integration
factory checks with the opt-in absent and false both threw before network access.

The 17-file commit scope excludes the four previously prepared schema SQL/review
artifacts. Targeted credential-pattern scanning found no matches; no .env, key or
credential files are included. Contact enquiry code, pricing, AI Core, dependency
lockfile and deployment configuration are unchanged. The existing branch Preview
redirects to Vercel SSO. Private Vercel variable configuration cannot be inspected
with the available access; operator confirmation of absent/false booking opt-in
is required before pushing. This document does not claim that deployment occurred.
