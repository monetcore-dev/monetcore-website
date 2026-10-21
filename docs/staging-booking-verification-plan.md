# Isolated staging booking verification — proposed, not executed

Prepared 20 October 2026 (Africa/Lagos). Source branch: `feature/monetcore-stage1-websites`; application baseline `30bc4db`. Related assessment: [Phase 3.9 readiness report](phase-3.9-production-readiness.md).

The existing production availability outage is resolved following the owner's resumption of the paused Supabase project. Production availability and contact email are owner-confirmed working. **No availability hotfix is proposed.** This plan verifies the development rebuild without modifying that working production system.

## Owner-confirmed production database metadata — 20 October 2026

The owner completed all seven read-only inspections on production **monetcore-website** and reports: `public.bookings` exists with the expected booking/contact/status/timestamp/Calendar columns; RLS enabled, not forced; owner `postgres`; primary key on `id` and a status check; six indexes, including valid partial unique `unique_active_booking_slot` excluding cancelled bookings; no returned booking RLS policies; table privileges for `anon`, `authenticated`, `postgres`, `service_role`; BYPASSRLS false for anon/authenticated and true for service_role. The paused-project incident remains resolved and production availability/contact remain owner-confirmed working.

These are owner-supplied metadata findings, not new database access by Codex. No customer records were inspected. Exact index keys/expressions/predicate, column types/nullability, status-check expression and privilege lists were not included in the summary. Index existence/validity and RLS configuration are now confirmed by owner evidence; complete slot coverage, effective role permissions and actual concurrent booking behavior remain pending review/staging verification. An empty policy result is recorded as reported, subject to inspector catalog visibility.

See [booking code review and smallest proposed fixes](booking-database-review.md). No production database change or availability hotfix is recommended from the metadata summary. Earlier statements that metadata was wholly uninspected describe the original audit, not the current evidence status.

## Approval and isolation contract

Preparation of this document does not authorize external calls, provisioning, migrations, calendar sharing, mail delivery, cleanup or paid services. Before execution, approve the named staging resources, permitted actions, synthetic test cases, cost/request caps, operators and cleanup scope. Production testing/launch requires separate later approval.

Use an access-controlled local runner bound to loopback with staging-only credentials and a synthetic database, dedicated non-customer calendar, mail sink and isolated shared limiter. Do not clone production records, reuse production secrets, or change production variables, policies, calendar permissions, DNS or infrastructure. Configure secrets only in secure settings. Keep resource identifiers and evidence access restricted; report credential names/status, never values.

Ordinary Vercel previews must remain `VERCEL_ENV=preview`, noindex and blocked from submissions. Do not override the Vercel marker or remove the preview guard. A local runner can exercise non-preview paths using isolated sandbox bindings; it must not be publicly exposed. If hosted staging is preferred, a separate authenticated staging gate and outbound destination restrictions need design and approval first. No such gate is implemented by this documentation update.

The booking handler attempts Calendar and mail after insertion. For each test, explicitly choose real isolated staging adapters or mocks for **all** downstream services. Database-only tests must mock Calendar and SMTP; do not rely on missing credentials to prevent accidental side effects. Mail must remain intercepted or routed to a provider-enforced sink; approved staff inbox delivery, if desired later, needs a separate exact recipient allowlist.

## Step 1 — Confirm the sandbox boundary

- Approve or identify a separate empty Supabase staging project/database, dedicated staging calendar/service identity, mail sink and limiter store. Approve any creation, sharing changes, schema work and costs before performing them.
- Check configuration names and destination identity without printing secret values: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `MONETCORE_EMAIL`, `MONETCORE_EMAIL_PASSWORD`; optional limiter names below.
- Compare destinations against an approved staging allowlist. Restrict the runner's network/adapter destinations and sink recipients; reject unknown destinations before loading the test application. Do not inspect production customer data to prove isolation.
- Record source SHA, runtime, non-secret resource labels, timezone, permitted request counts and test-run identifier. Name synthetic records/events with that identifier. Use generated test data, never copied customers.

Acceptance: isolation can be demonstrated, outbound side effects are controlled and the ordinary review preview remains disabled. Otherwise stop before external calls.

## Step 2 — Establish local controls and schema contract

