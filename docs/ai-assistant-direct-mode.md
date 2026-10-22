# Direct OpenAI owner-test mode — local, disabled preparation

This supersedes assistant Redis/admission/run-state instructions in the earlier
assistant documents. No production/Preview configuration, provider resource or
booking integration was changed. No inference, deployment, commit or push is
performed by this work.

## Current architecture and preserved boundaries

POST /api/assistant uses only the fixed OpenAI Responses endpoint.
There is no separate token-counting API request. There is no Redis fetch, SDK, database or in-memory fallback pretending
to be a durable quota. Booking/contact retain their independent Redis integration
and existing environment variables. Do not remove or replace those settings.

Production on main (or the approved feature branch) requires BOTH activation flags,
VERCEL=1 and explicit AI_ASSISTANT_EMERGENCY_STOP=false. Preview additionally
requires its own activation flag on exactly feature/monetcore-stage1-websites.
Both environments require the owner password and are protected independently by
Proxy and the API, before any provider request. Production accepts
only HTTPS https://monetcore.dev; Preview requires HTTPS and should retain Vercel
deployment protection. There is no public inference mode. Unknown/local runtimes
cannot infer. All activation flags default off; missing stop configuration blocks.

Owner username is `owner`; password must be a unique password-manager-generated
random value >=32 characters. Only its lowercase SHA-256 digest goes into the
server-only variable; never put the password in URLs, Git, shell history, browser
storage or chat. HTTP Basic is sent over HTTPS and may be cached by the browser;
close the private browser session after testing. Do not log Authorization headers.

Pinned model remains gpt-4.1-mini-2025-04-14, with the existing pricing approval
hash gate, fixed strict structured schema, approved topic/templates and URLs,
store:false, no tools, no automatic retries and no arbitrary endpoint selection.
Messages still have 6-question / 1000-character individual / 8192-byte body limits;
full classifier input is bounded at 16000 bytes. Before admission or any provider
request, the server estimates input tokens as the UTF-8 byte length of the entire
serialized generation request plus 512 framing tokens. This includes instructions,
escaped conversation, schema and generation settings. Estimates above 4000 are
rejected locally with HTTP 413; output remains capped at 300 tokens. The same
request-building function is used for estimation and generation, preventing drift.

Byte-level BPE text tokenization uses at most one token per byte; counting all JSON
syntax/settings additionally overcounts ordinary input. The 512-token allowance
is conservative engineering headroom, not a provider guarantee about hidden schema
processing or billing. The check is NOT an exact token count or a hard monetary
cap. Long/Unicode conversations may be rejected well before the character limit.
Provider-reported usage is still checked and over-limit usage fails closed after
the response (that cannot undo charges already incurred).

Generation timeout is 15 seconds; redirects are rejected and bodies bounded.
Client cancellation is passed upstream where supported; accepted requests may
still be billed. No tokenizer dependency, network counting request or new service
is introduced. Real snapshot/Responses structured-output compatibility remains
externally unverified.

## Honest limits after removing Redis

- NO permanent 20-admission ceiling; the 20 synthetic case IDs are labels only.
- NO cross-instance per-visitor/global rate limits, shared concurrency, atomic
  cost reservations or daily/monthly spending caps.
- NO instant shared Redis kill switch or global idempotency/replay ledger.
- A server process admits at most one active assistant request, applies a 5-second
  local cooldown, and suppresses repeat request UUIDs or matching keyed input
  digests for 60 seconds. State is bounded, ephemeral and resets on restart.
  Different Vercel instances/deployments have independent state. These controls
  reduce accidental repeats; they are NOT security-grade distributed limits.
- Client submit uses a synchronous ref lock, random request ID and AbortController;
  Clear Conversation retains the send lock until the aborted fetch settles.
- Failures/timeouts keep local suppression; no request is automatically retried.
  A retry routed to another instance may still incur another charge. No cached
  responses/transcripts are stored; only UUIDs, ephemeral keyed digests and lock
  state are kept. Logs retain only approved synthetic case/topic/token/cost/error
  fields. No questions, passwords, provider bodies or credentials are logged.

Current provisional generation estimate is $0.00208 for 4000 input + 300 output tokens
at the stored policy rates. This is NOT a reservation or spending guarantee.
Current tariffs, availability, taxes, FX and infrastructure costs remain
subject to separate verification. AI_MAX_CALL_COST_MICRO_USD is no longer used.
Provider project budgets/alerts should be reviewed before activation, but do not
assume they are immediate hard caps. Use a dedicated restricted OpenAI project/key
and synthetic questions only. A compromised owner credential may enable paid
requests across instances; do not expose this as a public chatbot.

