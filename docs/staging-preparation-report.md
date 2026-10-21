# Staging preparation audit — no external execution authorized

20 October 2026 (Africa/Lagos). Branch: `feature/monetcore-stage1-websites`. Application baseline: `30bc4db`; preparation changes are local and uncommitted. The owner confirmed the paused production Supabase project was resumed and availability/contact email work. No availability hotfix or production SMTP change is proposed.

## Scope and evidence

Reviewed the existing API handlers, server-only integration helpers, preview guard, rate limiter, mocked integrations and nine-step staging plan. The managed cloud reports current observations with no integration secret/runtime-variable bindings. This does not describe the actual production or any externally configured staging resources. No provider account, live database, calendar, mailbox, Redis store or pricing endpoint was queried. Resource existence, exact account quotas/prices and database policies cannot be confirmed remotely under preparation-only authorization.

## Owner-confirmed production database metadata — 20 October 2026

The owner completed all seven read-only inspections on production **monetcore-website** and reports: `public.bookings` exists with the expected booking/contact/status/timestamp/Calendar columns; RLS enabled, not forced; owner `postgres`; primary key on `id` and a status check; six indexes, including valid partial unique `unique_active_booking_slot` excluding cancelled bookings; no returned booking RLS policies; table privileges for `anon`, `authenticated`, `postgres`, `service_role`; BYPASSRLS false for anon/authenticated and true for service_role. The paused-project incident remains resolved and production availability/contact remain owner-confirmed working.

These are owner-supplied metadata findings, not new database access by Codex. No customer records were inspected. Exact index keys/expressions/predicate, column types/nullability, status-check expression and privilege lists were not included in the summary. Index existence/validity and RLS configuration are now confirmed by owner evidence; complete slot coverage, effective role permissions and actual concurrent booking behavior remain pending review/staging verification. An empty policy result is recorded as reported, subject to inspector catalog visibility.

See [booking code review and smallest proposed fixes](booking-database-review.md). No production database change or availability hotfix is recommended from the metadata summary. Earlier statements that metadata was wholly uninspected describe the original audit, not the current evidence status.

## Resource reuse and potential costs — decide before provisioning

| Integration | Safe reuse | Isolation required for external staging | Cost/approval exposure |
| --- | --- | --- | --- |
| Supabase | Application code, reviewed schema specification and synthetic fixtures; an already existing empty non-production project only after owner confirms identity/permissions | Separate project/database and server credentials; no production service-role key or production records. Merely using another table in the production project is not the proposed safety boundary. | A new project may exceed available Free-plan allowances; paid project/compute/storage/egress/backups may apply. Verify account allowance and current quote first. Free-plan pause/uptime limitations must be reviewed; do not upgrade automatically. |
| Google Calendar | SDK and date/time logic; an existing demonstrably non-production calendar/service identity after owner approval | Dedicated non-customer calendar, narrowly shared staging identity and staging secret bindings. Do not reuse the production calendar or change its sharing. | Check Calendar API quotas and current provider terms; Workspace/test-account subscriptions or quota expansion may incur costs. No fixed price or guaranteed free capacity is asserted. |
| SMTP | Plaintext templates, validation and mocked transport; local in-memory sink used now | Provider-enforced sink or approved test transport; no production SMTP credentials, real recipients or business notification mailbox during preparation. Current host is fixed to mail.privateemail.com:465, so a local SMTP sink is not configurable without a separate reviewed test adapter. | Existing mock sink costs no additional external service. A real staging mailbox/provider sink may require a paid mailbox/test plan; verify quote and recipient enforcement before approval. Existing production mailbox remains unchanged. |
| Shared limiter | Existing REST adapter and command/response tests; an existing isolated staging Redis database after identity review | Separate store/token/HMAC secret; no production counters or quotas. An atomic staging Supabase RPC is an alternative requiring code/schema approval. | Upstash plan limits, command volume, storage and overages must be quoted/approved. Supabase alternative consumes that project's resources; Vercel WAF features may depend on a paid plan. No resource has been provisioned or activated. |
| Runner | Existing Node 24, installed dependencies, Chromium and local checkout | Loopback-only, access-controlled runner with staging-only outbound allowlist; ordinary Vercel previews stay blocked/noindex | Local preparation adds no new paid service or dependency. Hosted staging, CI, monitoring and retention may have plan-dependent costs. |

