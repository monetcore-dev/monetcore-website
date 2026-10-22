import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { pricingPolicy, pricingApprovalId } from "./pricing";
import { isControlledTestEnabled, ownerCredentialConfigured, ownerTestAccess } from "./access";

export function configuration() {
  if (!isControlledTestEnabled()) return null;
  const key = process.env.OPENAI_API_KEY;
  if (!key || process.env.OPENAI_MODEL !== pricingPolicy.model ||
      process.env.AI_PRICING_APPROVAL !== pricingApprovalId || !ownerCredentialConfigured())
    throw new Error("Configuration");
  return { key, model: pricingPolicy.model };
}
export type Config = NonNullable<ReturnType<typeof configuration>>;

// Best effort within ONE process only. No distributed quota, budget reservation,
// permanent test allowance, shared rate limit or cross-instance idempotency.
const digestSecret = randomBytes(32);
const recent = new Map<string, number>();
let active: symbol | null = null;
let nextAllowedAt = 0;
const duplicateWindowMs = 60_000;
const cooldownMs = 5_000;

export function admit(c: Config, request: Request, payload: string) {
  request.signal.throwIfAborted();
  const now = Date.now();
  for (const [key, until] of recent) if (until <= now) recent.delete(key);
  if (active !== null)
    return { allowed: false as const, status: 429, retryAfter: 5,
      category: "local_busy" as const, error: "Another request is in progress. Wait for it to finish; do not resubmit." };
  const id = request.headers.get("x-monetcore-request-id") ?? "";
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id))
    return { allowed: false as const, status: 400, retryAfter: 0,
      category: "invalid_request" as const, error: "Reload the assistant and submit one question at a time." };
  const digest = createHmac("sha256", digestSecret).update(payload).digest("hex");
  if (recent.has(`id:${id}`) || recent.has(`body:${digest}`))
    return { allowed: false as const, status: 409, retryAfter: 60,
      category: "local_duplicate" as const, error: "This request was recently submitted. Wait before trying again; an uncertain delivery may still have been charged." };
  if (now < nextAllowedAt || recent.size >= 256)
    return { allowed: false as const, status: 429, retryAfter: 5,
      category: "local_busy" as const, error: "Please wait a few seconds before sending another question." };
  const lease = Symbol();
  active = lease;
  nextAllowedAt = now + cooldownMs;
  recent.set(`id:${id}`, now + duplicateWindowMs);
  recent.set(`body:${digest}`, now + duplicateWindowMs);
  return {
    allowed: true as const,
    check() {
      request.signal.throwIfAborted();
      if (ownerTestAccess(request) || configuration()?.key !== c.key)
        throw new Error("Stopped");
    },
    release() {
      if (active === lease) active = null;
      // Failed/uncertain deliveries retain duplicate suppression; never auto-retry.
    },
  };
}
