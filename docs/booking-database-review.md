# Booking code review following owner database inspection

20 October 2026 (Africa/Lagos). Branch `feature/monetcore-stage1-websites`, application baseline `30bc4db`. Documentation-only review; no implementation, live queries, customer access, service-role use, paid provisioning or deployment. Production availability/contact are owner-confirmed working after the existing paused Supabase project was resumed. No availability hotfix is needed.

## Evidence and limits

Owner reports all seven metadata inspections completed: public.bookings/expected columns exist; RLS enabled/not forced; postgres owner; primary key id/status check; six indexes with valid partial unique_active_booking_slot excluding cancelled rows; no returned RLS policies; table grants for anon/authenticated/postgres/service_role; BYPASSRLS false/false/true for anon/authenticated/service_role. This resolves uncertainty about index existence and reported RLS settings. Exact DDL and grant details were not supplied, and no concurrency test or end-to-end integration result is inferred.

Please provide only sanitized definitions already obtained: unique_active_booking_slot index definition/predicate, date/time/status column types and nullability, status-check expression, and role/privilege rows. No keys, project hostname, customer rows or additional production query is needed for this review. Until then, conclusions about complete index coverage are conditional.

## 1. Index and cancellation alignment

Application inserts canonical YYYY-MM-DD plus one of 09:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00; timezone Africa/Lagos and status confirmed. Availability excludes status cancelled. A valid unique index on the canonical date/time pair, covering every non-cancelled row and matching non-null status semantics, would atomically reject a second active booking while allowing a cancelled slot to be reused.

The index name alone does not prove its key columns. Verify that it does not include id/email/consultation type or another dimension that unintentionally permits duplicate date/time reservations. Check exact predicate, nullability, time normalization and status-check values. PostgreSQL ordinary uniqueness can allow multiple NULL keys; a predicate using status <> cancelled omits NULL statuses. The application explicitly supplies these values, but database invariants must also cover other permitted writers. Do not infer current NULLs or bad records; no records were inspected.

The current fixed hourly starts and 30/45-minute durations fit a single-resource model without interval overlap. Changes to staff capacity, buffers, arbitrary starts or duration require a separate business/constraint review. A unique date/time pair does not enforce general interval exclusion. Cancelling a database row does not, by itself, prove a corresponding Calendar event was removed; cancellation/sync policy needs staged verification. No cancellation API was added here.

Disposition: retain the reported index. Do not add a duplicate index, force RLS or rewrite status constraints. First compare its sanitized definition with the intended rule, then run the approved isolated same-slot/cancelled-slot tests. Any real gap requires a separate reviewed staging migration and explicit production approval.

## 2. Duplicate handling

`app/api/book/route.ts` handles SQLSTATE 23505 before Calendar/email, returns HTTP 409 with a clear choose-another-time message and preserves the existing booking. `app/BookingForm.tsx` clears the selected time and refreshes availability after 409. A client submission lock prevents repeated clicks in one mounted form. Local mocks verify this flow; the reported index is the potential cross-request atomic authority, not the UI lock.

Remaining risk: all 23505 errors are labelled slot conflicts. Six indexes are reported, but their definitions are unknown; another unique constraint could produce the same code. Inspect those definitions before deciding whether to narrow classification. Do not expose raw database messages or parse/log PII-bearing detail strings as a quick fix. Request retries after a lost successful response receive conflict, not a durable idempotent replay/recovery receipt. A slot index does not prevent duplicate Calendar/mail effects after ambiguous provider retries.

## 3. Credential and RLS boundary

`app/lib/supabaseAdmin.ts` is server-only, initializes within server handler execution, refuses review-preview access, and uses SUPABASE_SERVICE_ROLE_KEY without passing it to browser components. The public project URL is not a secret. Session persistence/token refresh are disabled. No service-role key was used during this review.

Owner findings are compatible with ordinary anon/authenticated roles being denied table rows by enabled RLS with no applicable policies, even though table grants exist. This is conditional on effective policy visibility/role inheritance; grants alone do not prove customer data is exposed. No live role probe was executed. postgres ownership and RLS not forced are not automatically defects. Forcing RLS does not constrain BYPASSRLS roles. service_role bypass is expected and means server validation is a critical security boundary, not a reason to disable booking or add broad public policies.

Recommendations: preserve working production access. Review narrow server grants/RPCs as a separately approved least-privilege design if warranted; verify low-privilege denial in staging. Do not copy production keys to staging, rotate credentials, change grants or add browser INSERT/SELECT policies as part of this review.

## 4. Validation and abuse controls

Development handlers validate JSON/content type/origin when present, enforce a streamed 32 KiB cap, field types/lengths, meaningful name/email, known consultation types, exact dates, fixed times, weekdays and Lagos past-slot checks. Name header controls are rejected; mail is plaintext and Calendar description fields are escaped. The honeypot and minimum elapsed time are useful basic friction but client-supplied and bypassable. Optional phone/company/service text is bounded; service is free text, not a security permission.

Contact/booking default to 10 per address per 10 minutes and availability 60/minute. Optional shared Redis uses HMAC keys, atomic expiring counters and fail-closed errors. Without shared configuration and required=true, the fallback is per-instance only. No evidence supplied establishes that shared controls are configured in production or staging; no claim is made that the development limiter exists on deployed main. Request Origin checks do not stop non-browser bots; IP limits alone cannot stop distributed abuse. Email confirmations can be abused to send unwanted messages to submitted addresses.

