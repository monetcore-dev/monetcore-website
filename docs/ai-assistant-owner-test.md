> Superseded for assistant runtime controls on 22 October 2026: see
> [Direct owner-only API mode](ai-assistant-direct-mode.md). Redis admission,
> permanent 20-request allowances, distributed budgets and the Redis emergency
> key described below are historical and no longer apply to assistant requests.
> This history is retained for review; booking Redis/integrations are unchanged.

# Initial production-domain owner test — disabled local preparation

No push, deployment, environment change, cloud provisioning or inference was
performed by this implementation. Public production inference has no enable path.
The owner-only test is not approval for general customer availability.

## Access and isolation

Only `/assistant` and `/api/assistant` are intercepted by Next.js Proxy. On
production they fail closed unless BOTH production flags are true, the Vercel
branch is exactly `feature/monetcore-stage1-websites`, VERCEL=1 and the server-side
owner password hash is configured. Only `https://monetcore.dev` is accepted;
www, deployment aliases and HTTP are rejected. Keep the existing canonical-domain
redirect outside this application unchanged.

An HTTPS Basic challenge authenticates username `owner`. Use a password manager
to generate a unique random password with at least 32 characters. Compute its
SHA-256 locally with a trusted password manager or a hidden-input local utility;
configure only the lowercase 64-character hex hash as AI_OWNER_PASSWORD_SHA256.
Never put the password in a URL, command argument, shell history, Git, chat or a
NEXT_PUBLIC variable. No plaintext password or hash is supplied to React. Use an
owner-controlled browser/private window. Basic credentials may be cached and sent
on same-origin requests by the browser: closing that window is the local logout;
rotate the hash and redeploy to revoke credentials server-side. No MFA or shared
staff access is supplied. A high-entropy, unshared password is mandatory.

The API independently repeats authentication before reading a body, contacting
Redis, counting tokens or calling OpenAI. Responses are no-store; Proxy adds
noindex/noarchive, and the assistant page has noindex metadata and dynamic
rendering. The route never forwards the owner's Authorization header upstream.
Only the OpenAI project key or Redis token is used for its respective service.
Do not enable header/body capture in platform logs or monitoring.

Preview keeps its existing exact-branch opt-in and requires Vercel deployment
protection, configured separately by an authorized owner. It cannot activate
production. Production requires both AI_ASSISTANT_ENABLED=true and
AI_OWNER_TEST_ENABLED=true. No flags are set by code, and all default to off.

## Required server-only configuration (names, never secret values)

- OPENAI_API_KEY: dedicated project-scoped key, restricted to Responses creation
  and input-token counting where provider permissions support that granularity.
- OPENAI_MODEL: `gpt-4.1-mini-2025-04-14` only.
- AI_PRICING_APPROVAL: computed approval ID from the committed pricing module,
  set only after owner verification of current pricing/model/counting fees.
- AI_MAX_CALL_COST_MICRO_USD: at least the calculated minimum (currently 2080);
  2500 is recommended ONLY after confirming the provisional rates and zero
  counting fee. Changing rates/model/counting cost requires policy review and
  new tests/approval; increasing a number alone does not verify a cost model.
- AI_UPSTASH_REDIS_REST_URL / AI_UPSTASH_REDIS_REST_TOKEN: dedicated assistant
  database, HTTPS root URL at *.upstash.io, never monetcore-booking-staging.
- AI_EXPECTED_REDIS_HOST: exact hostname of that dedicated database (no scheme).
- AI_REDIS_ISOLATED: `true`, an owner attestation after verifying isolation.
- AI_RATE_LIMIT_KEY_SECRET: assistant-specific random secret, >=32 characters.
- STAGING_AI_TEST_RUN_ID: approved lowercase UUID v4, shared between Preview and
  production owner test. The name is retained to preserve the existing run.
- AI_OWNER_PASSWORD_SHA256: owner password hash described above.
- AI_ASSISTANT_ENABLED / AI_OWNER_TEST_ENABLED: absent or false until activation
  is separately approved. STAGING_AI_ASSISTANT_ENABLED cannot enable production.

VERCEL, VERCEL_ENV and VERCEL_GIT_COMMIT_REF must be actual Vercel system metadata.
Do not spoof them to bypass branch/environment checks. Do not change shared
UPSTASH_REDIS_REST_* / RATE_LIMIT_KEY_SECRET settings: booking/contact retain them.
The assistant also rejects a hostname matching the configured shared business
Redis URL. Expected hostname plus the isolation attestation detects accidental mismatch;
it does not independently prove the operator selected the correct database.

