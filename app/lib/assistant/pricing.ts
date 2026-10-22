import "server-only";
import { createHash } from "node:crypto";

/** Official Cookbook rates (April 2025 table), NOT a verified current price quote.
 * Current pricing/model availability and local-estimation assumptions MUST be
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
  inputEstimation: "serialized-request-utf8-bytes-plus-framing-v1",
  inputFramingAllowanceTokens: 512,
  policyRevision: 2,
});
export const minimumReservationMicroUsd = Number(
  (BigInt(pricingPolicy.maxInputTokens) *
    BigInt(pricingPolicy.inputNanoUsdPerToken) +
    BigInt(pricingPolicy.maxOutputTokens) *
      BigInt(pricingPolicy.outputNanoUsdPerToken) +
    BigInt(999)) /
    BigInt(1000),
);
export const pricingApprovalId = `ai-cost-v1-${createHash("sha256")
  .update(JSON.stringify(pricingPolicy))
  .digest("hex")}`;
