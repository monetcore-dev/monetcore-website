# Phase 3.9 — Production integration and security readiness

Assessment date: 20 October 2026 (Africa/Lagos). Branch: `feature/monetcore-stage1-websites`.

**Development rebuild: not yet approved for production launch; isolated staging verification is pending approval. Existing production availability and contact email are working, as confirmed by the owner.** Application safeguards can be reviewed in the protected preview. Codex has not changed production infrastructure, credentials, policies, records, DNS or calendar permissions, or performed live integration tests. The owner independently resumed the existing Supabase project to resolve the incident described below. The managed cloud's previously observed lack of integration bindings does not establish their state in Vercel. Do not paste secret values into Git, reports or chat.

## Production incident update — resolved

Owner-confirmed evidence received on 20 October 2026 (Africa/Lagos):

1. Vercel production logs showed `GET /api/book/availability` returning HTTP 500 with `getaddrinfo ENOTFOUND` for the Supabase project hostname.
2. The existing Supabase project **monetcore-website** was paused on the Free plan.
3. The owner successfully resumed that same project.
4. Production booking availability now works, and the production email/contact form also works.

**Incident diagnosis: the paused Supabase project was the resolved dependency outage; no booking availability application hotfix is warranted.** This replaces the earlier unconfirmed configuration/permission hypotheses for this specific incident. The evidence and recovery are owner-reported; Codex has not independently accessed production logs, customer records or the restored service. Do not generalize every future ENOTFOUND error to a paused project without checking service status and DNS/network evidence.

Both reviewed branches calculate availability from Supabase booking records, past times and weekends; neither performs a Google Calendar free/busy query. The incident therefore does not establish a Google service-account authentication or calendar-permission failure. Working availability confirms the owner's recovery observation, not database insertion, atomic duplicate prevention, Calendar event synchronization or failure recovery on the development rebuild.

**Disposition:** no availability hotfix, credential rotation, schema/policy change, SMTP change or production redeployment. Retain the existing production SMTP functionality. The development branch's defensive initialization/error-handling improvements remain useful safeguards, not the cause or cure of this incident.

Operational follow-up for approval: assign an owner to dependency-status/availability alerts and an outage runbook that checks Supabase project status before changing application code or credentials. Review the current Free-plan pause policy and service guarantees, then decide whether a production-appropriate plan is needed. No plan upgrade, paid provisioning, monitoring change or artificial keep-alive traffic is authorized or performed.

The next authorized preparation is the [isolated staging verification plan](staging-booking-verification-plan.md). All external tests and staging-resource changes remain pending explicit approval.

## Owner-confirmed production database metadata — 20 October 2026

The owner completed all seven read-only inspections on production **monetcore-website** and reports: `public.bookings` exists with the expected booking/contact/status/timestamp/Calendar columns; RLS enabled, not forced; owner `postgres`; primary key on `id` and a status check; six indexes, including valid partial unique `unique_active_booking_slot` excluding cancelled bookings; no returned booking RLS policies; table privileges for `anon`, `authenticated`, `postgres`, `service_role`; BYPASSRLS false for anon/authenticated and true for service_role. The paused-project incident remains resolved and production availability/contact remain owner-confirmed working.

These are owner-supplied metadata findings, not new database access by Codex. No customer records were inspected. Exact index keys/expressions/predicate, column types/nullability, status-check expression and privilege lists were not included in the summary. Index existence/validity and RLS configuration are now confirmed by owner evidence; complete slot coverage, effective role permissions and actual concurrent booking behavior remain pending review/staging verification. An empty policy result is recorded as reported, subject to inspector catalog visibility.

See [booking code review and smallest proposed fixes](booking-database-review.md). No production database change or availability hotfix is recommended from the metadata summary. Earlier statements that metadata was wholly uninspected describe the original audit, not the current evidence status.

## Completed application changes

- Contact, booking and availability handlers support an optional atomic shared Redis REST limiter, without a new dependency. Lua increments a per-endpoint, HMAC-pseudonymized address counter and sets its expiry in one operation. Configured failures, malformed responses, missing required configuration and timeouts fail closed with generic 503/Retry-After; exceeded limits return 429/Retry-After. HTTPS Upstash endpoints only, no redirects or credential-bearing URLs, two-second timeout. Review-preview rejection still occurs before any limiter/integration call.
- Existing best-effort bounded in-memory limits remain the default when shared configuration is entirely absent. This preserves current behavior; **it does not complete durable production protection**. Set `RATE_LIMIT_REQUIRED=true` only as part of approved staging/production configuration. A partially configured shared limiter fails closed even without that flag.
- SMTP transports retain authenticated TLS on `mail.privateemail.com:465`, add 10-second connection/greeting and 20-second socket timeouts, and disable local-file and URL attachment access. Certificate verification is preserved. No messages are sent by the tests: Nodemailer, Supabase and Calendar are replaced by in-memory fixtures.
- Performance experiment and measured outcomes are recorded below. Approved content, typography, interactions and corporate hierarchy are preserved.