Account ownership, billing tier, staging resource identifiers, region, quotas and remaining allowances are **unverified**. Approve the provider choice and a spending cap before any provisioning. Proposed external test caps for approval: at most 120 application requests, 20 synthetic inserted reservations, 20 isolated Calendar events and 40 sink-only messages; no load test or real inbox delivery. Catalog inspection uses seven metadata queries. Existing per-address limits still apply: schedule tests across windows or use a separately reviewed local harness; do not weaken public limits or spoof platform headers to avoid them. Actual counts must be recorded, and the run stops at its approved cap.

## Configuration requirements

- Supabase: `NEXT_PUBLIC_SUPABASE_URL` and private `SUPABASE_SERVICE_ROLE_KEY`, pointing only to the approved staging project.
- Calendar: `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, private `GOOGLE_PRIVATE_KEY`; current broad scope and calendar writer access require least-privilege review. No domain-wide delegation is required by this code.
- SMTP: `MONETCORE_EMAIL`, private `MONETCORE_EMAIL_PASSWORD`; these currently identify both authenticated sender and administrative recipient. Staging recipient routing must be enforced, not assumed from synthetic user input alone.
- Existing Redis adapter: `UPSTASH_REDIS_REST_URL`, private `UPSTASH_REDIS_REST_TOKEN`, private `RATE_LIMIT_KEY_SECRET` (at least 32 characters), `RATE_LIMIT_REQUIRED=true` in the approved integration runner. No new variables are set in Vercel by preparation.
- `VERCEL_ENV=preview` must continue blocking all three APIs. Never relabel a Vercel preview to enable submissions. A hosted staging exception needs a separately approved design; local mock tests use no provider bindings.

## Database contract and owner-confirmed metadata; coverage review pending

The source inserts into `public.bookings` through a server-only service-role client and reads only `booking_time` for public availability. The service role bypasses RLS: enabled RLS alone does not constrain that credential. Codex did not read live metadata; the owner now confirms the expected columns, RLS settings, grants presence and valid partial unique index. Exact types/nullability/index/check/grant definitions were not supplied. Below is the source-derived contract against which to review those definitions; it does not replace the confirmed metadata.

| Fields | Required contract / review |
| --- | --- |
| `id` | Server-generated unique non-null id; application omits it on insert and expects it back. Confirm actual UUID/identity type and default. |
| `booking_date`, `booking_time`, `timezone` | Non-null canonical date/time; prefer DATE and normalized TIME WITHOUT TIME ZONE plus agreed Africa/Lagos context. If text is retained, enforce one representation so alternate time strings cannot bypass uniqueness. |
| `consultation_type`, `name`, `email` | Required values, bounded text; types/durations match the server whitelist. Database constraints complement API validation. |
| `phone`, `company`, `service`, `message` | Nullable optional fields; approved lengths and data minimization. |
| `status` | Non-null, business-approved allowed states. Current insert is confirmed; cancelled is excluded from availability. NULL/unknown states must not silently escape visibility or uniqueness. |
| `google_calendar_event_id` | Nullable identifier; review uniqueness where relevant for reconciliation. |
| `google_calendar_event_created_at`, `confirmation_sent_at`, `admin_notification_sent_at`, `updated_at` | Compatible timestamp fields, preferably TIMESTAMPTZ; tracking is partial-failure evidence, not proof of exactly-once delivery. |

Atomic reservation requirement: a database-enforced unique active-slot constraint on date/time for the approved single-resource policy. The application handles SQLSTATE 23505 as HTTP 409 but does not create or verify the constraint. A partial index excluding cancelled reservations needs compatible non-null status semantics. For multiple staff/resources, variable starts or overlapping durations/buffers, approve resource keys/range exclusion instead. A read-then-insert check or a client button lock cannot guarantee atomicity. No DDL or migration was executed or prepared for automatic application.

Permissions review checklist: confirm table owner, RLS enabled/forced status, policy predicates/roles, table and schema grants, server role privileges, default grants, and any function/sequence privileges used by the chosen schema. Deny anonymous/authenticated customer-data access unless a specifically approved workflow requires it; verify using staged low-privilege identities, not only service-role tests. Restrict server functions/search paths and SECURITY DEFINER use if introduced. Catalog visibility varies by inspection role; an empty result is not proof of absent policies/grants. Backups, retention/deletion and permitted staff access still need owner approval.

Prepared `scripts/staging/schema-inspection.sql` uses a read-only transaction, short statement/lock timeouts, metadata views/catalogs and ROLLBACK. It selects **no booking/customer rows** and performs no DDL/DML. It is a reviewed starting point, not a complete privileges auditor. Codex has not executed it or database-syntax-validated it against PostgreSQL. The owner separately completed the seven production metadata inspections summarized above; staging metadata has not been inspected. There is deliberately no connection string or automatic SQL runner; even metadata inspection requires explicit staging-target approval.

## Prepared local artifacts and safe commands

- `tests/staging/fixtures.mjs`: synthetic name/company, reserved `.invalid` address, future weekday generated from the clock, valid/duplicate/invalid/honeypot payloads. `startedAt` is regenerated per run. These fixtures are intentionally undeliverable; later real-inbox delivery must use a separately approved allowlist, never silently replace their addresses.
- `tests/staging/offline-guard.mjs`: clears integration bindings inside its child test process, installs dummy mailbox settings, blocks fetch and TCP/TLS socket creation. The existing test loader replaces SMTP, Supabase and Calendar with in-memory adapters. It does not modify the parent environment or any external configuration. This is a controlled test-process safeguard, not an OS sandbox against arbitrary hostile test code.
- `scripts/staging/local-check.mjs`: requires the approved development branch and accepts no target/live-mode arguments; runs the nine-group offline suite in a child process. No live connector or cleanup command is provided.
- `tests/staging/preparation.test.mjs`: nine offline groups exercising actual handlers with mock providers. Simulated database conflict handling is not proof of PostgreSQL concurrency; Calendar payload assertions are not event synchronization; mocked SMTP is not email delivery; mocked Redis replies are not real Lua/TTL verification.

Run preparation only:

```sh
npm run test:staging:local
npm test
npm run lint
npm run typecheck
```

No server or external credentials are needed. Generic failure-category logs are expected from injected faults. Do not run the SQL file or point another harness at external services under this authorization.

## Execution checklist for all nine steps

Every external acceptance item below is **NOT RUN / awaiting explicit approval**. Detailed cases and stop rules are in [the staging plan](staging-booking-verification-plan.md). The local group numbers are supporting checks, not nine completed integration tests.

| Step | Actions and acceptance evidence for later approved run | Local preparation / limits |
| --- | --- | --- |
| 1. Isolation | Approve destinations, operators, sink enforcement, budget, source SHA, run id and cleanup; prove no production bindings; preview stays disabled | Offline network rejection and synthetic-address checks prepared. Actual resource identity unverified. |
| 2. Schema/permissions | Inspect metadata with authorized staging owner; review constraints/RLS/grants and low-privilege access; approve missing migrations separately | Field/type/date contract checked locally. Metadata SQL prepared, not executed. |
| 3. Shared limiting | Prove independent processes share counters; real EVAL atomicity, expiry/429, positive Retry-After; configured failures return 503 before side effects; verify trusted host headers | Local mock checks prove command construction and fail-closed handler behavior only. |
| 4. Booking insertion | Submit synthetic future weekday using staging DB and mocked Calendar/SMTP; exactly one row/201, correct fields; rejected/honeypot cases have no effects | Valid/invalid insertion paths pass with in-memory storage. No real database write. |
| 5. Duplicate prevention | Concurrent independent clients for same slot: one row/201, one 409, one set of effects; test stale availability, cancellation and retry policy | Mock atomic-conflict handling checked. Production index existence/validity is owner-confirmed; exact coverage, cancellation and staged cross-process behavior remain unverified. |
| 6. Calendar sync | Dedicated staging calendar only; each type yields one correctly tracked event, Lagos/UTC timing and duration; no invitations; approved external-conflict policy | Mock payload checks for all three types. Authentication/sharing/sync not verified. |
| 7. Failure recovery | Inject insert failure, Calendar denial and post-acceptance timeout, tracking-write failure, SMTP partial failure and lost response; retain reservation, reconcile only synthetic artifacts, truthful UI | Simple pre-effect provider failures and partial-success flags checked locally. Ambiguous post-acceptance failures/outbox/reconciliation remain unimplemented or unverified. |
| 8. Sink/email and end-to-end | Verify enforced sink, sender/recipient/Reply-To, two booking messages and contact notification; full staged flow/tracking plus form/keyboard/mobile checks | Booking messages verified plaintext and synthetic with mocked transport; existing application tests also cover contact. No actual SMTP handshake or delivery. |
| 9. Reconciliation/sign-off | Count test artifacts; approved run-id-only cleanup; redacted report with pass/fail/unverified; owner signs recovery, privacy, billing and launch decisions | Preview rejection verified locally. No external artifacts exist to clean up; no launch authorization granted. |

Stop if isolation, costs/permissions or sink enforcement cannot be established, if any customer data appears, a production destination is discovered, a cap is reached, a preview guard must be bypassed, or ambiguous side effects cannot be reconciled. Do not remedy failed tests by modifying production resources.

## Remaining production rebuild launch blockers

1. Explicit authorization and identity/budget confirmation for isolated staging resources and external tests.
2. Existing index/check/type/nullability/grant definition review and isolated concurrency/effective-permission verification; metadata existence and RLS settings are owner-confirmed. Service-role least-privilege and privacy/retention decisions remain.
3. Calendar authentication/permissions and synchronization evidence; approve database-only availability versus external busy-event policy.
4. Durable booking idempotency, ambiguous-timeout handling and operational recovery. Current confirmed reservation may coexist with failed Calendar/email; no durable outbox/retry worker exists.
5. Shared limiter provisioning/verification plus global/edge abuse budgets and outage policy before public rebuild submissions.
6. Rebuild sink-based mail verification and approved sending/recipient policy, without disturbing owner-confirmed working production SMTP.
7. Business approval of proposed prices/renewals and consultation policies; dependency-advisory mitigation/acceptance; mobile LCP follow-up; monitoring/support ownership and Supabase uptime/plan decision.
8. Separate production configuration review, integration-test authorization and explicit merge/launch approval. Preparation approval authorizes none of these.

Application source, premium design, navigation, interactive features and production infrastructure are unchanged by this preparation. Local validation outcomes will be recorded below; no result from a mock is promoted to a live integration pass.

## Local validation results — executed during preparation

- `npm run test:staging:local`: **9 passed, 0 failed, 0 skipped**. All integration effects were in-memory; fetch/socket rejection was exercised.
- `npm test`: **10 passed, 0 failed, 0 skipped**, including the existing planner combinations and mocked API/preview safeguards.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- Negative CLI check: a `--live` argument is rejected before starting the child harness.
- Relative documentation links and `git diff --check`: passed.
- No production build, browser suite, Lighthouse, provider pricing query or external staging test was rerun: application/UI code is unchanged. Metadata SQL remains unexecuted and has not been validated against a real PostgreSQL server.

Only documentation, test fixtures/harness and the package script were prepared on the approved branch. No new dependency or paid service was added, no commit/push/deployment was performed, and no live credentials, customer records or external resource was changed. Approval is still required for the exact staging resources/actions and external execution.
