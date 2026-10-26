import { authEmailDelivery } from "../../../../lib/customer/emailContext";
import { getCustomerAuth, authAudit } from "../../../../lib/customer/auth";
import {
  assertCustomerEnabled,
  assertTestEmail,
  customerOrigin,
  customerRegistrationEnabled,
  customerEmailEnabled,
  CustomerError,
  customerResponseError,
  validateCustomerOrigin,
} from "../../../../lib/customer/config";
import { readCustomerJson } from "../../../../lib/customer/http";
import { customerRateLimit } from "../../../../lib/customer/rateLimit";
export const runtime = "nodejs";
const postPaths = new Set([
  "sign-up/email",
  "sign-in/email",
  "sign-out",
  "request-password-reset",
  "reset-password",
  "send-verification-email",
  "revoke-sessions",
  "revoke-other-sessions",
  "change-password",
]);
async function handle(request: Request) {
  try {
    assertCustomerEnabled();
    validateCustomerOrigin(request, request.method !== "GET");
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/customer\/auth\//, "");
    if (
      request.method === "GET"
        ? !(
            path === "verify-email" ||
            /^reset-password\/[A-Za-z0-9_-]{10,500}$/.test(path)
          )
        : !postPaths.has(path)
    )
      throw new CustomerError(404, "unsupported_auth_route");
    await customerRateLimit(request, "auth");
    let body: Record<string, unknown> | undefined;
    if (request.method === "POST") {
      body = await readCustomerJson(request);
      const permitted: Record<string, string[]> = {
        "sign-up/email": ["name", "email", "password", "callbackURL"],
        "sign-in/email": ["email", "password", "rememberMe", "callbackURL"],
        "sign-out": [],
        "request-password-reset": ["email", "redirectTo"],
        "reset-password": ["token", "newPassword"],
        "send-verification-email": ["email", "callbackURL"],
        "revoke-sessions": [],
        "revoke-other-sessions": [],
        "change-password": [
          "currentPassword",
          "newPassword",
          "revokeOtherSessions",
        ],
      };
      if (Object.keys(body).some((key) => !permitted[path].includes(key)))
        throw new CustomerError(400, "unapproved_auth_field");
      if (path === "sign-up/email" && !customerRegistrationEnabled())
        throw new CustomerError(503, "registration_disabled");
      if (
        [
          "request-password-reset",
          "send-verification-email",
          "sign-up/email",
        ].includes(path) &&
        !customerEmailEnabled()
      )
        throw new CustomerError(503, "email_disabled");
      if (typeof body.email === "string") {
        const email = body.email.trim().toLowerCase();
        body.email = email;
        assertTestEmail(email);
      }
      if (
        [
          "sign-in/email",
          "sign-up/email",
          "request-password-reset",
          "send-verification-email",
        ].includes(path) &&
        (typeof body.email !== "string" || body.email.length > 254)
      )
        throw new CustomerError(400, "email_required");
      for (const name of ["password", "newPassword", "currentPassword"])
        if (
          name in body &&
          (typeof body[name] !== "string" ||
            (body[name] as string).length > 128)
        )
          throw new CustomerError(400, "password_length");
      if (
        path === "sign-up/email" &&
        (typeof body.name !== "string" ||
          body.name.trim().length < 1 ||
          body.name.length > 160)
      )
        throw new CustomerError(400, "invalid_name");
      for (const field of ["callbackURL", "redirectTo"])
        if (field in body) validateCallback(body[field]);
    }
    for (const field of ["callbackURL", "callbackUrl", "redirectTo"])
      if (url.searchParams.has(field))
        validateCallback(url.searchParams.get(field));
    await authAudit("auth_attempt");
    const headers = new Headers(request.headers);
    headers.delete("content-length");
    // Fixed canonical URL after trusted proxy validation; Better Auth enforces its own origin/CSRF checks too.
    const canonical = new Request(customerOrigin + url.pathname + url.search, {
      method: request.method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const delivery = { attempted: false, accepted: false, failed: false };
    const response = await authEmailDelivery.run(delivery, () =>
      getCustomerAuth().handler(canonical),
    );
    if (delivery.failed || (delivery.attempted && !delivery.accepted)) {
      await authAudit("auth_rejected");
      throw new CustomerError(503, "authentication_email_unconfirmed");
    }
    await authAudit(response.status < 400 ? "auth_accepted" : "auth_rejected");
    const safeHeaders = new Headers(response.headers);
    safeHeaders.delete("content-length");
    safeHeaders.set("Cache-Control", "no-store");
    safeHeaders.set("X-Robots-Tag", "noindex, nofollow");
    // Never expose library/session/token payloads to application JavaScript.
    if (response.status >= 300 && response.status < 400)
      return new Response(null, {
        status: response.status,
        headers: safeHeaders,
      });
    if (!response.ok)
      return Response.json(
        {
          error:
            "Authentication could not be completed. Check your details and email verification, or contact Monetcore.",
        },
        { status: response.status, headers: safeHeaders },
      );
    return Response.json(
      { success: true },
      { status: response.status, headers: safeHeaders },
    );
  } catch (error) {
    return customerResponseError(error);
  }
}
function validateCallback(value: unknown) {
  if (typeof value !== "string")
    throw new CustomerError(400, "invalid_callback");
  let target: URL;
  try {
    target = new URL(value, customerOrigin);
  } catch {
    throw new CustomerError(400, "invalid_callback");
  }
  if (
    target.origin !== customerOrigin ||
    !["/customer", "/customer/login", "/customer/account"].includes(
      target.pathname,
    ) ||
    target.username ||
    target.password
  )
    throw new CustomerError(400, "invalid_callback");
}
export const GET = handle;
export const POST = handle;