## Required configuration names

| Name | Purpose / classification |
| --- | --- |
| `MONETCORE_EMAIL` | Server-side authenticated SMTP mailbox; currently also sender and business notification recipient. Must be an approved mailbox, not arbitrary user input. |
| `MONETCORE_EMAIL_PASSWORD` | Secret SMTP password. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public project URL; not a secret. Currently used only by the server admin helper. Must identify the correct environment. |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret, elevated server credential; bypasses RLS. Never prefix with `NEXT_PUBLIC_`. |
| `GOOGLE_CALENDAR_ID` | Server-side target calendar identifier. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Server identity identifier; not itself a password. |
| `GOOGLE_PRIVATE_KEY` | Secret service-account private key; helper normalizes literal `\\n` newlines. |
| `UPSTASH_REDIS_REST_URL` | Optional shared limiter HTTPS endpoint; approved staging and production databases must be isolated. |
| `UPSTASH_REDIS_REST_TOKEN` | Secret Redis REST token, least available permissions sufficient for EVAL/INCR/PEXPIRE/PTTL. |
| `RATE_LIMIT_KEY_SECRET` | Secret random HMAC key, at least 32 characters; distinct per environment. |
| `RATE_LIMIT_REQUIRED` | Set exactly `true` in approved environments that must reject submissions if shared configuration is missing. |
| `VERCEL_ENV` | Vercel-provided environment marker. `preview` blocks all three integration APIs. Do not override it to enable preview forms. |
| `VERCEL` | Vercel-provided platform marker; limiter uses platform-owned `x-vercel-forwarded-for` when it equals `1`. |

No values were disclosed or changed. Required integration variables are absent from this cloud's managed bindings; that is not evidence about their presence in Vercel. SMTP host/port and recipient are currently code-defined, not additional environment variables. No public Supabase anonymous key is required by the existing server-only implementation.

## 1. Email implementation audit

`app/api/contact/route.ts` sends one plaintext notification to `MONETCORE_EMAIL`, from that same authenticated mailbox, with the validated visitor address as Reply-To. The subject contains a bounded name rejecting CR/LF/NUL. Package details and proposed prices come from server configuration, not visitor-supplied totals. Contact messages require a name, valid email, meaningful message, bounded fields, JSON body under 32 KiB, same-origin when an Origin is supplied, and minimum elapsed form time. Package requests additionally require a known package and explicit quotation-response consent.

`app/api/book/route.ts` sends plaintext customer confirmation to the validated visitor email and a business notification to `MONETCORE_EMAIL`. Customer Reply-To is the business mailbox. Delivery flags/timestamps track each attempt independently. SMTP acceptance is not proof of final inbox delivery. Booking is already persisted before email; email failure does not delete the reservation. There is no durable mail queue, automatic reconciliation, bounce processing or cross-request idempotency guarantee. A client submission lock only prevents duplicate clicks in that mounted form.

Provider failures return generic errors or booking partial-success flags; logs do not include credentials or submitted payloads. The honeypot and timing check deter basic bots but are not strong identity checks. An attacker can submit arbitrary syntactically valid addresses to the confirmation flow; shared and edge/global abuse controls are needed to limit email abuse. No HTML email or user-selected attachments are supported. Timeouts bound each SMTP phase; they are not a total end-to-end function deadline. Multiple sequential side effects can still exceed a serverless request duration.

The owner confirms the existing production contact/email form works after recovery. This is operational evidence for that existing path; it does not verify development-branch booking confirmations, failure recovery or isolated staging delivery. Keep the production SMTP implementation and bindings unchanged. Before enabling delivery from the rebuild, confirm the approved sending mailbox and notification recipient, provider outbound SMTP support from the chosen Vercel runtime, TLS and mailbox authentication, SPF/DKIM/DMARC and alignment. Domain records are infrastructure work requiring approval. DNS correctness and delivery reputation have not been verified. Confirm whether the public address `hello@monetcore.dev` is also the authorized authenticated sender; the public contact address alone does not prove SMTP access.

## 2. Supabase implementation audit

`app/lib/supabaseAdmin.ts` is server-only, refuses preview access, and disables session persistence/token refresh. The service-role key is never intentionally passed to client components. Its privilege bypasses RLS; RLS alone cannot constrain this application credential. Prefer a narrowly scoped server role or carefully granted database functions in a later approved integration change. Never give browsers the service-role key or direct write access to bookings.

The application inserts a `bookings` record, selects only id/date/time/type after insertion, reads only booking times for public availability, and updates calendar/email tracking by booking id. Availability exposes no names, email addresses or project descriptions. Errors are generic. The original audit did not inspect live metadata. The owner has now confirmed the table/expected columns, RLS settings, owner, role bypass flags, grants presence and six indexes including valid partial unique_active_booking_slot. Exact definitions and effective permissions still need the scoped review below; backups remain unverified. Codex has not accessed the database.