## Permanent run and emergency control

Use the dedicated assistant Redis database. Production and Preview intentionally
share `monetcore:assistant:v1:preview:` for ALL usage, cost, lease and run keys.
Switching environment or redeploying cannot grant a fresh allowance. Existing
admission/recheck Lua scripts and all numeric limits are unchanged.

With separate authorization, provision ONCE using create-only SET ... NX, no TTL:

- `monetcore:assistant:v1:preview:test-run:binding` = approved UUID.
- `monetcore:assistant:v1:preview:test-run:<UUID>:admitted` = string `0`.

Verify both values and PTTL=-1. If either exists already, STOP; inspect and keep
its current count, never overwrite, decrement or recreate it. Partial setup
stays blocked. The same UUID and database must be retained for the entire test.
Application code never initializes or resets state. Failed/uncertain admissions
and provider failures consume quota. At 20 the run is terminal, including across
UTC dates, process restarts and environment switches. Key loss/TTL fails closed.

The emergency key `monetcore:assistant:v1:preview:control` must equal `enabled`
for admission and BOTH pre-provider checkpoints. Missing/other value blocks all
further provider steps. Stop by setting it to `disabled` in this dedicated
instance. Do not delete run keys. In-flight upstream requests may still finish;
there is no refund or automatic retry. All spending, visitor and concurrency
ceilings remain enforced. Runtime needs EVAL, GET, PTTL, INCRBY, EXPIRE,
ZREMRANGEBYSCORE, ZCARD, ZADD, ZREM; operator SET is separate provisioning access.

## Short deployment / activation / rollback procedure

1. Owner approves the local diff/commit, push and production-domain deployment
   separately. Review all changes included since the current live release,
   including earlier assistant commits and privacy disclosures. Do not merge
   main automatically. Deploy the approved feature-branch artifact only using
   the owner's explicitly approved Vercel production workflow. Existing system
   branch metadata must still match. Record the prior deployment for rollback.
2. Before activation: independently verify the pinned model, Responses structured
   output and input_tokens compatibility, current rates and counting charges;
   approve provider privacy/retention/transfer arrangements. store:false is not
   zero retention. A nonzero/unbounded counting fee blocks this policy as written.
   No provider compatibility or pricing verification was performed here.
3. Obtain owner approval for any dedicated Upstash plan expense, configure the
   isolated database, verify real REST auth/Lua/ACL/persistence/no-eviction and
   provision permanent keys. Do not reuse or modify the booking Redis database.
4. An authorized operator configures ONLY the new assistant variables in the
   intended deployment environment. Keep all assistant flags off and Redis
   control disabled. Do not alter existing production business credentials.
   Deploy with flags off; verify unauthenticated assistant returns 503, ordinary
   pages/forms are unchanged, and no provider traffic occurs.
5. Separately approve activation: set both production flags true and make a fresh
   deployment. Before enabling Redis control, verify unauthorized page/API access
   returns 401 and an authenticated API request remains 503. Use synthetic text
   only. Then explicitly enable the dedicated Redis emergency key.
6. Owner opens https://monetcore.dev/assistant, authenticates, selects synthetic
   case IDs and makes at most 20 admissions. Respect 5/minute visitor limit and
   three-request concurrency. Never automatically repeat errors. Inspect only
   sanitized case/topic/token/cost/category logs and provider billing; no raw
   questions, passwords or headers. Count requests can consume the allowance
   without inference. Stop on missing measurements, unexpected usage, pricing
   mismatch, isolation concerns or provider errors; do not reset a counter.
7. Immediately after testing, set Redis control to disabled. Set both production
   enable flags false and redeploy; verify assistant 503 and no new provider
   requests. Keep permanent run state intact. Close the private browser window.
8. For code rollback, restore the recorded previous deployment only after Redis
   is stopped. Ensure inference flags remain off on restored artifacts; deployment
   rollback is not a credential revocation mechanism. Verify unaffected website
   routes and no provider traffic. No main merge is needed for this procedure.

No cloud step above has been executed. Real Upstash compatibility, OpenAI access,
counting charges, current tariff approval, provider privacy and paid test approval
remain launch gates. The initial authenticated test is not a public launch.