Remaining approval items: enable/verify isolated shared controls before rebuild public submissions, agree global/recipient budgets or escalation, and confirm trusted hosting headers. No booking horizon, minimum advance notice beyond not-past, holiday or resource-capacity policy is implemented. Define business rules before adding them. Minor validation hardening to reject all email control characters can be considered with tests; do not replace the working SMTP configuration.

## 5. Persistence, Calendar and notifications

Reservation insert completes before event/mail attempts. Calendar and mail exceptions are caught and do not delete the booking. This is the correct record-preservation behavior. Current API may return 201/success with Calendar/email flags false, meaning the reservation exists while integrations are incomplete. It must not be converted to a generic submit-again error that encourages duplicate reservations.

Confirmed code-level gaps:

- BookingForm ignores Calendar/email flags and displays the same booked message for partial outcomes. The mail text also describes a confirmed consultation even when Calendar creation failed. Clarify reservation versus staff/calendar confirmation semantics with the business before revising copy; preserve the existing reservation.
- Calendar tracking updates check returned database errors but only log a generic category. Email tracking updates await the query without inspecting its returned error. Supabase can return an error without throwing, so tracking timestamps may silently remain unset even after mail acceptance.
- Calendar eventCreated and email sent flags describe provider outcomes, not successful persistence of tracking state or final inbox delivery. No tracking-persisted flags or durable recovery jobs exist.
- An event or email may be accepted before a timeout/response loss. There is no deterministic event id, durable request idempotency, transactional outbox, worker or bounded reconciliation process. Blind retries can create duplicates; retrying a slot request cannot restore missing effects reliably.

Smallest proposed application patch, pending approval: inspect both email tracking-update errors; add sanitized operation/correlation logging for tracking failures without dumping provider objects; use partial-success information in the booking UI with approved wording that avoids telling the user to submit again. Do not delete a reservation or alter SMTP settings. Stage-test update-returned errors, not just thrown exceptions. More comprehensive idempotency/outbox/recovery requires separate design/schema approval; it is not a tiny hotfix.

## 6. Public response minimization

The insert selects only id/date/time/type for its receipt, not customer/contact/project fields. Availability returns times, not personal data. Public error messages in development are generic and do not include stack traces, raw SQL errors or credentials. These are appropriate boundaries.

The success response additionally includes the Google Calendar event id. Current BookingForm does not use this identifier or the booking id. An event id is not a credential or a grant of Calendar access, but exposing it is unnecessary implementation detail for this UI. Proposed small fix: omit calendar.eventId from the public response after checking any other consumers/tests; retain it server-side for reconciliation. Keep useful reservation/delivery status. Removing booking.id is not automatically recommended: it may support a future approved receipt/support flow, provided it is not treated as authorization. No authenticated status/recovery endpoint is currently implemented or proposed without a design review.

## Proposed work in safest order — approval required

1. Review the already-collected sanitized index/check/nullability/grant definitions. No production mutation or new external test is needed to clarify them.
2. Approve a narrow development patch for tracking-update error handling, sanitized observability, business-approved partial-success messaging and Calendar event-id response minimization. Keep working SMTP and DB/index/RLS untouched.
3. Prepare fault-injection tests for returned tracking errors and partial UI outcomes; run offline validation, then approved isolated staging concurrency/cancellation/side-effect tests. Keep ordinary Vercel previews blocked/noindex.
4. Approve shared/global abuse controls and operational monitoring before public rebuild submissions; no paid service creation is authorized here.
5. Separately decide recovery/idempotency/outbox and booking confirmation policy, then any necessary staged implementation. Do not declare the rebuild production-ready based on metadata alone.

## Readiness disposition

Existing production availability/contact remain working by owner confirmation. The development rebuild is not launch-approved: exact slot coverage/effective permissions, isolated integration/concurrency/recovery results, shared abuse controls, business/privacy decisions and explicit launch approval remain open. Index existence, expected column presence and reported RLS configuration are no longer unknown. Metadata reports do not authorize staging access or production writes. No fixes have been implemented in this review.

## Local review validation

The existing offline staging harness was rerun: 9 groups passed, 0 failed, 0 skipped, with mocked providers and network access blocked. This supports the reviewed simple validation/conflict/partial-failure paths; it does not exercise real indexes/RLS, tracking-update failures, ambiguous provider timeouts or partial-success UI behavior. Documentation links and whitespace checks passed. No application code was changed, and no build/browser/live integration result is claimed for this documentation-only review. Existing uncommitted staging preparation files were preserved; nothing was committed, pushed or deployed.

## Approved implementation update

The subsequent approved patch implements tracking-error inspection/sanitized logging, improved 409 selection/refresh guidance and removal of public calendar.eventId. See Section 15 of the [readiness report](phase-3.9-production-readiness.md). Original findings above describe baseline 30bc4db. Broader partial-delivery messaging and durable recovery/idempotency remain pending approval; the authorized conflict-message improvement must not be described as a complete recovery solution. No production database or SMTP configuration was changed.