Required schema contract (verify in staging, do not execute on production): id; consultation_type; booking_date; booking_time; timezone; name; email; nullable phone/company/service/message; status; google_calendar_event_id; google_calendar_event_created_at; confirmation_sent_at; admin_notification_sent_at; updated_at. Confirm types, defaults, constraints and migration ownership. There is no schema migration establishing this contract in the repository.

**Remaining verification requirement:** the owner confirms a valid partial unique index exists; verify its exact coverage and staging concurrency rather than adding a replacement. Concurrent inserts must be serialized by a database-enforced unique constraint on active date/time (or an exclusion constraint on occupied ranges if durations/resources become variable). An availability read followed by insert is not atomic. Current code maps PostgreSQL `23505` to 409, but that only works if the real constraint exists. A partial unique index excluding `status = 'cancelled'` must also forbid/null-harden unexpected status values. Do not add it blindly: review existing duplicates, business timezone and cancellation semantics first. Hourly fixed slots with 30/45-minute consultations currently do not overlap, assuming a single resource and no additional buffers.

Review RLS on bookings and any exposed schema: deny anon/authenticated SELECT/INSERT/UPDATE/DELETE unless a specific approved workflow requires it; restrict grants and server functions, pin function search paths, avoid unsafe SECURITY DEFINER functions. Verify access using anonymous/low-privilege test identities in staging. Public API validation is still required because the service role bypasses policies.

Personal data is copied to database, email and calendar. Approve a privacy notice, collection purpose, permitted staff access, provider/region choices, retention/deletion periods including backups and mailbox/calendar copies, lawful processing and incident handling. Do not invent a retention duration. Only planner selection identifiers persist in tab session storage; personal enquiry text is not intentionally persisted there. Application logs should retain category/correlation information without customer payloads. Pseudonymous limiter keys are still privacy-relevant and should expire with their rate window.

## 3. Calendar and booking guarantees

Authentication uses a Google service-account JWT and `https://www.googleapis.com/auth/calendar`, a broad Calendar scope. Recommend a dedicated staging calendar/service account first and least-privilege event scope (`calendar.events`, or narrower where compatible), with access only to the intended calendar. Changing scopes/sharing is approval-dependent and has not been performed. No domain-wide delegation is needed by the current code; do not grant it to solve access problems.

Consultations are 30 or 45 minutes, Monday–Friday, fixed starts 09:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, Africa/Lagos. Date/time validation rejects impossible dates, past slots and unknown types. ISO timestamps are constructed with +01:00 and sent with `Africa/Lagos`; confirm business hours, breaks, minimum notice, booking horizon, staff capacity, buffers, holidays, location and cancellation/rescheduling policies before release. Calendar descriptions HTML-escape customer text. Events use `sendUpdates: none`, no attendee invitations and no generated Meet link.

**Availability is database-only**; it does not query Google free/busy or consider manually created calendar events. Decide whether a dedicated consultation calendar has exclusive API-managed reservations, or whether external calendar conflicts must be honored. If external conflicts matter, implement and stage-test free/busy checks and an explicit synchronization policy. Google Calendar check-then-insert is not an atomic reservation service. The database remains the slot-lock authority, with clear ownership of manual changes.

Current sequence: persist confirmed booking → insert Calendar event → record event id → send two emails → update tracking timestamps. There is no distributed transaction, durable outbox, recovery worker, deterministic event id or durable request idempotency key. Calendar failure leaves a confirmed database reservation; email failure can leave the customer uninformed. A provider timeout may have succeeded remotely even when the caller sees a failure. Blind retries can duplicate events/messages, and a retry of the form can conflict with an already-created booking.

Recommended follow-up implementation, after schema/policy approval: atomically insert reservation plus unique request key and outbox jobs; derive a Calendar-compatible deterministic event id from booking id; reconcile timeouts by lookup before retry; record per-side-effect outcomes; process retries with bounded exponential backoff and dead-letter/manual recovery; enforce job ownership/claim leases; avoid duplicate confirmation emails. Confirm whether “confirmed” means database reservation or successful staff/calendar confirmation before changing public messages. Do not claim a cross-provider exactly-once transaction. No such infrastructure was provisioned here.

## 4. Durable rate limiting plan

Preferred initial option: a small **approved** Upstash Redis REST database using the application adapter added here. No paid service, project or token was provisioned. This adds one bounded HTTPS request per accepted API attempt and supports independent serverless instances. Separate staging/production stores and HMAC secrets prevent test traffic consuming production quotas.

Starting limits, to tune using approved aggregate telemetry:

| Endpoint | Per address | Current additional safeguards |
| --- | --- | --- |
| POST `/api/contact` | 10 / 10 minutes | Bounded JSON, origin check, field validation, honeypot, elapsed time, package consent |
| POST `/api/book` | 10 / 10 minutes | Same checks plus exact date/type/slot validation, database conflict handling |
| GET `/api/book/availability` | 60 / minute | Exact date validation, no customer data returned |

