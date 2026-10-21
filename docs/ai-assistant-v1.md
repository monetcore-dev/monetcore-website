# Monetcore AI Assistant V1 — disabled local implementation

No inference, deployment or activation is authorized by this implementation.
No OpenAI requests were made; tests use intercepted fetch and local browser mocks.

## Architecture and boundaries

`/assistant` uses page-memory history only. POST `/api/assistant` accepts at most
six visitor questions, each <=1,000 UTF-16 characters, <=8,192 request bytes.
The full counting payload has a 16,000-byte secondary transport cap. Inference
requires the provider's full input-token count (including instructions and schema)
to be <=4,000; byte limits are not the token-budget mechanism.
Only `gpt-4.1-mini-2025-04-14` is permitted. Fixed OpenAI endpoints are
https://api.openai.com/v1/responses/input_tokens (counting) and
https://api.openai.com/v1/responses (inference). No retries or arbitrary URLs.
OpenAI selects one/two approved topic IDs, not answer text. The server rejects
invalid output and renders only versioned knowledge templates and trusted links.
No tools, browsing, email, Calendar, Supabase or workflow imports are used.
Prices and renewals import the owner-approved website configuration; custom scope still requires a written quotation.
No prompt guarantee: misclassification remains possible, but generated business
claims, prices and links never reach the visitor. Out-of-scope answers use a
human-contact template. Clearing history aborts the browser request; it cannot
undo already-started provider processing or charges.

## Configuration for a FUTURE separately approved staging test

Server-only, never NEXT_PUBLIC:

- STAGING_AI_ASSISTANT_ENABLED=true only in branch-specific protected Preview.
- STAGING_AI_TEST_RUN_ID: approved lowercase UUID v4; an enabled Preview requires
  a permanent matching Redis binding and 0..20 admission counter. See
  ai-assistant-staging-run.md for isolated provisioning and measurement controls.
- AI_ASSISTANT_ENABLED remains absent/false; production uses its separate flag.
- OPENAI_API_KEY: dedicated restricted staging project key, securely configured.
- OPENAI_MODEL=gpt-4.1-mini-2025-04-14 (verify availability/schema support first).
- AI_PRICING_APPROVAL: exact fingerprint exported by pricing.ts, only AFTER
  current official pricing, counting fees and token-limit assumptions are approved.
  Missing/stale approval fails closed. No value was configured by this work.
- AI_UPSTASH_REDIS_REST_URL / AI_UPSTASH_REDIS_REST_TOKEN / AI_RATE_LIMIT_KEY_SECRET
- AI_EXPECTED_REDIS_HOST / AI_REDIS_ISOLATED=true (dedicated assistant database only)
  (secret >=32 characters). Activation also requires VERCEL=1 and platform-set
  VERCEL_ENV and VERCEL_GIT_COMMIT_REF. No local or unknown environment inference.
- AI_MAX_CALL_COST_MICRO_USD: integer reservation, currently 2,080..1,000,000
  micro-US dollars. Minimum is calculated with integer arithmetic from the pinned
  model/rates and full token limits; recommend 2,500 for extra headroom AFTER rate
  verification. Values below the calculated minimum fail before ANY provider or
  Redis request. This is not measured billing. See the source-verification limits
  in ai-assistant-cost-policy.md; current pricing verification is still blocked.

All enable flags are absent/false by default. Preview and production require the
exact feature/monetcore-stage1-websites branch. Production additionally requires
AI_OWNER_TEST_ENABLED=true and server-side owner authentication; public production
inference is not implemented. Production cannot be enabled by the staging flag.
Missing controls or configuration fail closed. See ai-assistant-owner-test.md for
the current configuration, deployment and rollback instructions.

Redis permissions: EVAL, GET, PTTL, INCRBY, EXPIRE, ZREMRANGEBYSCORE, ZCARD, ZADD, ZREM.
Use a dedicated assistant database, never the booking database. All controlled
Preview and production-owner tests intentionally share the existing Preview
namespace and permanent test binding, preventing an environment-switch reset.
Emergency key `monetcore:assistant:v1:preview:control` must equal `enabled`.
Missing key or any other value disables inference. Setting this key is an external
write, NOT performed by implementation/tests. Production owner tests use that SAME namespace and emergency key.

