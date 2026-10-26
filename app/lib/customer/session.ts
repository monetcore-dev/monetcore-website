import "server-only";
import { getCustomerAuth } from "./auth";
import {
  assertCustomerEnabled,
  assertTestEmail,
  CustomerError,
} from "./config";
export type CustomerPrincipal = { userId: string; name: string; email: string };
export function principalFromSession(
  value: unknown,
  now = Date.now(),
): CustomerPrincipal {
  const data = value as {
    user?: {
      id?: unknown;
      name?: unknown;
      email?: unknown;
      emailVerified?: unknown;
      active?: unknown;
    };
    session?: { expiresAt?: unknown };
  } | null;
  const user = data?.user;
  const expiry = data?.session?.expiresAt;
  if (
    !user ||
    typeof user.id !== "string" ||
    typeof user.name !== "string" ||
    typeof user.email !== "string" ||
    !expiry ||
    !Number.isFinite(new Date(expiry as string).getTime()) ||
    new Date(expiry as string).getTime() <= now
  )
    throw new CustomerError(401, "session_required");
  if (user.emailVerified !== true || user.active !== true)
    throw new CustomerError(403, "account_unavailable");
  return { userId: user.id, name: user.name, email: user.email };
}
export async function requireCustomerSession(headers: Headers) {
  assertCustomerEnabled();
  // No cookie cache; revocation and active status come from the database each time.
  const session = await getCustomerAuth().api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
  const principal = principalFromSession(session);
  assertTestEmail(principal.email);
  return principal;
}