Counters start a fixed window on first request. This is not a sliding-window or bot-detection system; bursts near window boundaries and distributed-source attacks remain possible. NAT/shared mobile networks may share a quota. Missing trusted address groups into an `unknown` bucket instead of creating unlimited identities. On Vercel, the shared path uses its platform-owned forwarded header; outside Vercel a trusted reverse proxy must overwrite `x-forwarded-for`, or clients can spoof it. Production launch verification must test actual platform header behavior. Do not trust arbitrary forwarded headers when hosting changes.

Add Vercel edge/WAF request budgets and a global submission/email budget if supported by the approved plan. Consider accessible challenge escalation for abusive traffic and a privacy-reviewed per-recipient cooldown. No WAF settings or pricing commitments were changed. Non-mutating page routes need edge-level flood protection, not Redis calls on every static page. Confirm cost caps, alert thresholds, outage handling and support ownership before enabling. Monitor 429/503 counts without logging raw IPs or message bodies.

The atomic Lua contract is tested with mocked REST responses only. Real Redis execution, concurrent distributed counts, expiry, permissions, regional latency and outage behavior require the approved staging procedure below. The existing fallback remains an instance-local emergency measure, not evidence of serverless durability. Fail-closed operation protects side effects during limiter outages but temporarily prevents customer submissions; approve this availability trade-off.

## 5. Dependency security review

Fresh npm scans: one underlying high-severity advisory, five affected package entries in the **development-only** chain `eslint-config-next@16.3.2 → @next/eslint-plugin-next → fast-glob → micromatch → braces@3.0.3`.

[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): braces <=3.0.3 may exhaust the stack on deeply nested brace patterns (CWE-674, CVSS 7.5). Exposure is build/lint tooling processing attacker-controlled glob patterns; no deployed application route accepts patterns for braces. It is not evidence of remote compromise of this site's runtime. CI/build runners remain a separate trust boundary.

Registry `braces` latest is still 3.0.3 at this review. npm now suggests `eslint-config-next@14.2.35`, a **major downgrade** incompatible with the current Next 16 baseline; this is not a safe automatic fix. `eslint-config-next@16.4.0` exists; the matching plugin still depends on fast-glob 3.3.1, so merely aligning versions does not remove the affected chain. No forced overrides, dependency downgrades or disruptive upgrades were applied. Production-only `npm audit --omit=dev` reports **zero advisories**, within npm's database coverage, not a guarantee of no vulnerabilities.

Mitigation pending upstream: use fixed repository-controlled lint patterns, do not feed untrusted user patterns into tooling, isolate CI from production secrets, avoid privileged execution of untrusted pull-request code, monitor the advisory and rerun audit when a patched compatible package is available. Record explicit time-limited risk acceptance if release precedes an upstream fix. A lockfile suppressing the alert without removing exposure is not a fix.

## 6. Safe staging verification procedure — approval required before external calls

The post-incident [detailed staging plan](staging-booking-verification-plan.md) is the current execution checklist: verify isolation and shared limiting before end-to-end submission tests, mock all downstream services during database-only checks, and follow its stop conditions. The original outline below remains background guidance; none of these external actions has been executed.

1. Approve a dedicated staging project, database, non-customer calendar, mail sink/allowlisted staff test inboxes, limiter database and exact test recipients. Confirm cost limits and ownership. Production credentials/data must not be copied into staging. Provide secrets only through secure environment settings.
2. Keep ordinary Vercel review deployments at `VERCEL_ENV=preview`, with integrations disabled and noindex. Do not bypass this guard on a publicly accessible preview. Use an access-controlled local/staging runner with approved sandbox bindings; if a hosted staging mode is needed, design a separate explicit allowlisted staging gate for approval first. This phase does not introduce such an exception.
3. Database owner reviews a migration against an empty/synthetic staging dataset. Verify required columns, restrictive grants/RLS and atomic active-slot constraint. Race at least two independent booking requests for one date/time: exactly one reservation and one 409; test cancellation/rebooking, failed inserts and unavailable reads. Confirm no PII appears in availability responses. Anonymized fixtures must not be derived from live customers without authorization.
4. SMTP: first use a local mock/sink. Then, only after the approved recipient list is enforced by the staging transport/provider, run authentication verification (does not deliver a message), one contact enquiry and one booking confirmation. Verify sender/recipient/Reply-To, plaintext escaping, message id/accepted/rejected outcomes and actual inbox receipt, SPF/DKIM/DMARC headers, failure responses, timeout handling and duplicates. Never use a random customer's address. Nodemailer `verify()` alone does not validate delivery or sender authorization.
5. Calendar: authenticate to the dedicated staging calendar, verify only necessary access, reserve one synthetic future Lagos slot, inspect start/end conversion and duration for each consultation type, verify no invitations, test a collision and a manual busy event according to the approved policy. Exercise permission denial, timeouts and tracking-write failures; verify the database reservation is retained and operational recovery is explicit. Any cleanup must target only approved test ids.
6. Shared limiter: enable staging variables plus `RATE_LIMIT_REQUIRED=true`. Test independent processes share a counter; endpoint isolation; 429 and positive Retry-After; expiry/reset; malformed backend response; token denial; timeout; absent configuration (503); outage does not fall back open; preview calls never reach Redis. Verify TTL deletion and pseudonymous keys, no raw IPs. Use tiny test limits in a staging-only harness rather than flooding public endpoints.
7. End-to-end: confirm submit lock, loading/error/success messages, safe retry guidance, no duplicate events/emails, package/planner prefills, mobile/keyboard behavior, and preview 403/noindex on the separately protected review deployment. Record actual evidence and redact logs/screenshots. Do not classify mocked tests as delivered-email/database/calendar tests.
8. Review results, approve remaining recovery/idempotency and privacy decisions, then request a separate explicit launch approval. Production integration tests are a distinct authorization; staging approval does not authorize production calls.

