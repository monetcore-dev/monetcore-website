/** Public synthetic identifiers only. Never accept free-text identifiers in logs. */
export const assistantTestCases = Array.from(
  { length: 20 },
  (_, index) => `case-${String(index + 1).padStart(2, "0")}`,
);
export function syntheticCaseId(value: unknown): string | null {
  return typeof value === "string" && assistantTestCases.includes(value)
    ? value
    : null;
}
