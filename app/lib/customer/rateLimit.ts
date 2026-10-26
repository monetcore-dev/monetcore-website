import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { getCustomerAuthPool } from "./database";
import { assertCustomerEnabled, CustomerError } from "./config";
/** Atomic database limits, not process-local counters; failure is never allowed open. */
export async function customerRateLimit(
  request: Request,
  scope: "auth" | "write" | "read",
) {
  assertCustomerEnabled();
  const raw = request.headers.get("x-forwarded-for");
  // Nginx must overwrite this with $remote_addr, not append client-supplied input.
  if (!raw || !isIP(raw))
    throw new CustomerError(503, "proxy_address_unverified");
  const secret = process.env.CUSTOMER_AUTH_SECRET!;
  const hash = createHmac("sha256", secret).update(raw).digest("hex");
  const limit = scope === "auth" ? 15 : scope === "write" ? 10 : 120;
  const pool = getCustomerAuthPool();
  // Global bound prevents rotating-address bursts from creating unbounded rows.
  for (const [key, maximum] of [
    [`global:${scope}`, scope === "auth" ? 200 : 1000],
    [`${scope}:${hash}`, limit],
  ] as const) {
    const result = await pool.query<{ count: number }>(
      `INSERT INTO customer_auth.request_limits (key, count, expires_at)
      VALUES ($1,1,now()+interval '15 minutes') ON CONFLICT (key) DO UPDATE SET
      count=CASE WHEN customer_auth.request_limits.expires_at<=now() THEN 1 ELSE customer_auth.request_limits.count+1 END,
      expires_at=CASE WHEN customer_auth.request_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE customer_auth.request_limits.expires_at END RETURNING count`,
      [key],
    );
    if (result.rows.length !== 1 || !Number.isSafeInteger(result.rows[0].count))
      throw new CustomerError(503, "rate_limit_unavailable");
    if (result.rows[0].count > maximum)
      throw new CustomerError(429, "rate_limit_exceeded");
  }
}
