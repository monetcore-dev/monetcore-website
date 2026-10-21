# Controlled staging run: 20 admissions and sanitized measurements

Local implementation only. No commit, push, deployment, live Redis operation,
provider call, configuration change or inference activation is authorized here.

## Staging run configuration / fail-closed state

An enabled assistant Preview now additionally requires STAGING_AI_TEST_RUN_ID,
a lowercase UUID v4 chosen for ONE explicitly approved test run. Both assistant
activation flags stay absent/false. Existing model/pricing approval, credentials,
branch guard, per-visitor limits, daily/monthly ceilings and concurrency remain.
Production assistant behaviour does not use the staging run or measurement code.

An operator must separately be authorized to provision these two keys in an
isolated, durable staging Redis instance, with NO expiry:

- `monetcore:assistant:v1:preview:test-run:binding` = the approved run UUID.
- `monetcore:assistant:v1:preview:test-run:<UUID>:admitted` = the string `0`.

The application has no initializer/reset endpoint. Future operator provisioning
must use create-only semantics (`SET ... NX`, without EX/PX) and verify BOTH keys
before activation. If either already exists, STOP and inspect it; never overwrite
or lower a counter to repair a test. Partial provisioning fails closed. No
provisioning command was executed. Existing emergency key must also be enabled
only under separate authorization, after readiness/privacy checks.

Redis command permission additionally needs PTTL. Admission and recheck scripts
use GET/PTTL; admission uses the existing INCRBY, EXPIRE, sorted-set commands.
Operator-only SET is needed for initial setup, not application runtime. Do not
share tokens in logs/chat. Do not reuse production or modify booking namespaces.

## Atomic admission and durability

One EVAL checks stop, permanent binding and counter, and all existing budgets and
concurrency. The run counter must be a canonical integer string 0..20 with PTTL=-1.
A missing, malformed, expiring, mismatched or greater-than-20 state is rejected.
A counter of 20 is terminal (429); no Retry-After suggests an automatic reset.

After all checks pass, the script increments the run counter BEFORE remaining
admission writes. Script errors may leave partial writes: they are conservative
and do not authorize a provider call. Failed token counting, provider failure,
timeout, invalid response and uncertain/lost admission responses all retain the
admission and cost reservation. No refund/decrement exists. Releasing a request
only removes its concurrency lease. Existing leases still expire after crashes.

Permanent run keys are never given TTLs, reset or recreated by the application.
The same run is shared across Preview instances/deployments and survives UTC
minute/day/month changes. Changing only the configured UUID cannot start a fresh
allowance because the permanent binding will mismatch. At most 20 admissions
therefore implies at most 20 inference requests; count-only failures reduce the
available inference count. Validation failures before admission consume none.

Stop and permanent run state are rechecked before token counting and again before
inference. Deleted state between checkpoints blocks the next provider step.
Already in-flight requests may finish after stop. This is not upstream cancellation.

Durability relies on Redis itself: verify persistence, no eviction of these keys,
permissions and recovery behaviour. Do not restore stale counters, reset state,
flush databases or change binding during a run. Privileged external tampering or
restoring a prior database snapshot cannot be prevented by application code. A
new run or post-test cleanup requires explicit owner approval; no automatic new-run
or expiry mechanism exists. Non-personal run metadata stays until approved cleanup.

## Synthetic case IDs and measurements

The Preview assistant page includes a selector for fixed `case-01` through
`case-20` IDs. It sends `x-monetcore-test-case`. Enabled staging rejects missing or
unknown IDs before admission and never logs raw header text. IDs are labels, not
idempotency tokens: repeating a case consumes another admission. The operator's
separate synthetic-question checklist maps IDs to expected topic IDs for scoring.
No real contact information, credentials or confidential text belongs in a test.

Server-only best-effort structured console reporting emits ONLY:

- synthetic_test_case_id (allowlisted or null);
- selected_topic_ids (validated knowledge IDs, at most two);
- provider_input_tokens / provider_output_tokens (bounded safe integers or null);
- estimated_generation_cost_micro_usd (rounded up using provisional pinned rates,
  excluding unverified counting fees, tax, infrastructure and FX; null if unknown);
- error_category (fixed allowlist).

No raw questions, conversations, IP addresses, credentials, provider responses or
exception messages enter these records. Model answers are assembled only from
approved knowledge, as before. Missing usage stays null and is reported as
usage_unavailable, never as zero cost. Reported usage over approved token limits
returns 503 with usage_limit_mismatch; stop the test and investigate if seen.
Counters and cost reservations remain charged. Do not treat estimated costs as
verified provider invoices. Provider billing must later be reconciled manually.

A failing reporting sink is caught and does not retry the provider, refund an
allowance, reset state or bypass budgets. A fixed sanitized fallback message is
attempted. Both sinks may fail; complete telemetry cannot be guaranteed. Stop the
controlled test if measurements are missing and investigate rather than adding
extra requests beyond the cap. Log access, retention and processing arrangements
require approval before activation. No transcript database was introduced.

## Verification and remaining gates

Mock tests cover 20 failures consuming quota, 21st denial, concurrent admissions
at the boundary, missing/expiring/corrupt state, Redis outage, lost EVAL response,
emergency stop at both checkpoints, deleted state, logging failures, sanitization,
usage errors, existing budgets/concurrency, and date rollover without reset.
The fixture serializes a JavaScript model of the Redis contract; it DOES NOT
execute Lua or establish real Redis compatibility. Real scripts, persistence,
permissions, OpenAI access, current tariffs/counting fees and privacy arrangements
still require separately approved external verification before activation.

Protected booking/contact/homepage/AI Core sources and the four unrelated booking
files remain unchanged. This work does not approve any external activation step.

## Executed local validation

TypeScript, ESLint (zero warnings), production build and local Preview-emulation
build passed. All 43 Node tests passed, including 12 controlled-run tests and the
12 prior assistant tests. Chromium checks passed at 320/390/768/1440px, including
keyboard/axe checks, Preview synthetic-case selector/header, disabled endpoint,
mocked success, Clear Conversation and reload. All 23 routes passed the existing
analytics-disabled regression. Browser runs recorded zero external requests or
page errors; integration responses were mocks, not live OpenAI/Redis.
Preview emulation used only isolated child-process test settings with inference
forced off, not saved environment configuration. No Vercel settings were changed.
Real device testing and live Lua/provider/billing verification were not performed.