## 7. Business content approval checklist

- [ ] Approve Smart Starter **₦99,000**, Smart Business **₦179,000**, Smart Business Pro **from ₦299,000** before public publication. These remain proposed, not approved business prices.
- [ ] Approve annual renewals after 12 months: **₦45,000 / ₦60,000 / from ₦90,000**, scope/tax/payment terms, what renews, ownership/transfers, cancellation/refunds and support commitments.
- [ ] Confirm standard .com domain availability, first-year domain/hosting/SSL, premium-domain extra costs, revision rounds, page counts and deliverables; no unlimited AI promise.
- [ ] Confirm optional AI, booking, messaging/API usage, WhatsApp Business Platform and advanced automation require separately agreed scope/fees; distinguish rule-based assistant from generative AI.
- [ ] Confirm corporate service descriptions and which products are available versus concepts; no invented customers, awards, certifications or performance claims.
- [ ] Public contacts match user-verified details: **Monetcore System Solutions**, **monetcore.dev**, **hello@monetcore.dev**, **07065880558**, `tel:+2347065880558`, `https://wa.me/2347065880558`.
- [ ] Confirm office/meeting address **Ventures Park, 5 Kwaji Close, Maitama, Abuja, Nigeria**, social account ownership and external lead-demo readiness; these were not independently verified.
- [ ] Approve consultation hours, free/paid scope, duration, resource capacity, minimum notice, maximum horizon, holidays, online/in-person location and cancellation/rescheduling policies.
- [ ] Retain clear illustrative/simulation labels: MonePay is fictional, dashboard figures are demo data, workflow does not generate live customer records/AI responses. Review external demo separately.
- [ ] Approve privacy notice, retention/deletion and processor arrangements for email, calendar, database and abuse controls.

## 8. Ordered implementation and approval gates

1. Review this code and the protected preview. Application safeguards and automated mocks are complete; there is no authorization to enable live submission paths.
2. Approve the staging resources/recipient allowlist and budget. Assign infrastructure owners to SMTP DNS, Supabase constraints/RLS, dedicated calendar permissions and shared limiter configuration.
3. Implement reviewed staging schema and recovery/idempotency design; verify concurrent reservations and all partial failures. No production migrations or credential rotations are authorized by this report.
4. Execute the staged procedure above only after approval. Record real delivery/event/database/limiter evidence, then resolve failures and verify physical-device usability as appropriate.
5. Approve business content, privacy/retention, any temporary development-tool advisory acceptance, operating alerts/runbook and production configuration review.
6. Obtain explicit production integration/launch approval. No merge, production deployment or DNS change is performed in this phase.

Development rebuild launch blockers: isolated staging booking/email verification, database schema/RLS/atomic reservation guarantee, Calendar synchronization/permissions/conflict policy, durable limiter provisioning/verification, partial-failure recovery/idempotency, approved business/privacy policies and explicit launch authorization. The resolved availability incident and owner-confirmed working production contact form are not open outages. Mobile LCP and actual deployed Core Web Vitals remain performance follow-ups; simulated lab results cannot establish field INP or real-device performance.

## 9. Performance investigation

The actual mobile LCP element is `#corporate-hero ... p.mt-4`: “From a professional online presence to a connected business workflow…”. It is server-rendered text, not an image. Both variable fonts are already local, preloaded and `display: swap`. Remaining initial work includes stylesheet parsing, fonts, framework JavaScript and layout/paint of the interactive homepage. Image priority or remote preconnects would not address this text LCP.