## Controls and costs

One Redis Lua admission atomically checks emergency control and reserves:

- visitor: 5/minute, 30/day; address HMAC, Vercel-overwritten address header required;
- global: 100/day, 1,000/month, UTC fixed windows;
- staging test run: hard maximum 20 total admissions in permanent Redis state;
  no automatic reset, initialization or expiry, including across deployments;
- reserved cost: $1/day and $10/month;
- global concurrency: three 60-second leases; explicit release after completion.
  A second emergency GET runs immediately before provider fetch. Redis failure at
  any admission/check blocks the call. No in-memory fallback. Reservations remain
  charged even on timeout, invalid output, stopped request or uncertain delivery.
  Leases expire after crashes; counters expire (2 minutes /2 days /62 days).
  Fixed windows allow boundary bursts and address limits do not prevent distributed
  abuse. Limits are shared by visitors; malicious users can exhaust capacity.
  Use project-level limits/alerts as additional controls; alerts may not be hard caps.

3-second token-count timeout, then 15-second inference timeout, maximum 300 output
tokens, standard/default service tier, no automatic retry. A 30-second function
ceiling accommodates counting plus Redis checks; concurrency leases remain 60s.
The same model/instructions/input/text schema is counted and sent for inference.
Counters/leases are reserved BEFORE counting; count failures/excess retain the
reservation and release the concurrency lease. Stop is rechecked after counting.
Server-only
safe errors, no provider payload/transcript/credential logging. Redis expiry and
request budgets are intentional control writes, not business/customer records.
Potential provider/hosting/Redis charges need owner approval. Input/schema token
billing, token-count fees and current rates must validate the reservation before
live activation. The policy fingerprint changes when model/rates/limits change;
monitor provider price changes and reapprove the policy before continued use.

## Privacy and operational approvals

Privacy draft distinguishes disabled preparation from activated OpenAI processing.
`store:false` is requested; it is not zero-data retention. Verify provider agreement,
retention/training settings, processing regions and transfer basis before activation.
Approve lawful basis, disclosure, emergency operator and retention for security
metadata. Provider output/errors are not exposed or stored as transcripts.
No email, database or Calendar receives chat text. Existing demos stay local.
Staging-only sanitized console measurements include fixed synthetic case/topic IDs,
provider token counts, estimated generation cost and safe error categories; no
questions or transcripts. Reporting failures cannot refund or reset admission.
See ai-assistant-staging-run.md; log handling requires separate approval.

## Controlled test / rollback (not yet authorized)

1. Review knowledge/statuses and commercial qualifications; approve provider terms,
   rates, per-call reserve, counters and budget. Stop if any remain uncertain.
2. Separately approve protected Preview deployment/configuration with isolated
   OpenAI project and Redis. Keep production flag false. Verify disabled first.
3. After activation approval, enable only Preview flag and emergency control key;
   use synthetic questions, monitor token usage/billing and known grounded answers.
4. Exercise limits, stop key and failure handling; no external business actions.
5. Disable control key immediately after test. Disable Preview flag and redeploy
   only with authorization. Previously admitted calls may still finish/charge.
6. Roll back assistant changes via a reviewed revert, not a broad website reset;
   existing booking, contact, AI Core, pricing and privacy work remain intact.

## Local verification evidence

- TypeScript and ESLint passed; all 28 Node tests passed (nine assistant tests,
  including mocked Redis accounting/concurrency contract checks).
- Optimized build passed. Chromium assistant checks passed at 320/390/768/1440px:
  keyboard, automated axe checks at 390/1440, disabled endpoint, mocked answer,
  Clear Conversation and reload. No external requests or browser errors.
- All 23 public routes passed the existing no-analytics browser regression.
- Browser JavaScript contained no provider endpoint, server credential identifiers
  or synthetic test key. Protected booking/contact/AI Core/catalog sources unchanged.
- No real OpenAI, Redis, email, Calendar or Supabase call was made for assistant
  verification. Lua is reviewed and contract-tested with mocked Redis responses;
  it has NOT been executed against a real Redis engine. Model accuracy, actual
  schema acceptance, token billing, provider settings and physical mobile devices
  remain unverified until separately approved staging testing.
