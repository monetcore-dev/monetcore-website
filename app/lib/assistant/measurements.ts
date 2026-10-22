import "server-only";
import { isControlledTestEnabled } from "./access";
import { syntheticCaseId } from "../../config/assistantTestCases";
import { knowledge } from "./knowledge";
import { pricingPolicy } from "./pricing";
const safeCategories = [
  "configuration_unavailable",
  "invalid_request",
  "invalid_test_case",
  "controls_unavailable",
  "emergency_stop",
  "local_busy",
  "local_duplicate",
  "input_token_limit",
  "provider_unavailable",
  "provider_response_invalid",
  "usage_unavailable",
  "usage_limit_mismatch",
  "success",
] as const;
export type SafeCategory = (typeof safeCategories)[number];
export type Measurement = {
  caseId: string | null;
  category: SafeCategory;
  topics: string[];
  inputTokens: number | null;
  outputTokens: number | null;
};
export function stagingMeasurement(request: Request): Measurement | null {
  if (!isControlledTestEnabled()) return null;
  return {
    caseId: syntheticCaseId(request.headers.get("x-monetcore-test-case")),
    category: "configuration_unavailable",
    topics: [],
    inputTokens: null,
    outputTokens: null,
  };
}
function safeTokens(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 1000000
    ? value
    : null;
}
export function captureUsage(
  measurement: Measurement | null,
  payload: unknown,
) {
  if (!measurement || !payload || typeof payload !== "object") return;
  const usage = "usage" in payload ? payload.usage : null;
  if (!usage || typeof usage !== "object") return;
  measurement.inputTokens = safeTokens(
    "input_tokens" in usage ? usage.input_tokens : null,
  );
  measurement.outputTokens = safeTokens(
    "output_tokens" in usage ? usage.output_tokens : null,
  );
}
export function reportMeasurement(measurement: Measurement | null) {
  if (!measurement || !isControlledTestEnabled()) return;
  try {
    const input = safeTokens(measurement.inputTokens),
      output = safeTokens(measurement.outputTokens);
    const estimated =
      input !== null && output !== null
        ? Number(
            (BigInt(input) * BigInt(pricingPolicy.inputNanoUsdPerToken) +
              BigInt(output) * BigInt(pricingPolicy.outputNanoUsdPerToken) +
              BigInt(999)) /
              BigInt(1000),
          )
        : null;
    // Fixed fields only. Never spread provider data, errors, requests or headers.
    console.info("Monetcore AI staging measurement", {
      synthetic_test_case_id: syntheticCaseId(measurement.caseId),
      selected_topic_ids: measurement.topics
        .filter((id) => id === "unknown" || knowledge.some((k) => k.id === id))
        .slice(0, 2),
      provider_input_tokens: input,
      provider_output_tokens: output,
      estimated_generation_cost_micro_usd: estimated,
      error_category: safeCategories.includes(measurement.category)
        ? measurement.category
        : "provider_response_invalid",
    });
  } catch {
    // Reporting must not throw, retry a provider request or release the local lock early.
    try {
      console.error("AI staging measurement reporting unavailable.");
    } catch {
      /* logging sink unavailable */
    }
  }
}
