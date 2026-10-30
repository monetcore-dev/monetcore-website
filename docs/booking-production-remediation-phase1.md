# Booking production remediation Phase 1 — LOCAL CANDIDATE ONLY

Foundation: `8f83bb2f2376574536e5aaf534cc52cb249fe9d5`.
No deployment, production configuration, schema application or live provider test
is approved by this source change. The premium website remains unchanged.

## Root causes and chosen local architecture

The foundation rejected all Vercel database access and hardcoded localhost
PostgreSQL. Its production booking path also returned success after incomplete
Calendar/mail/tracking and limited honest uncertainty handling to staging.
Same-slot uniqueness was present, but request identity and external-attempt state
were not durable. A database write, Calendar request and SMTP acceptance cannot
be one ACID transaction.

The candidate keeps the existing `pg` dependency and repository. On Vercel it now
requires an explicitly configured remote PostgreSQL connection with expected
host/user, strict TLS verification and a one-connection per-process pool. There
is no fallback to localhost on Vercel. URI query parameters cannot override TLS.
No database URL, password, certificate or private key is committed. Outside
Vercel, the original guarded local VPS connection is retained. Review endpoints
and helpers remain fail-closed; Vercel Preview never qualifies for staging.

An existing Supabase project is PostgreSQL and can in principle host these SQL
contracts. This does NOT prove that this project's version, pooler, TLS chain,
custom login role, grants or networking have been verified. A Supabase API
service-role key is NOT a PostgreSQL password. This candidate does not use the
old Supabase HTTP SDK or copy its credentials into a PostgreSQL URL.

Before adopting this architecture, the owner must approve the remote login role,
pooler/endpoint, migration and privileges. If preserving the HTTP adapter instead
is preferred, stop for that alternative architecture review rather than mixing
adapters or bypassing RLS. No production role or infrastructure was created.

## Required configuration — names only

- `BOOKING_DATABASE_URL`: server-only PostgreSQL URL for an approved least-privilege
  login role and database; password URL-encoded. No URI SSL query overrides.
- `BOOKING_DATABASE_EXPECTED_HOST`: exact approved DNS hostname, not a wildcard,
  localhost or IP literal. Prefer an approved Supabase pooler compatible with
  serverless IPv4/connection limits; verify actual project support.
- `BOOKING_DATABASE_EXPECTED_USER`: exact approved connection username, including
  any required pooler project suffix. Never use postgres or Supabase admin users.
- `BOOKING_DATABASE_CA_PEM`: optional trusted provider CA certificate if required;
  otherwise normal Node CA verification is used. `rejectUnauthorized` stays true.
- Existing email/Calendar names remain: `MONETCORE_EMAIL`,
  `MONETCORE_EMAIL_PASSWORD`, `GOOGLE_CALENDAR_ID`,
  `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`.
- Existing shared limiter: `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_KEY_SECRET`, `RATE_LIMIT_REQUIRED`.
- Existing VPS-only review markers, expected resources, recipient allowlist and
  exclusivity requirements remain; they must not be spoofed to activate Vercel.
- Keep `AI_ASSISTANT_ENABLED`, `AI_OWNER_TEST_ENABLED`,
  `STAGING_AI_ASSISTANT_ENABLED` absent/false; no AI integration was changed.

These are future operator configuration requirements, not instructions to change
Production now. Missing remote configuration or untrusted TLS fails closed.
Max one connection per server process is not a global database connection cap.
Statement/query limits and transaction-pooler compatibility require actual
provider verification; no session settings or named prepared statements are
required by the remote repository path.

## Durable schema proposal — explicit approval required

`002_booking_request_journal.sql` creates a new request journal, not a replacement
booking table. DO NOT run migration001 against an existing Supabase project.
First verify the existing booking columns/types, UUID default, active-slot unique
index/predicate and permissions. Current local migration001 is a contract fixture,
not an independently verified dump of the production database.

The journal binds one random request UUID and canonical request hash to one
booking UUID. Provider states are pending/started/accepted/uncertain. The journal
contains no copied customer message/email, but identifiers and request hashes are
still personal-data-related and private. RLS is enabled. PUBLIC/anon/authenticated
access is revoked; the proposal grants the pre-existing `monetcore_app` role
server access and proposes server-only policies on both tables. No login role or
password is created. Remote usernames/roles must match the approved grants and
must not be superusers, table owners or BYPASSRLS roles. Inspect default grants,
role membership, schema USAGE and existing policies rather than assuming them.

Migration002 is versioned/apply-once: rerunning refuses the existing table and
rolls back. It does not silently adopt schema drift or overwrite data. Any
pre-existing name/policy conflict must be reviewed. The journal references the
booking with ON DELETE CASCADE, so separately authorized manual booking retention
deletion also removes its request metadata; there is no automated retention job.
No booking rows, slot index or production permissions were changed in this task.
The SQL is a proposed future permissions change and must be reviewed as such.

Reservation + request identity use one pinned PostgreSQL connection and explicit
BEGIN/COMMIT/ROLLBACK, with a transaction advisory lock per request UUID. The
existing unique index remains the authority for two different requests competing
for one active date/time. A lost COMMIT acknowledgement is read back by request
identity; absence/unavailable readback is unknown, never proof of no reservation.
Broken/uncertain connections are discarded. No write is automatically retried.

