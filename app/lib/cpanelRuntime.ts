import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export function isCpanelRuntime() {
  return process.env.MONETCORE_HOSTING_TARGET === "cpanel";
}
export function cpanelProductionConfigured() {
  return isCpanelRuntime() && !process.env.VERCEL && !process.env.VERCEL_ENV &&
    process.env.MONETCORE_DEPLOYMENT_ENV === "production" &&
    process.env.CPANEL_INGRESS_CONFIGURED === "true" &&
    (process.env.CPANEL_INGRESS_SECRET?.length ?? 0) >= 32;
}
/** Dedicated Apache ingress must strip client copies and inject these values.
 * A private shared token authenticates that ingress; loopback alone is insufficient
 * on shared hosting. Never forward the token to external providers or log it.
 */
export function trustedCpanelRequest(request: Request) {
  if (!cpanelProductionConfigured() || request.headers.get("host") !== "monetcore.dev" ||
      request.headers.get("x-monetcore-https") !== "1") return false;
  const supplied = request.headers.get("x-monetcore-ingress") ?? "";
  if (supplied.length < 32 || supplied.length > 256) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(supplied), digest(process.env.CPANEL_INGRESS_SECRET!));
}
export function cpanelClientAddress(request: Request) {
  if (!trustedCpanelRequest(request)) return "unknown";
  const ip = request.headers.get("x-monetcore-client-ip") ?? "";
  return isIP(ip) ? ip : "unknown";
}
