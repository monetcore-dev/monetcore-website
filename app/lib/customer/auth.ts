import "server-only";
import { betterAuth } from "better-auth";
import nodemailer from "nodemailer";
import { authEmailDelivery } from "./emailContext";
import { getCustomerAuthPool } from "./database";
import {
  assertCustomerEnabled,
  assertTestEmail,
  customerEmailEnabled,
  customerOrigin,
  customerRegistrationEnabled,
  CustomerError,
} from "./config";

export async function authAudit(event: string, actorId: string | null = null) {
  await getCustomerAuthPool().query(
    "INSERT INTO customer_auth.auth_events (event, actor_id) VALUES ($1,$2)",
    [event, actorId],
  );
}
async function deliverCustomerAuthEmail(
  email: string,
  url: string,
  purpose: "verify" | "reset",
) {
  assertCustomerEnabled();
  if (!customerEmailEnabled()) throw new CustomerError(503, "email_disabled");
  assertTestEmail(email);
  const link = new URL(url);
  if (
    link.origin !== customerOrigin ||
    ![
      "/api/customer/auth/verify-email",
      "/api/customer/auth/reset-password",
    ].some(
      (path) => link.pathname === path || link.pathname.startsWith(path + "/"),
    )
  )
    throw new CustomerError(503, "email_link_invalid");
  const transport = nodemailer.createTransport({
    host: "mail.privateemail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.CUSTOMER_AUTH_SMTP_USER,
      pass: process.env.CUSTOMER_AUTH_SMTP_PASSWORD,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const result = await transport.sendMail({
    from: "Monetcore System Solutions <hello@monetcore.dev>",
    to: email,
    subject: `[STAGING TEST] ${purpose === "verify" ? "Verify your Monetcore email" : "Reset your Monetcore password"}`,
    text: `This is an approved customer-platform staging test. ${purpose === "verify" ? "Verify your email" : "Reset your password"}: ${url}\nIf you did not request this, ignore this email. Contact hello@monetcore.dev for help.`,
  });
  if (
    !result.accepted?.some(
      (value) => String(value).toLowerCase() === email.toLowerCase(),
    ) ||
    result.rejected?.length
  )
    throw new CustomerError(503, "email_not_accepted");
}

/** Better Auth deliberately catches mail callback exceptions: retain an honest API outcome. */
export async function sendCustomerAuthEmail(
  email: string,
  url: string,
  purpose: "verify" | "reset",
) {
  const delivery = authEmailDelivery.getStore();
  if (delivery) delivery.attempted = true;
  try {
    await deliverCustomerAuthEmail(email, url, purpose);
    if (delivery) delivery.accepted = true;
  } catch {
    if (delivery) delivery.failed = true;
    throw new CustomerError(503, "email_not_accepted");
  }
}

let auth: ReturnType<typeof createAuth> | undefined;
export function createAuth() {
  assertCustomerEnabled();
  return betterAuth({
    appName: "Monetcore Customer Platform",
    baseURL: customerOrigin,
    basePath: "/api/customer/auth",
    secret: process.env.CUSTOMER_AUTH_SECRET!,
    trustedOrigins: [customerOrigin],
    database: getCustomerAuthPool(),
    logger: { disabled: true },
    user: {
      modelName: "auth_user",
      additionalFields: {
        active: {
          type: "boolean",
          defaultValue: true,
          required: true,
          input: false,
        },
      },
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
    },
    session: {
      modelName: "auth_session",
      expiresIn: 60 * 60 * 24,
      updateAge: 60 * 60,
      freshAge: 15 * 60,
      cookieCache: { enabled: false },
    },
    account: { modelName: "auth_account", accountLinking: { enabled: false } },
    verification: { modelName: "auth_verification", storeIdentifier: "hashed" },
    emailAndPassword: {
      enabled: true,
      disableSignUp: !customerRegistrationEnabled(),
      requireEmailVerification: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 1800,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) =>
        sendCustomerAuthEmail(user.email, url, "reset"),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      expiresIn: 3600,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) =>
        sendCustomerAuthEmail(user.email, url, "verify"),
      afterEmailVerification: async (user) =>
        authAudit("email_verified", user.id),
    },
    // The wrapper supplies atomic PostgreSQL rate limits. No in-memory limiter.
    rateLimit: { enabled: false },
    advanced: {
      useSecureCookies: true,
      cookiePrefix: "monetcore-customer",
      defaultCookieAttributes: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      },
      database: { generateId: "uuid" },
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!customerRegistrationEnabled()) return false;
            assertTestEmail(user.email);
            return { data: { ...user, active: true } };
          },
          after: async (user) => authAudit("account_registered", user.id),
        },
      },
      session: {
        create: {
          before: async (session) => {
            const result = await getCustomerAuthPool().query(
              'SELECT active, "emailVerified" FROM customer_auth.auth_user WHERE id=$1',
              [session.userId],
            );
            return (
              result.rows[0]?.active === true &&
              result.rows[0]?.emailVerified === true
            );
          },
          after: async (session) =>
            authAudit("session_created", session.userId),
        },
        delete: {
          after: async (session) =>
            authAudit("session_revoked", session.userId),
        },
      },
    },
  });
}
export function getCustomerAuth() {
  assertCustomerEnabled();
  return (auth ??= createAuth());
}