## Customer and operation states

| State | API/UI | Recovery |
|---|---|---|
| Rejected before persistence | `not_created`, 4xx or guarded503 | Correct the error; no reservation claim |
| Persistence uncertain | `unknown`,503, request reference | No blind resubmission; staff verify durable identity |
| Saved, external operations not attempted | `reserved_incomplete`,202, fulfillment pending_external_operations | Same-key replay can claim pending operations exactly once |
| Started/uncertain external operation or tracking problem | `reserved_incomplete`,202, reconciliation_required | No automatic resend/reclaim; administrator review |
| Reservation active, all required provider and tracking receipts accepted | `confirmed`,201, success true | Same-key replay returns the same booking, no repeated effects |

The legacy bookings.status=confirmed means an active reserved slot, not complete
external fulfilment; always use the journal state for customer confirmation.

A successful SMTP result means acceptance, not inbox delivery. Emails acknowledge
that a reservation was recorded; they do not falsely promise full confirmation
before all receipts are verified. Admin notifications include processing flags.
Calendar IDs are deterministic in production and staging. No attendee invitations
are sent. Message-IDs are deterministic aids for lookup, NOT a guarantee that an
SMTP provider deduplicates messages.

Each provider intent is durably changed pending→started before the provider call.
Only a caller that receives a successful claim acknowledgement may execute it.
Accepted results and booking tracking must be recorded before that operation is
accepted. Provider/receipt uncertainty never resets the state automatically.
Concurrent same-key calls can work on different pending operations, but cannot
claim the same operation twice. There are no expiring leases that silently resend
emails after a crash. Calendar calls use explicit timeout/no SDK retries; SMTP
retains existing transport timeouts and no application retry loop.

The browser keeps a random request identity in memory for the current intent.
No customer data or booking identity was added to browser storage. Correctable
validation retries preserve the key; full confirmation clears it. Reload loses
this local reference, so an uncertain customer must keep the displayed reference
and contact staff. This is request idempotency, not a claim of global deduplication
for separately created request keys or different intentional appointments.

## Safe administrator reconciliation — not activated

`reconciliation-inspection.sql` is read-only and omits customer names/messages.
`bookingRecoveryPlan` computes state/references without provider calls or writes.
No public admin endpoint, background worker or automatic resend action is added.

1. An authorized operator on the approved database inspects incomplete records,
   including started states even when reconciliation_required is false.
2. Establish whether the original request/function is still running before any
   separately approved write. Never expire/reset a started claim just by age.
3. For Calendar uncertainty, inspect the deterministic event ID in the expected
   calendar; match private booking ID AND date/time/duration. A404 is not evidence
   until the correct calendar/account is independently confirmed.
4. For email uncertainty, use the deterministic Message-ID and approved mailbox/
   provider evidence. If acceptance cannot be established, keep it unresolved.
   Never automatically resend on timeout or assume an error means no delivery.
5. Any receipt repair, Calendar retry or email resend needs explicit operator
   authorization after that evidence. Never delete the booking to force a retry.
6. Same-key continuation may run only never-attempted pending operations. It must
   not reset accepted/started/uncertain states or create another reservation.
7. Monitor pending and uncertain records and fulfil the manual retention policy.
   This procedure requires an assigned operational owner before production.

This deliberately does not promise exactly-once SMTP delivery or automatic
recovery from every external ambiguity. Safe manual reconciliation is required
where providers do not expose a reliable idempotent outcome.

## Rate-limit and provider verification gates

Require durable public enforcement before activation: owner verifies
RATE_LIMIT_REQUIRED=true, approved isolated/shared backend selection, trusted
Vercel client-IP metadata and Redis EVAL/INCR/PEXPIRE/PTTL permissions. Missing or
unavailable required controls must return503 before persistence. No Upstash
instance, including existing booking staging, was contacted in this work.

Real Supabase pooler DNS/TLS/CA, role permissions/RLS, current index definition,
transactions across serverless instances, SMTP acceptance/mailbox arrival,
Google Calendar permissions/timezone/exclusive-use or busy-time policy, runtime
request-origin representation and function-duration budget remain unverified.
Calendar timeout is10seconds; sequential SMTP operations can consume their
existing timeouts. Verify the actual platform duration budget; termination is
handled conservatively by durable started/unknown states, not silently retried.

## Proposed privacy wording — DRAFT, NOT PUBLICATION APPROVED

Replace the VPS-specific hosting claim only after owner review, for example:

> The website uses hosting infrastructure to serve its pages and server-side
> functions. Enquiries are sent using Namecheap Private Email. The consultation
> implementation stores reservation information in PostgreSQL and uses Google
> Calendar for appointment information. Shared rate limiting is used where
> configured. Our approved deployment and provider records identify the services
> actually used; provider locations and processing arrangements require review.

> Booking request references, request hashes and operation states may be stored
> with reservation records to prevent duplicate processing and support manual
> reconciliation. These records follow the applicable booking retention policy;
> the website does not run an automated deletion schedule.

Do not publish this draft as a verified provider inventory or completed legal
arrangement. Preserve the approved address,12-month retention,privacy contact and
separate marketing opt-in. `app/privacy/page.tsx` is intentionally unchanged.
