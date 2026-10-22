import "server-only";

export type OriginFailure =
  | "nonproduction_non_https"
  | "host_mismatch"
  | "forwarded_host_mismatch"
  | "forwarded_protocol_mismatch"
  | "fallback_not_vercel"
  | "fallback_host_missing"
  | "fallback_protocol_missing";

function hostnameCategory(value: string): string {
  if (value === "monetcore.dev") return "canonical";
  if (value === "www.monetcore.dev") return "www";
  if (["localhost", "127.0.0.1", "[::1]"].includes(value)) return "loopback";
  if (value.endsWith(".vercel.app")) return "vercel_domain";
  return "other";
}
function hostCategory(value: string | null): string {
  if (value === null) return "missing";
  if (value.includes(",")) return "multiple";
  if (value === "monetcore.dev:443") return "canonical_with_port";
  return hostnameCategory(value);
}
function protocolCategory(value: string | null): string {
  if (value === null) return "missing";
  if (value === "https" || value === "http") return value;
  if (value.includes(",")) return "multiple";
  return "other";
}

/** TEMPORARY origin rejection telemetry. Only fixed categories are emitted.
 * Do not add raw headers, URLs, env dumps, request bodies or credentials here.
 * Logging failure must never affect the authorization decision.
 */
export function reportOriginFailure(request: Request, reason: OriginFailure) {
  try {
    const url = new URL(request.url);
    const environment = process.env.VERCEL_ENV;
    const branch = process.env.VERCEL_GIT_COMMIT_REF;
    const revision = process.env.VERCEL_GIT_COMMIT_SHA;
    console.warn("Monetcore assistant origin diagnostic v1", {
      reason,
      url_protocol: protocolCategory(url.protocol.slice(0, -1)),
      url_hostname: hostnameCategory(url.hostname),
      url_port: url.port ? "explicit" : "default",
      host: hostCategory(request.headers.get("host")),
      forwarded_protocol: protocolCategory(request.headers.get("x-forwarded-proto")),
      forwarded_host: hostCategory(request.headers.get("x-forwarded-host")),
      vercel_runtime: process.env.VERCEL === "1" ? "vercel" : "not_vercel",
      deployment_environment: ["production", "preview", "development"].includes(environment ?? "")
        ? environment : environment === undefined ? "missing" : "other",
      deployment_branch: branch === "main" ? "main"
        : branch === "feature/monetcore-stage1-websites" ? "approved_feature"
        : branch === undefined ? "missing" : "other",
      // Known public revision is categorized, never echo arbitrary env values.
      deployment_revision: revision === "77e67c8512a019a9dbb7dd30f097b9f07efc09a0"
        ? "pr4_merge" : revision === undefined ? "missing" : "other",
    });
  } catch {
    // Preserve the same rejection even if telemetry is unavailable.
  }
  return null;
}