An off-screen `content-visibility` experiment measured a 2.79 s mobile median but failed anchor scrolling and pricing-content regression checks. **It was reverted and is not shipped.** Its candidate measurements are preserved separately in `/workspace/artifacts/phase39`; they must not be reported as the final code's performance. No design compromise or broken optimization is retained merely to improve a lab score. Final-code measurements and verification follow below.

### Staging infrastructure prerequisites

An approved staging runner needs outbound HTTPS to its Supabase project, its Redis REST endpoint, Google OAuth/token and Calendar API hosts, plus authenticated TLS SMTP to `mail.privateemail.com` on TCP 465. The managed cloud currently has restricted package-manager/GitHub-oriented egress and no integration credentials; no integration connectivity is established by a successful npm/Git operation. Verify outbound SMTP support for the selected hosting/runtime before choosing it for delivery. Request only the specific staging hosts/credentials after resource approval; do not weaken TLS verification, bypass the session proxy or copy production bindings. Vercel's actual production network access and secret scopes require an authorized configuration review.

## 10. Security and reliability risk register

| Finding | Assessment | Action / remaining requirement |
| --- | --- | --- |
| Development braces stack exhaustion | High advisory severity; development-tool exposure, not a discovered runtime exploit | Isolate build tooling; monitor compatible upstream patch; explicit temporary acceptance if needed. |
| Instance-local limits on serverless | High abuse risk before durable/edge controls are configured | Shared adapter implemented and mocked; provision/verify isolated limiter and global/edge budgets after approval. |
| Elevated server credential; effective access review pending | Owner confirms RLS enabled/no returned policies and service_role BYPASSRLS; broad impact remains if the server credential is misused | Preserve server-only boundary; review grant details and staged low-privilege access without changing production policies. |
| Active-slot coverage/concurrency not fully verified | Owner confirms valid partial unique_active_booking_slot; exact keys/predicate/null handling not supplied | Review existing DDL and stage concurrency/cancellation tests; no duplicate index or production alteration is proposed. |
| Calendar scope / database-only availability | Medium least-privilege and conflict-policy risk | Approve dedicated calendar, narrower compatible scope and external-conflict policy. |
| Missing durable outbox/idempotency/recovery | High reliability risk for partial failures and ambiguous retries | Approve schema/job design and recovery owner before promising end-to-end booking guarantees. |
| Rebuild booking-email delivery/recovery not staging-verified | Rebuild launch blocker; existing production contact email is owner-confirmed working | Preserve production SMTP; verify the rebuild against an isolated mail sink and review sender/provider configuration before enabling it. |
| Privacy/retention policy undecided | Governance and customer-data risk | Business/legal owner must approve lifecycle across all three processors. |

No credential rotation, access-policy change, paid provisioning or destructive security testing was performed. Production-only npm audit found no advisories; this review does not establish the absence of all vulnerabilities or replace an authorized infrastructure audit.

### Final retained-code performance results

Lighthouse 13.5.0 / Chromium 154 on a local optimized production-mode build. Mobile emulates 412×823, Moto G Power user agent, simulated 150 ms RTT / 1,638.4 Kbps / 4× CPU slowdown. Desktop uses the desktop preset. The deployment-only `/_vercel/insights/*` script was blocked as in Phase 3.8 to avoid a localhost 404. Profiles ran sequentially without concurrent browser suites and made no application API requests. This is not a Vercel CDN, physical-device or field measurement.

| Run | Performance | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- |
| Mobile 1 | 96 | 0.99 s | 2.74 s | 78 ms | 0 |
| Mobile 2 | 95 | 0.97 s | 2.86 s | 96 ms | 0 |
| Mobile 3 | 95 | 0.94 s | 2.85 s | 84 ms | 0 |
| Mobile median | **95** | **0.97 s** | **2.85 s** | **84 ms** | **0** |
| Desktop | **100** | **0.25 s** | **0.62 s** | **0 ms** | **0** |

All four local reports scored accessibility, best practices and SEO 100. Automated scores are not complete accessibility/security certification. Mobile LCP remains the second hero paragraph in all three runs; desktop LCP is the hero heading. The prior Phase 3.8 median was 2.89 s / performance 94. The final retained design's 2.85 s / 95 difference is within lab variance: **no LCP improvement is attributed to a shipped change**. The median still exceeds 2.5 s. INP was not measured; TBT is not INP. No broad client-rendering rewrite, font substitution or broken CSS optimization is shipped.

Next performance work should capture deployed-preview traces, examine stylesheet/font critical-path timing and client hydration cost, and establish field Core Web Vitals after an authorized release. Framework polyfills and shared React chunks account for much of the estimated unused JavaScript; removing working interactions or changing browser support without evidence is not justified. Further critical-CSS/bundle changes need targeted experiments and regression proof. This performance follow-up remains open.

Exact metrics, versions and throttling: [phase-3.9-performance-results.json](phase-3.9-performance-results.json). Raw final reports: `/workspace/artifacts/phase39/home-mobile-{1,2,3}.json` and `home-desktop.json`. Files prefixed `candidate-` belong to the rejected optimization.

