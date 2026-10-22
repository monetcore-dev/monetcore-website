import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

export const assistantBranch = "feature/monetcore-stage1-websites";

/** There is deliberately no public production-inference mode in this release. */
export function isControlledTestEnabled() {
  if (
    process.env.VERCEL !== "1" ||
    process.env.AI_ASSISTANT_EMERGENCY_STOP !== "false" ||
    process.env.AI_OWNER_TEST_ENABLED !== "true"
  ) return false;
  return process.env.VERCEL_ENV === "preview"
    ? process.env.STAGING_AI_ASSISTANT_ENABLED === "true" &&
        process.env.VERCEL_GIT_COMMIT_REF === assistantBranch
    : process.env.VERCEL_ENV === "production" &&
        process.env.AI_ASSISTANT_ENABLED === "true" &&
        ["main", assistantBranch].includes(process.env.VERCEL_GIT_COMMIT_REF ?? "");
}

export function ownerCredentialConfigured() {
  return /^[a-f0-9]{64}$/.test(process.env.AI_OWNER_PASSWORD_SHA256 ?? "");
}

/** HTTP Basic over HTTPS, for one owner using a random password of >=32 chars.
 * No password is passed to React, persisted in browser storage, or logged.
 * Enforced independently in Proxy AND the paid API route.
 */
export function ownerTestAccess(request: Request): Response | null {
  if (!["production", "preview"].includes(process.env.VERCEL_ENV ?? "")) return null;
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
  if (
    process.env.VERCEL !== "1" ||
    !isControlledTestEnabled() ||
    !ownerCredentialConfigured()
  )
    return Response.json(
      { error: "The AI Assistant is unavailable." },
      { status: 503, headers },
    );
  // Never accept the owner credential on deployment aliases or an HTTP origin.
  if (new URL(request.url).protocol !== "https:" ||
    (process.env.VERCEL_ENV === "production" && new URL(request.url).origin !== "https://monetcore.dev"))
    return Response.json(
      { error: "Owner test access is unavailable here." },
      { status: 403, headers },
    );
  const authorization = request.headers.get("authorization") ?? "";
  let valid = false;
  if (
    authorization.length <= 1024 &&
    /^Basic [A-Za-z0-9+/]+={0,2}$/.test(authorization)
  ) {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString(
      "utf8",
    );
    const separator = decoded.indexOf(":");
    const password = decoded.slice(separator + 1);
    const digest = createHash("sha256").update(password).digest();
    valid =
      decoded.slice(0, separator) === "owner" &&
      separator >= 0 &&
      password.length >= 32 &&
      timingSafeEqual(
        digest,
        Buffer.from(process.env.AI_OWNER_PASSWORD_SHA256!, "hex"),
      );
  }
  return valid
    ? null
    : Response.json({ error: "Owner authentication required." }, {
        status: 401,
        headers: { ...headers, "WWW-Authenticate": 'Basic realm="Monetcore owner AI test", charset="UTF-8"' },
      });
}