- Rerun lint, TypeScript and the existing mocked application tests for the approved baseline; record actual outcomes. These are not substitutes for integration tests.
- In staging only, review required booking columns/defaults, database grants/RLS and the active-slot uniqueness rule. Any missing migration must be reviewed and approved before execution. Do not weaken RLS to make a test pass; the current server service-role credential bypasses RLS, so test anonymous/low-privilege access separately.
- Approve how cancellation, slot duration, staff capacity and buffers affect uniqueness. With current hourly starts and 30/45-minute durations, require one active reservation per date/time for the single-resource policy. The owner confirms the production index exists; inspect its exact coverage and the separately approved staging equivalent. Do not infer staging parity or a successful race test from production metadata.

Acceptance: schema contract and permission boundary are documented; a database-enforced atomic constraint exists in staging before concurrency tests are considered meaningful.

## Step 3 — Verify shared limiting before end-to-end submissions

- Approve Upstash REST or an atomic Supabase RPC alternative; do not purchase/provision automatically. The current adapter supports Upstash; a Supabase RPC would require separately approved code/schema work.
- For the existing adapter use staging-only `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_KEY_SECRET`, and `RATE_LIMIT_REQUIRED=true`. No shared production counters or secrets.
- Test from independent local processes: shared counts, endpoint separation, expiry, positive Retry-After and 429. Starting application limits are contact/booking 10 per 10 minutes, availability 60 per minute. Use small limits in a staging-only harness for expiry/burst checks; do not flood a public endpoint or alter production limits.
- Simulate backend timeout, denial, malformed response and missing required configuration. Expect generic 503 with no database insertion, Calendar call or mail delivery; no fallback open. Confirm ordinary preview requests return 403 before accessing Redis.
- Verify trusted platform/proxy header handling for the selected host, pseudonymous keys and TTL expiry. Real Vercel header behavior is a separate hosting verification if tests run locally. Review NAT/shared-address effects, global abuse budgets, cost caps and fail-closed availability trade-offs.

Acceptance: backend atomicity/expiry and cross-process enforcement are evidenced, including rejection before downstream effects. Public rebuild submissions remain disabled while this is unverified.

## Step 4 — Verify booking insertion and validation

With Calendar and SMTP mocked, submit one synthetic future weekday booking through the application against staging Supabase. Check HTTP 201, returned booking id/date/time/type and exactly one matching staging row. Confirm `Africa/Lagos`, permitted status and field values; verify that public availability exposes only times, not customer fields.

Test invalid email, missing name/type/date/time, impossible/past/weekend dates, unsupported slots, malformed/oversized JSON, honeypot and minimum elapsed-time behavior. Rejected validation must produce no booking row or downstream effect; honeypot success is an intentional no-op. Verify normal error responses contain no provider internals or secrets.

Acceptance: one valid request creates one reservation; all rejected/no-op requests leave staging records and downstream systems unchanged.

## Step 5 — Verify atomic duplicate prevention

Use two independent processes with distinct approved test-client identities, staying within the limiter budget. Release two valid requests for the same future slot concurrently. Expect exactly one reservation/201 and one conflict/409, backed by the database constraint, not a client-side lock. Repeat for several distinct synthetic slots within the approved request cap.

Verify sequential same-slot retries, cancelled-slot rebooking under the approved policy, and booking after a stale availability read. Check downstream call counts: only the winning insert may reach Calendar/mail. A cross-request idempotency key is not currently implemented; record existing conflict behavior without calling it replay-safe idempotency. If the first response is lost, verify what the user sees and flag missing reservation recovery.

Acceptance: no duplicate active reservation. Any duplicate is a release blocker; stop and propose a staging-only constraint/application fix for review.

## Step 6 — Verify Calendar synchronization

After approving dedicated-calendar access, enable only the isolated Calendar adapter; keep SMTP intercepted. Test each consultation type with distinct future staging slots. Confirm exactly one event per successful reservation, the stored event id, matching duration/start/end, `Africa/Lagos` display, escaped description, no invitations (`sendUpdates: none`) and no real attendees or generated meeting promise.

Verify both 09:00 WAT → 08:00 UTC conversion and 30/45-minute end times. Inspect the dedicated calendar only. Test permissions/authentication denial using test doubles or a separate staging identity, never by revoking production permissions. A read-only authentication check alone does not prove insertion works.

Manually busy Calendar periods are currently ignored by database-only availability. Approve either an exclusive API-managed calendar policy or separately scoped free/busy integration; do not silently add that functionality during testing.

Acceptance: event/database tracking agree, no unexpected invitations occur and external-conflict behavior is explicitly approved. A failed or duplicate synchronization remains open, even when the database reservation succeeds.