### Shared-limiter alternatives considered

| Option | Fit / trade-off |
| --- | --- |
| Optional Upstash REST adapter implemented here | Common Vercel-compatible HTTPS approach; atomic TTL counters, no new runtime dependency or booking-schema migration. Requires approval of a separate provider/store and any costs. Not provisioned or activated. |
| Existing Supabase with a restricted SQL counter function | Avoids another provider. Requires an approved atomic RPC/schema migration, execution grants, expiring-row cleanup and contention/load testing. Do not implement as non-atomic JavaScript SELECT followed by UPDATE, or expose the counter table to browsers. A reasonable alternative if the business prefers existing infrastructure. |
| Vercel WAF/edge rules | Useful outer protection and global budgets; actual plan/features and cost are unknown. Requires authorized infrastructure configuration; combine with application validation and durable reservation constraints. |

The optional adapter is reviewable code, not a commitment to purchase a provider. Approve one shared strategy before configuring production. Do not enable two independent limiter backends accidentally or share staging counters with production.

## 11. Final verification and changed files

Executed on final retained application code:

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 10 test groups passed, 0 failed, 0 skipped, including 9,600 planner combinations and mocked integration paths. No real email, database or calendar calls.
- `VERCEL_ENV=production npm run build`: passed locally for profiling; this was not a deployment.
- `VERCEL_ENV=preview npm run build`: passed; final local server retains preview guards.
- `QA_BASE_URL=http://127.0.0.1:5806 npm run test:browser`: all seven programs passed with exit 0. Eight pages, internal links, menus, solution/workflow/planner interactions, pricing/prefill, mocked forms/bookings, demo dialogs, preview/noindex safeguards, accessibility scans, reduced motion and light/dark browser preferences. Responsive widths 320, 360, 375, 390, 430, 768, 1024, 1280 and 1440 px. Chromium desktop/touch emulation only; no physical Android/iPhone or Safari engine test is claimed.
- Separate retained-design contact-anchor/focus checks passed at 320, 390, 768 and 1440 px after reverting the failed rendering experiment.
- Full npm audit: expected nonzero due to the one dev-only advisory / five affected package entries. Production-only audit: zero advisories. The advisory remains unresolved, not a passed full security scan.
- Targeted generated-client-JavaScript check found none of the reviewed server-credential variable names; this is a limited exposure check, not a forensic secret/history audit.
- `git diff --check`: passed. No approved UI files or pricing configuration changed.

Changed files: `app/lib/submissionSafety.ts`; the three API routes `app/api/contact/route.ts`, `app/api/book/route.ts`, `app/api/book/availability/route.ts`; `tests/integrations.mjs`, `tests/qa.test.mjs`; `docs/qa-testing.md`, this report and `docs/phase-3.9-performance-results.json`.

Evidence: `/workspace/artifacts/phase39/` contains final build/lint/typecheck/unit/browser logs, dependency JSON, final/candidate Lighthouse reports, a standalone final Lighthouse HTML report, and retained-design contact-anchor screenshots. `browser-regression.log` and `anchor-tests.log` record the rejected experiment failures; `browser-regression-final.log` and `anchor-tests-final.log` are the final passing checks. Do not conflate candidate results with final verification.

Commit/push is restricted to `feature/monetcore-stage1-websites`; the commit identifier and Vercel result are supplied with the delivery message. Production remains blocked by the items above. Approval is still required before external staging integration calls, production integration tests or launch.


## 12. Documentation update after incident recovery

This update changes readiness documentation only. It records the owner's resolved production incident and adds a separate staged test matrix with isolation, approval and stop conditions. Historical Phase 3.9 test/performance results above remain historical; no new build, Lighthouse run or external integration test is claimed. The approved UI, interactive features, SMTP code and booking implementation are unchanged. See [staging-booking-verification-plan.md](staging-booking-verification-plan.md) for the next proposed work. External staging actions, production integration tests and launch remain unapproved.

## 13. Staging preparation only — approved scope

The owner approved local staging preparation, not external execution. The [preparation audit](staging-preparation-report.md) records resource isolation/cost decisions, the source-derived database contract, metadata inspection SQL, synthetic fixtures, offline checks and an execution matrix for all nine staging steps. Owner-confirmed metadata is now recorded above. Exact schema/index/check/grant definitions, effective permissions, provider credentials and external synchronization remain unverified. No booking availability hotfix, production SMTP change or external provisioning/testing is authorized by this update.


## 14. Booking review following owner metadata inspection

Owner-confirmed database findings are summarized near the top of this report. The [focused booking review](booking-database-review.md) records index/cancellation alignment conditions, 23505/409 handling, server-only elevated credentials, RLS interpretation, abuse controls, record-preserving partial failures and public-response minimization. Proposed small fixes await approval: check returned email tracking-update errors, improve sanitized failure observability and approved partial-success messaging, and omit the unused public Calendar event id. No database/RLS/index or production SMTP change is proposed. Exact index/check/nullability/grant definitions and isolated concurrency/recovery verification remain pending; no live test is claimed.

