import "server-only";
import { createHash } from "node:crypto";

/** Official Cookbook rates (April 2025 table), NOT a verified current price quote.
 * Current pricing/model availability and token-count endpoint charges MUST be
 * independently checked and approved before setting AI_PRICING_APPROVAL.
 * Any model, rate, limit or request-mode change requires a new approval.
 */
export const pricingPolicy = Object.freeze({
  model: "gpt-4.1-mini-2025-04-14",
  serviceTier: "default" as const,
  maxInputTokens: 4000,
  maxOutputTokens: 300,
  // Integer nanodollars per token: $0.40 / 1M and $1.60 / 1M.
  inputNanoUsdPerToken: 400,
  outputNanoUsdPerToken: 1600,
  // Approval must also verify that input-token counting has no separate fee.
  tokenCountFeeMicroUsd: 0,
  policyRevision: 1,
});
export const minimumReservationMicroUsd = Number(
  (BigInt(pricingPolicy.maxInputTokens) *
    BigInt(pricingPolicy.inputNanoUsdPerToken) +
    BigInt(pricingPolicy.maxOutputTokens) *
      BigInt(pricingPolicy.outputNanoUsdPerToken) +
    BigInt(999)) /
    BigInt(1000) +
    BigInt(pricingPolicy.tokenCountFeeMicroUsd),
);
export const pricingApprovalId = `ai-cost-v1-${createHash("sha256")
  .update(JSON.stringify(pricingPolicy))
  .digest("hex")}`;
