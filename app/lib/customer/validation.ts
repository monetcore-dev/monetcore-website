import { CustomerError } from "./config";
import {
  projectCategories,
  customerBudgets,
  projectTimelines,
} from "../../config/customerOptions";
export function uuid(value: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new CustomerError(400, "invalid_identifier");
  return value;
}
export function validateProjectRequest(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new CustomerError(400, "invalid_request");
  const input = body as Record<string, unknown>;
  if (
    Object.keys(input).some(
      (key) =>
        ![
          "title",
          "category",
          "objectives",
          "requirements",
          "budget",
          "timeline",
          "notes",
          "idempotencyKey",
        ].includes(key),
    )
  )
    throw new CustomerError(400, "unapproved_field");
  const text = (key: string, min: number, max: number) => {
    const value = input[key] ?? "";
    if (
      typeof value !== "string" ||
      value.trim().length < min ||
      value.trim().length > max ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
    )
      throw new CustomerError(400, "invalid_field");
    return value.trim();
  };
  const result = {
    title: text("title", 3, 160),
    category: text("category", 1, 80),
    objectives: text("objectives", 20, 2000),
    requirements: text("requirements", 20, 5000),
    budget: text("budget", 1, 80),
    timeline: text("timeline", 1, 80),
    notes: text("notes", 0, 2000),
    idempotencyKey: uuid(text("idempotencyKey", 36, 36)),
  };
  if (
    !(projectCategories as readonly string[]).includes(result.category) ||
    !(customerBudgets as readonly string[]).includes(result.budget) ||
    !(projectTimelines as readonly string[]).includes(result.timeline)
  )
    throw new CustomerError(400, "invalid_option");
  return result;
}