## 15. Approved three-change booking patch — development only

The owner authorized application changes for tracking errors, slot-conflict guidance and public Calendar-id removal. This supersedes the corresponding pending-fix entries in the historical review; it does not authorize external integration tests, database changes, shared-limiter provisioning or launch.

- All Calendar/customer-email/admin-email tracking writes now inspect returned database errors and catch thrown failures. Logs contain only a fixed operation name and failure category (`database_rejected` or `request_failed`), without booking/customer identifiers, provider details or credential values. Tracking failures retain the reservation and do not retry already accepted side effects. Provider outcome flags retain their existing meaning; they do not promise tracking persistence or inbox delivery.
- Slot conflicts still return HTTP 409 before Calendar/mail calls. The form clears the conflicted selection, refreshes availability, preserves entered details and explicitly asks for another available slot. If refresh fails, it keeps submission blocked until availability and a new selection are established, and provides date-recheck guidance. It does not automatically resubmit.
- Public responses omit `calendar.eventId`; the internal database field, event creation, tracking and `eventCreated` status remain intact. SMTP transport/settings, contact code, database schema/RLS/indexes and corporate design are unchanged.

Regression coverage includes returned and thrown tracking failures for all three operations, sanitized logs, unchanged reservation/provider counts, internal event-id persistence without public exposure, and slot-conflict behavior. Browser checks cover successful and failed availability refresh at mobile 390px and desktop 1440px with intercepted API responses only. Earlier staged preparation documents/fixtures are included alongside this patch; those do not activate external tests.

Rate-limiting recommendations only: choose and approve an isolated shared backend and budget, verify atomic counter/expiry/fail-closed behavior across independent processes, confirm trusted hosting headers and global/recipient abuse budgets, then review production configuration separately. No Redis or paid infrastructure is provisioned and limiter code is unchanged.

Concurrent-booking recommendations only: review the already-collected sanitized unique_active_booking_slot keys/predicate, column nullability and status-check definition; preserve the existing valid production index; run same-slot and cancellation races only in approved staging. No database constraint/policy/grant is changed. Mapping all 23505 errors to slot conflict and durable request/provider idempotency remain review items.

Remaining launch blockers: isolated database/concurrency/Calendar/sink/recovery evidence, exact index/grant coverage, durable shared/global abuse controls, ambiguous side-effect recovery/idempotency, business-approved confirmation/partial-delivery semantics, privacy/retention/content approvals, existing dev-only advisory disposition and explicit production authorization. Mobile LCP remains a documented performance follow-up. The owner-confirmed working production contact/availability systems remain untouched.

### Patch verification and exact file manifest

Executed: `npm test` 13 passed/0 failed/0 skipped; `npm run test:staging:local` 9 passed/0 failed/0 skipped; `npm run lint` passed; `npm run typecheck` passed; `VERCEL_ENV=preview npm run build` passed as an optimized production build with preview guards. Local preview port 5900: `tests/browser-booking-conflicts.mjs` passed all four mobile/desktop success/failure refresh cases; `tests/browser-booking-demo.mjs` passed booking UI and existing demo regressions. All browser booking responses were intercepted. A first version of the new browser assertion matched multiple alert regions; the selector was narrowed to the booking-conflict message and all four cases then passed. No application defect was hidden or assertion removed. Physical devices, full browser suite, actual database concurrency, Calendar synchronization, SMTP delivery and Redis behavior were not tested in this patch.

The development commit includes these 16 files (including previously prepared local staging materials):

```text
app/BookingForm.tsx
app/api/book/route.ts
package.json
tests/integrations.mjs
tests/qa.test.mjs
tests/browser-booking-conflicts.mjs
tests/staging/fixtures.mjs
tests/staging/offline-guard.mjs
tests/staging/preparation.test.mjs
scripts/staging/local-check.mjs
scripts/staging/schema-inspection.sql
docs/phase-3.9-production-readiness.md
docs/qa-testing.md
docs/booking-database-review.md
docs/staging-booking-verification-plan.md
docs/staging-preparation-report.md
```

Only the two app files change application behavior. The schema inspection SQL is metadata-only preparation and was not executed by Codex. No dependency, provider binding, paid service or production setting changed. The development commit/preview outcome is reported in the delivery message; production deployment remains unapproved.

## 16. Corporate services/product expansion — development preview only

The separately authorized [offering expansion](offering-expansion-report.md) adds seven service pages, six honestly labelled product pages and local simulations, with contextual links into existing forms. APIs, server integration helpers, production configuration, pricing and preview blocking are unchanged. Local demos do not satisfy the remaining real integration, concurrency, security/configuration or recovery launch gates. No production launch or external staging integration test is authorized by completion of these pages.
