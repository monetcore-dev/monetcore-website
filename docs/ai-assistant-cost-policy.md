# Assistant cost policy — local revision, 21 October 2026

## Current source-verification limitation / activation blocker

Current model/pricing pages on developers.openai.com and openai.com returned HTTP
403 through the managed cloud proxy, including after network permission was granted.
We did NOT verify the latest tariff, present account access or API compatibility.
Do not call the rates below a verified current quote. They are the rates in OpenAI's
accessible official Cookbook April 2025 table. Current-page confirmation and approval
are required before setting AI_PRICING_APPROVAL. Inference remains disabled.
The owner separately supplied the same $0.40/$1.60 rates as provisional reference
data during this task, explicitly requiring independent verification before use.

Official sources read (public GitHub main, retrieved 21 October 2026):

- https://github.com/openai/openai-python/blob/main/src/openai/resources/responses/input_tokens.py
  documents POST /responses/input_tokens, instructions, input, model and text/schema.
- https://github.com/openai/openai-python/blob/main/src/openai/types/responses/input_token_count_params.py
  documents the same counting fields and Structured Outputs.
- https://github.com/openai/openai-python/blob/main/src/openai/types/shared/chat_model.py
  lists gpt-4.1-mini-2025-04-14 and gpt-4.1-nano-2025-04-14. Listing in the SDK is
  not proof of current account access or absence of deprecation.
- https://github.com/openai/openai-cookbook/blob/main/examples/partners/model_selection_guide/model_selection_guide.ipynb
  section 6.1, explicitly dated April 2025: mini $0.40/$1.60 and nano $0.10/$0.40
  per million input/output tokens. The guide discusses structured outputs and
  using mini for routing. This is dated evidence, not a current pricing page.

Required current official checks before approval:

- https://developers.openai.com/api/docs/models/gpt-4.1-mini
- https://developers.openai.com/api/docs/pricing
- https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens/methods/count
  Confirm the pinned snapshot supports Responses JSON schema, default-tier rates,
  that the counting endpoint has no separate billable charge, and that its reported
  input count includes all instructions, message framing and text/schema overhead.
  If any assumption differs, revise policy and tests; do not set approval unchanged.

## Model choice

Recommend gpt-4.1-mini-2025-04-14, not the moving alias. Nano is cheaper on the dated
table, but mini is a reasonable quality/cost choice for customer-question routing.
Do not assert it is the cheapest current model. Both still require availability
and accuracy evaluation. No new provider dependency or tokenizer is installed.

## Conditional bound and exact integer arithmetic

Standard/default tier, plain-text request, no tools, reasoning options, files,
images, web search, server conversations, stored history or fine-tuning.
Use full uncached input price; caching discounts can only reduce this bound.

- All counted input, including system instructions, questions and schema: <=4,000 tokens.
- All output: <=300 tokens (`max_output_tokens`).
- Input at $0.40/1M: 4,000 * 400 nanodollars = 1,600,000 nanodollars = $0.001600.
- Output at $1.60/1M: 300 * 1,600 nanodollars = 480,000 nanodollars = $0.000480.
- Total maximum generation charge at those rates: $0.002080 = 2,080 micro-US dollars.
- Separate counting fee assumed zero, requiring current official confirmation.
- Minimum Redis reservation = ceil(total nanodollars / 1,000) + counting fee.
- Recommend configured reservation 2,500 micro-US dollars ($0.0025), giving a
  $0.00042 margin above the conditional bound. It does not substitute for checking
  current rates. Existing 10,000 reservation remains valid if deliberately retained.

BigInt math rounds upward; config requires a safe integer >= calculated minimum
and <=1,000,000. Monetary counters remain small. Redis call and cost ceilings stay
100/day, 1,000/month and $1/day/$10/month. At recommended reservation, call ceilings
reserve at most $0.25/day and $2.50/month. No failed/uncertain reservation is refunded.
Provider taxes, FX, hosting and Redis charges are NOT included in the inference cap.

## Genuine input-token enforcement

1. Guard, config and reservation-floor validation happen before external requests.
2. Transport validation retains 8,192 request bytes /six questions /1,000 characters.
3. Construct ONE object with pinned model, instructions, input and full JSON schema;
   truncation is disabled. A 16,000-byte secondary cap bounds transport, not tokens.
4. Atomically reserve Redis allowances and concurrency; check emergency stop.
5. POST this exact input object to OpenAI's input-token counting endpoint.
6. Require the documented object type and a positive safe-integer count <=4,000.
   Missing/error/malformed counts fail closed. Excess returns 413. No inference.
7. Recheck emergency stop. Generate with the same input-affecting fields plus
   `store:false`, `service_tier:default`, and `max_output_tokens:300`.
8. All count/validation/provider failures keep cost reservations; leases release or
   expire. No automatic retries. Count requests also consume the admission allowance.

The new counting request transmits the same visitor context to OpenAI before
inference, under the same approved data-processing arrangements. It has no store
option in the official counting contract. Do not claim zero retention for it.
No real count/inference call was performed. Accuracy of the provider's count and
real schema/billing behaviour still need a separately approved isolated test.

## Reapproval / fail-closed controls

pricing.ts hashes model, service tier, input/output limits, rates, counting fee and
policy revision. AI_PRICING_APPROVAL must match this fingerprint. It is a public
policy identifier, not a credential. No environment configuration was changed.
Changing any policy field invalidates the previous approval. Unsupported aliases
and stale/missing approval block all provider requests. External rate changes
cannot be automatically detected: operators must monitor notices/current pricing,
disable the emergency key, review the policy and obtain reapproval before resuming.
Keep both activation flags absent/false until explicitly authorized.

## Mocked verification

Tests cover: under-reservation (2,079), malformed/unsafe config values, missing/stale
approval, rejected moving alias, exact count/generation payload equality, 4,000-token
boundary, excess/malformed token counts, counting timeouts and zero inference on
failure. Existing guards, budget/concurrency mocks and conservative failures remain.
No real OpenAI/Redis calls are permitted by these tests; real compatibility is NOT
claimed. Durable Redis engine execution and provider privacy review remain blockers.

## Executed local checks

TypeScript, ESLint (zero warnings), optimized production build and all 12 assistant
tests passed. Protected booking/contact/homepage/AI Core/catalog/pricing sources
have no diff from the approved baseline. No dependencies, environment settings,
external resources or Git history were modified. All count/inference/Redis
responses in tests were mocks. Latest-price verification remains outstanding.