## Exact Vercel variable names for a future controlled Production test

Configure only after separate deployment/activation approval. None were set here.
All are server-only; no NEXT_PUBLIC keys are used.

| Variable | Future controlled-test value/purpose |
| --- | --- |
| AI_ASSISTANT_ENABLED | `true` ONLY for separately approved Production testing; absent/false now |
| AI_OWNER_TEST_ENABLED | `true` ONLY for separately approved authenticated testing; absent/false now |
| AI_ASSISTANT_EMERGENCY_STOP | Must be exactly `false` to allow requests; `true` or absent blocks |
| AI_OWNER_PASSWORD_SHA256 | Lowercase 64-character SHA-256 digest of the private random owner password |
| OPENAI_API_KEY | Dedicated restricted server-side project API key, never shared in chat |
| OPENAI_MODEL | `gpt-4.1-mini-2025-04-14` |
| AI_PRICING_APPROVAL | Existing computed pricing-policy approval ID, only AFTER current pricing/model/estimation review |

For optional Preview tests, STAGING_AI_ASSISTANT_ENABLED=true replaces the
Production enable flag; AI_OWNER_TEST_ENABLED and all other safeguards still apply.
Vercel supplies VERCEL, VERCEL_ENV and VERCEL_GIT_COMMIT_REF; never spoof them to
activate inference. Preview must be the exact approved feature branch; Production
must be main or that feature branch. The price approval ID can be read locally:

```
node --import ./tests/register.mjs --input-type=module -e 'import { pricingApprovalId } from "./app/lib/assistant/pricing.ts"; console.log(pricingApprovalId)'
```

No AI_UPSTASH_*, AI_RATE_LIMIT_KEY_SECRET, AI_REDIS_ISOLATED,
AI_EXPECTED_REDIS_HOST, STAGING_AI_TEST_RUN_ID or Redis test-run keys are required.
Do not delete shared UPSTASH_REDIS_REST_*, RATE_LIMIT_KEY_SECRET or booking settings.

## Emergency disable / future test procedure

Before paid tests verify current model access, Responses structured-output support, tariffs, input-estimation assumptions and
provider privacy/transfer terms.
Owner should review project permissions, key scope and actual billing controls.
No zero-retention or completed provider legal arrangements are claimed.

Deploy disabled first under separate authorization. Confirm anonymous page/API
access is blocked. To test later, configure only the assistant server variables
above and deploy with separate owner approval; use one synthetic question at a
time and inspect sanitized usage + actual provider billing. A few manual requests
are a procedure, NOT an application-enforced hard test ceiling.

To stop, set AI_ASSISTANT_ENABLED=false (or AI_OWNER_TEST_ENABLED=false or
AI_ASSISTANT_EMERGENCY_STOP=true) and redeploy using the authorized workflow.
The application rechecks its local configuration before generation,
but Vercel environment changes need a deployment and do NOT instantly update
running instances. Already accepted requests may finish and be charged. For an
urgent stop across already enabled deployments, an authorized owner must use
provider-side project/key controls; no automatic key rotation or change is made.

Privacy wording now accurately states that assistant local controls are ephemeral
and do not use Redis. General website rate-limiting notices still apply to business
forms, whose implementation is untouched. No live services were exercised.

## Executed local verification

47 automated tests passed, including actual local admission/concurrency logic,
independent-process state, disabled defaults, Production/Preview owner auth,
missing credentials, token bounds, structured-response validation, injection,
local input bounds and generation failure, cancellation, emergency checks, no retries, duplicate
suppression and log failures. All existing booking/contact tests passed with
mocks. TypeScript, ESLint and optimized production build passed.

Local Chromium assistant checks passed at 320/390/768/1440px, with keyboard/axe,
disabled endpoint, request UUID header, mocked answers, Clear Conversation/reload
and zero external requests or browser exceptions. No real provider or Redis
compatibility, price, billing or device test is claimed. The historical Redis tests
were replaced with direct-mode coverage; they do not describe current controls.

## Revised pricing approval — local estimation

Policy revision 2 keeps the pinned snapshot and provisional $0.40/M input and
$1.60/M output rates, removes the counting-fee assumption, and binds the estimation
method plus 512-token headroom into the approval hash:

```
AI_PRICING_APPROVAL=ai-cost-v1-a35f6ac2c59c55425d498fc85f8e95de4b61c1a44207a2138ce56a7c0b69366d
```

The old approval value fails closed. Do not set the new value until current model
availability, pricing, structured-output support and estimation limitations are
reviewed and approved. Counting-endpoint charges no longer affect this integration
because it is never called. No current pricing or project access verification is
claimed. No environment variables or activation flags were changed.
