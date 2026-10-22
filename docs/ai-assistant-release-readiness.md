# AI Assistant readiness — owner access retained

## Decision

Ready for review of diagnostic removal; **not ready for anonymous public inference**.
Owner reports successful Production login and approved answers, but actual provider
usage and cost attribution have not been independently verified. No paid request,
credential access, runtime-log access or environment change was performed here.

## Implementation verified

- Fixed POST https://api.openai.com/v1/responses, pinned
  gpt-4.1-mini-2025-04-14, default tier, store:false, no tools/retries/redirects.
- One provider call at most per accepted question. Local full-request byte estimate
  plus 512-token framing allowance must be <=4000 before calling OpenAI; output
  capped at 300 tokens, 15-second provider timeout, bounded response body.
- Strict structured topic schema; completed assistant output must parse as one
  or two approved unique topic IDs. Unknown cannot mix with another topic.
  Final answers/prices/links come only from the versioned website/catalog modules.
- No offline fallback on provider failure. The exported `fallback` is approved
  human-assistance text selected only after a valid provider classification of
  `unknown`. Mock providers exist in tests only; they are not wired into app code.
- Owner Basic auth in Proxy and API, password digest checking, exact Production
  origin, activation/emergency-stop/pricing gates and local request protections
  remain intact. No public access mode is introduced by this PR.
- Conversation is browser memory only; Clear aborts in-flight requests and clears
  the UI. Recent visitor questions, not assistant replies, form classifier context.
  Examples, keyboard controls, live status/error messages, privacy/contact links
  and enquiry-prefilled approved package/service/product links remain available.
- Knowledge uses approved pricing and product status/disclosures, differentiates
  simulated demos from commercial availability and makes no binding quotations.
- No Redis/Upstash/database dependency for the assistant; booking/contact unchanged.

Temporary origin helper, calls, dedicated test and temporary operator runbook are
removed. Existing origin security tests remain. Normal sanitized usage/error
measurements remain; they exclude questions, credentials and provider response text.

## Evidence needed for the owner's successful response

Repository code alone cannot prove that an observed Production screen came from
this deployment or a new API call. GitHub records Production deployment
7248600272 for SHA 45b81a46264fa8cdea13aa941623f5dacb913ff4, which includes PR #5.
GitHub deployment records do not prove the current domain alias or runtime config.
There is no direct Vercel Runtime Logs access in this environment.

Owner procedure, using an already completed request where possible:
1. Verify the Production source SHA and monetcore.dev assignment in Vercel.
2. Find POST /api/assistant at the exact request time in Runtime Logs. Search
   `Monetcore AI staging measurement` (this label also applies to Production owner
   testing). Record only error_category, selected_topic_ids, synthetic_test_case_id,
   provider_input_tokens, provider_output_tokens and estimated cost. Do not share
   headers, raw messages, secrets or full environment screenshots.
3. A success event with nonzero usage on that request is implementation evidence
   of the completed provider path. `usage_unavailable` permits an approved answer
   but cannot establish token/cost totals; failure categories do not prove inference
   completed. A screenshot/HTTP 200 alone is insufficient evidence of billing.
4. In OpenAI Usage select the correct organization AND project that owns the
   configured key, broaden date/model filters, account for dashboard timezone and
   reporting delay, and distinguish dollar rounding from zero request counts.
   Do not inspect/share the key. Compare the existing request timestamp and usage.
5. If mismatch persists, verify the browser actually sent a fresh POST to this
   origin (not an old conversation, development mock, browser interception or a
   different deployment). Do not assume any of those explanations is the cause.
   Any additional paid question requires separate authorization; none was run here.

## Public launch blockers

1. **Real provider evidence/billing:** reconcile zero requests; verify project
   access to the exact snapshot, current tariffs and structured-output behavior.
   No token-count API is used, so counting-endpoint fees no longer matter.
2. **Abuse and spend:** current lock/cooldown/deduplication are per-process only.
   Vercel instances and restarts bypass them; no global request or spend ceiling
   exists. Owner-password removal without replacement controls is unsafe.
3. **Provider privacy:** owner must verify processing/retention, contracts and
   transfer arrangements. store:false is not zero retention. Privacy copy openly
   identifies outstanding provider verification; do not claim it is completed.
4. **Release design approval:** current deployment requires Basic auth, owner flags,
   an exact permitted branch and synthetic case selection. This is owner-test UX,
   not anonymous customer UX. Do not simply delete authentication to launch.

## Exact gated public-launch sequence

1. Approve an abuse/spend-control design before implementation. Check whether the
   existing Vercel plan supports suitable platform-managed rate limiting/WAF for
   POST /api/assistant, how global/per-client rules are enforced, bypass behavior,
   plan costs and alerting. Do not assume availability, install a service or upgrade
   a plan. Edge controls must protect the actual provider path, not just the page.
2. Establish an enforceable exposure ceiling: an independently verified provider
   hard quota/credit stop, or an approved durable admission/accounting mechanism.
   Project soft budget alerts and process-local counters are NOT hard caps. WAF
   rules can bound request rates if verified but do not themselves measure token
   spend; include concurrent/accepted-but-uncertain calls in the exposure estimate.
   If no acceptable enforceable controls are available under current constraints,
   retain owner-only access. A manually monitored public launch is not a hard cap.
3. Verify prices/model/project attribution and privacy responsibilities; approve
   the unchanged revision-2 pricing assumptions or revise them explicitly. Current
   approval ID is ai-cost-v1-a35f6ac2c59c55425d498fc85f8e95de4b61c1a44207a2138ce56a7c0b69366d.
   The 512-token allowance is an estimate, not a provider billing guarantee.
4. In a separately approved implementation PR, introduce an explicit default-off
   PUBLIC activation path guarded by verified controls; retain a separate protected
   owner path. Remove synthetic selectors/header requirements from public UX only.
   Preserve strict origin/schema/approved answers, request limits and human fallback
   links. Update privacy/disclosure wording for actual public processing and support.
5. Test disabled defaults, owner/public boundary, edge-limit enforcement, duplicate
   requests, abuse/error paths, emergency disable and mobile/a11y before release.
   Review all new infrastructure/config costs. No paid tests without authorization.
6. Obtain explicit merge/deploy/configuration and bounded paid-smoke-test approval.
   Deploy disabled first, then verify the release/domain/rollback target and limits.
   Activate only the approved scope; compare actual provider usage and billing.
7. Monitor errors/classification quality/costs without transcripts. Stop on unknown
   billing, unexpected token usage, bypassed controls or privacy/auth regressions.
   Environment switches require redeployment; existing enabled deployments may stay
   live. Provider-side disable/revocation is an owner-authorized emergency option,
   not something this code performs. Preserve a verified previous deployment for
   rollback and remember rollback alone may not disable older enabled deployments.

No public activation, infrastructure, deployment or environment action is included
in this diagnostic-removal PR. Tests use mocks and browser tests block external
requests; they do not verify live model availability, billing or physical devices.