## Step 7 — Verify partial failures and recovery

Inject failures in a controlled staging harness; do not interrupt shared services or alter production access. Record HTTP response, reservation state, provider artifact and tracking timestamps for each case:

| Failure | Expected current behavior / verification |
| --- | --- |
| Database insert rejected/unavailable | Generic failure; no Calendar or mail calls. Existing reservation unchanged on conflict. |
| Calendar denial before event creation | Reservation retained; `calendar.eventCreated=false`; no claim that Calendar synchronization succeeded. |
| Calendar request times out after provider acceptance | Inspect staging for an event before any retry; mark duplicate/reconciliation risk. Do not blindly rerun insertion. |
| Event created, database tracking update fails | Event may exist without a stored tracking id; record and reconcile only the approved staging test id. |
| Customer/admin SMTP failure | Booking retained; individual delivery flags remain accurate; sink may receive only one message. |
| Mail accepted, tracking update or HTTP response lost | Establish actual sink receipt before retry; do not infer non-delivery from missing timestamps or promise exactly-once mail. |
| Same request retried / process interrupted | No duplicate active slot; inspect orphaned side effects and document user recovery behavior. |

No durable outbox, worker, deterministic event id or request-idempotency guarantee is currently implemented. Tests should expose these limits. If automatic recovery is required, propose reservation/outbox transaction, stable provider ids, bounded retries, reconciliation and an operator runbook as a separate reviewed change. Do not classify an unimplemented recovery design as passed. Manual reconciliation must be scoped to staging artifacts; production recovery remains unauthorized.

Acceptance: failures are contained and visible, reservations are not lost, and an approved recovery path exists for ambiguous outcomes. Unresolved duplicate-event/mail or orphaned-booking cases block launch sign-off.

## Step 8 — Verify mail safely and end-to-end behavior

Using the enforced sink only, test the rebuild's contact notification and both booking messages. Check sender, recipient, Reply-To, plaintext content, per-message outcomes and timestamps; no changes to working production SMTP. A sink validates application delivery behavior, not production inbox placement or sender-domain DNS. Any later real test inbox/DNS verification requires its own approved scope.

Run one controlled integrated staging flow with all approved staging adapters: availability → reservation → event → sink messages → tracking. Check loading/error/partial-success guidance, duplicate-click lock, package/planner handoff, keyboard/mobile behavior and no misleading success states. Ordinary previews must still reject all integration endpoints and stay noindex. Preserve approved corporate visuals and existing features.

Acceptance: evidence ties each synthetic request to exactly the intended artifacts and accurately describes partial failures. Record physical-device/browser limits rather than assuming emulation proves them.

## Step 9 — Reconcile, report and request launch decisions

- Inventory only test-run ids in the isolated resources. Clean up only explicitly approved synthetic records/events/sink messages/keys; do not delete unrelated staging or production data. Record any cleanup deferred for owner review.
- Publish a redacted matrix of passed/failed/unverified tests, exact source SHA, environment, response/error categories, duplicate counts and remaining risks. Keep all secret values and personal data out of logs/screenshots.
- Confirm project-status monitoring/runbook and approve a reliable hosting/Supabase plan if needed. Do not upgrade plans or generate keep-alive traffic automatically.
- Resolve remaining launch items: database/RLS/atomic reservation and recovery guarantees, Calendar policy/permissions, shared/global abuse controls, sender configuration, privacy/retention, proposed pricing/renewals, consultation policies, development dependency advisory handling, mobile LCP follow-up and support ownership.
- Request a separate production configuration/integration review and explicit merge/launch authorization. Passing staging does not authorize production writes, deployment or public submission enablement.

## Stop conditions

Stop immediately if a destination is not demonstrably staging, a credential belongs to production, mail can escape the sink/allowlist, permissions/cost caps are unclear, any real customer data appears, the preview guard must be bypassed, or a duplicate/ambiguous side effect cannot be reconciled. Report the minimum sanitized evidence and the decision needed. No external step in this plan has been executed as part of this documentation update.

## Preparation package

Preparation-only approval has produced an [integration/resource audit and execution matrix](staging-preparation-report.md), synthetic fixtures, an offline nine-group harness (`npm run test:staging:local`) and a read-only metadata inspection SQL file. No external step is authorized or executed by that approval. Use the preparation report to approve resource identity, provider costs and exact permitted actions before running this plan.
