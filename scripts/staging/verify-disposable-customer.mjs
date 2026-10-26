// Explicit opt-in only; never part of npm test, never a TCP/database URL target.
import assert from "node:assert/strict";
import { realpath } from "node:fs/promises";
import { registerHooks } from "node:module";
import { Pool } from "pg";
if (process.argv[2] !== "--disposable-local-only" || process.argv.length !== 3)
  throw new Error("Use --disposable-local-only on the isolated fixture");
const socket = "/tmp/monetcore-customer-pg-socket";
assert.equal(await realpath(socket), socket);
const admin = new Pool({
  host: socket,
  database: "monetcore_customer_staging",
  user: "postgres",
});
const checks = [];
let appPool, authPool;
try {
  const info = (
    await admin.query(
      "SELECT current_setting('cluster_name') AS marker,current_setting('server_version_num')::int AS version",
    )
  ).rows[0];
  assert.equal(info.marker, "monetcore_customer_disposable");
  assert.ok(info.version >= 160000 && info.version < 170000);
  assert.equal(
    (
      await admin.query(
        "SELECT count(*)::int AS n FROM customer_auth.auth_user",
      )
    ).rows[0].n,
    0,
    "Refuse existing identity data",
  );
  checks.push("marked isolated PostgreSQL16 and empty customer fixture");
  await admin.query(
    "ALTER ROLE monetcore_customer_auth LOGIN; ALTER ROLE monetcore_customer_runtime LOGIN",
  );
  registerHooks({
    resolve(specifier, context, next) {
      if (
        (context.parentURL?.includes("/app/lib/customer/") &&
          specifier === "./database") ||
        specifier.endsWith("/lib/customer/database")
      )
        return {
          url: new URL(
            "../../tests/staging/customer-live-pools.mjs",
            import.meta.url,
          ).href,
          shortCircuit: true,
        };
      return next(specifier, context);
    },
  });
  Object.assign(process.env, {
    NODE_ENV: "production",
    MONETCORE_STAGING: "true",
    MONETCORE_VPS_REVIEW: "true",
    MONETCORE_VPS_PROXY_VERIFIED: "true",
    CUSTOMER_PLATFORM_ENABLED: "true",
    CUSTOMER_DATABASE_NAME: "monetcore_customer_staging",
    CUSTOMER_AUTH_SECRET:
      "synthetic-customer-secret-at-least-thirty-two-characters",
    CUSTOMER_AUTH_DB_PASSWORD: "synthetic",
    CUSTOMER_APP_DB_PASSWORD: "synthetic",
    CUSTOMER_AUTH_TEST_EMAILS: "a@example.invalid,b@example.invalid",
    CUSTOMER_REGISTRATION_ENABLED: "true",
    CUSTOMER_AUTH_EMAIL_ENABLED: "true",
    CUSTOMER_AUTH_SMTP_USER: "hello@monetcore.dev",
    CUSTOMER_AUTH_SMTP_PASSWORD: "synthetic-only",
  });
  globalThis.fetch = async () => {
    throw new Error("External HTTP forbidden in disposable verification");
  };
  ({ appPool, authPool } =
    await import("../../tests/staging/customer-live-pools.mjs"));
  const { state } = await import("../../tests/integrations.mjs");
  const { POST: authPOST, GET: authGET } =
    await import("../../app/api/customer/auth/[...all]/route.ts");
  const { requireCustomerSession } =
    await import("../../app/lib/customer/session.ts");
  const repo = await import("../../app/lib/customer/repository.ts");
  const { POST: deactivate } =
    await import("../../app/api/customer/account/route.ts");
  let sequence = 0;
  function headers(cookie = "") {
    return {
      host: "review.monetcore.dev",
      origin: "https://review.monetcore.dev",
      "x-forwarded-host": "review.monetcore.dev",
      "x-forwarded-proto": "https",
      "x-forwarded-for": `192.0.2.${++sequence}`,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    };
  }
  function post(path, body, cookie = "") {
    return authPOST(
      new Request(`https://review.monetcore.dev/api/customer/auth/${path}`, {
        method: "POST",
        headers: headers(cookie),
        body: JSON.stringify(body),
      }),
    );
  }
  const signup = await post("sign-up/email", {
    name: "Synthetic A",
    email: "a@example.invalid",
    password: "Synthetic Password 123!",
    callbackURL: "/customer/login?verified=1",
  });
  assert.equal(signup.status, 200, await signup.clone().text());
  assert.equal(state.emails.length, 1);
  assert.equal(
    (
      await post("sign-in/email", {
        email: "a@example.invalid",
        password: "Synthetic Password 123!",
      })
    ).status,
    403,
  );
  checks.push(
    "real Better Auth signup schema, hashed password and verification-gated login",
  );
  const account = (
    await admin.query("SELECT password FROM customer_auth.auth_account")
  ).rows[0];
  assert.ok(!account.password.includes("Synthetic"));
  const verifyUrl = state.emails[0].text.match(/https:\/\/\S+/)[0];
  const verify = await authGET(
    new Request(verifyUrl, {
      headers: { ...headers(), "sec-fetch-site": "cross-site" },
    }),
  );
  assert.ok(
    verify.status >= 200 && verify.status < 400,
    await verify.clone().text(),
  );
  const signin = await post("sign-in/email", {
    email: "a@example.invalid",
    password: "Synthetic Password 123!",
    rememberMe: false,
  });
  assert.equal(signin.status, 200, await signin.clone().text());
  const cookies = signin.headers.getSetCookie();
  assert.ok(
    cookies.some(
      (value) =>
        /HttpOnly/i.test(value) &&
        /Secure/i.test(value) &&
        /SameSite=Lax/i.test(value),
    ),
  );
  const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
  assert.deepEqual(await signin.json(), { success: true });
  const principal = await requireCustomerSession(new Headers({ cookie }));
  assert.equal(principal.email, "a@example.invalid");
  checks.push(
    "real email-token verification, secure HttpOnly cookie and authoritative session resolution",
  );
  const a = principal.userId,
    b = "00000000-0000-4000-8000-000000000012",
    orgA = "00000000-0000-4000-8000-000000000021",
    orgB = "00000000-0000-4000-8000-000000000022";
  await admin.query(
    'INSERT INTO customer_auth.auth_user(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',
    [b, "Synthetic B", "b@example.invalid"],
  );
  await admin.query(
    "INSERT INTO customer.organizations(id,name) VALUES($1,$2),($3,$4)",
    [orgA, "Synthetic A", orgB, "Synthetic B"],
  );
  await admin.query(
    "INSERT INTO customer.memberships(organization_id,user_id,role) VALUES($1,$2,$3),($4,$5,$6)",
    [orgA, a, "organization_admin", orgB, b, "organization_member"],
  );
  await admin.query(
    "INSERT INTO customer.projects(organization_id,title) VALUES($1,$2),($3,$4)",
    [orgA, "A project", orgB, "B project"],
  );
  assert.equal(
    (await repo.customerDashboard(principal, orgA)).projects.length,
    1,
  );
  await assert.rejects(
    repo.customerDashboard(principal, orgB),
    (error) => error.status === 403,
  );
  checks.push("real repository tenant reads and Organization A denial for B");
  const data = {
    title: "Synthetic request",
    category: "Custom software",
    objectives: "A sufficiently descriptive synthetic objective",
    requirements: "A sufficiently descriptive synthetic requirement",
    budget: "Not yet decided",
    timeline: "To be discussed",
    notes: "",
    idempotencyKey: "00000000-0000-4000-8000-000000000031",
  };
  await assert.rejects(
    repo.submitProjectRequest(principal, orgB, data),
    (error) => error.status === 403,
  );
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () =>
      repo.submitProjectRequest(principal, orgA, data),
    ),
  );
  assert.equal(attempts.filter((row) => !row.duplicate).length, 1);
  assert.equal(new Set(attempts.map((row) => row.id)).size, 1);
  assert.equal(
    (await admin.query("SELECT count(*)::int AS n FROM customer.audit_events"))
      .rows[0].n,
    1,
  );
  await assert.rejects(
    repo.submitProjectRequest(principal, orgA, {
      ...data,
      title: "Different payload",
    }),
    (error) => error.status === 409,
  );
  checks.push(
    "cross-tenant write denial, eight concurrent idempotent submissions, one atomic audit and changed-payload conflict",
  );
  // Verify RLS independently of repository WHERE clauses.
  await repo.customerTransaction(principal, async (client) => {
    assert.equal(
      (
        await client.query(
          "SELECT * FROM customer.projects WHERE organization_id=$1",
          [orgB],
        )
      ).rows.length,
      0,
    );
  });
  assert.equal(
    (await appPool.query("SELECT * FROM customer.projects")).rows.length,
    0,
  );
  for (const sql of [
    "SELECT * FROM customer_auth.auth_user",
    "SELECT * FROM customer.platform_owners",
    "UPDATE customer.memberships SET role='organization_admin'",
    "DELETE FROM customer.project_requests",
    "CREATE TABLE customer.escalation(id int)",
  ])
    await assert.rejects(appPool.query(sql), (error) => error.code === "42501");
  await assert.rejects(
    authPool.query("SELECT * FROM customer.projects"),
    (error) => error.code === "42501",
  );
  checks.push(
    "forced RLS, context cleared between pooled transactions, runtime/auth separation and privilege-escalation denial",
  );
  await admin.query(
    "UPDATE customer.memberships SET active=false WHERE organization_id=$1 AND user_id=$2",
    [orgA, a],
  );
  await assert.rejects(
    repo.customerDashboard(principal, orgA),
    (error) => error.status === 403,
  );
  await assert.rejects(
    repo.submitProjectRequest(principal, orgA, data),
    (error) => error.status === 403,
  );
  await admin.query(
    "UPDATE customer.memberships SET active=true WHERE organization_id=$1 AND user_id=$2",
    [orgA, a],
  );
  checks.push(
    "membership revocation blocks reads/writes without deleting requests or historical membership",
  );
  const { customerRateLimit } =
    await import("../../app/lib/customer/rateLimit.ts");
  const rateRequest = new Request(
    "https://review.monetcore.dev/api/customer/auth/sign-in/email",
    { headers: { "x-forwarded-for": "192.0.2.240" } },
  );
  const limits = await Promise.allSettled(
    Array.from({ length: 25 }, () => customerRateLimit(rateRequest, "auth")),
  );
  assert.equal(limits.filter((row) => row.status === "fulfilled").length, 15);
  assert.equal(
    limits.filter(
      (row) => row.status === "rejected" && row.reason.status === 429,
    ).length,
    10,
  );
  checks.push(
    "real atomic PostgreSQL limiter: 25 simultaneous attempts, exactly 15 admitted",
  );
  const bad = await post("sign-in/email", {
    email: "a@example.invalid",
    password: "Incorrect synthetic password",
  });
  assert.equal(bad.status, 401);
  const reset = await post("request-password-reset", {
    email: "a@example.invalid",
    redirectTo: "/customer/login?mode=reset",
  });
  assert.equal(reset.status, 200, await reset.clone().text());
  const resetUrl = state.emails.at(-1).text.match(/https:\/\/\S+/)[0];
  const follow = await authGET(new Request(resetUrl, { headers: headers() }));
  assert.equal(follow.status, 302);
  const token = new URL(
    follow.headers.get("location"),
    "https://review.monetcore.dev",
  ).searchParams.get("token");
  assert.ok(token);
  assert.equal(
    (
      await post("reset-password", {
        token,
        newPassword: "Replacement synthetic password 123!",
      })
    ).status,
    200,
  );
  await assert.rejects(
    requireCustomerSession(new Headers({ cookie })),
    (error) => error.status === 401,
  );
  assert.ok(
    (
      await post("reset-password", {
        token,
        newPassword: "Another synthetic password 123!",
      })
    ).status >= 400,
  );
  checks.push(
    "real wrong-password denial, password recovery, one-use reset and session revocation",
  );
  const newSignin = await post("sign-in/email", {
    email: "a@example.invalid",
    password: "Replacement synthetic password 123!",
  });
  assert.equal(newSignin.status, 200);
  const nextCookie = newSignin.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  await admin.query(
    "UPDATE customer_auth.auth_session SET \"expiresAt\"=now()-interval '1 minute'",
  );
  await assert.rejects(
    requireCustomerSession(new Headers({ cookie: nextCookie })),
    (error) => error.status === 401,
  );
  checks.push("real expired session denied");
  const finalSignin = await post("sign-in/email", {
    email: "a@example.invalid",
    password: "Replacement synthetic password 123!",
  });
  const finalCookie = finalSignin.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const deactivated = await deactivate(
    new Request("https://review.monetcore.dev/api/customer/account", {
      method: "POST",
      headers: headers(finalCookie),
      body: JSON.stringify({ action: "deactivate" }),
    }),
  );
  assert.equal(deactivated.status, 200);
  await assert.rejects(
    requireCustomerSession(new Headers({ cookie: finalCookie })),
    (error) => error.status === 401,
  );
  assert.ok(
    (
      await post("sign-in/email", {
        email: "a@example.invalid",
        password: "Replacement synthetic password 123!",
      })
    ).status >= 400,
  );
  assert.equal(
    (
      await admin.query(
        "SELECT active FROM customer_auth.auth_user WHERE id=$1",
        [a],
      )
    ).rows[0].active,
    false,
  );
  checks.push(
    "real deactivation atomically revokes sessions and prevents subsequent login",
  );
  const { sendCustomerAuthEmail } =
    await import("../../app/lib/customer/auth.ts");
  const syntheticLink =
    "https://review.monetcore.dev/api/customer/auth/verify-email?token=synthetic-only";
  state.failEmail = true;
  await assert.rejects(
    sendCustomerAuthEmail("a@example.invalid", syntheticLink, "verify"),
  );
  assert.equal(
    (
      await post("request-password-reset", {
        email: "a@example.invalid",
        redirectTo: "/customer/login?mode=reset",
      })
    ).status,
    503,
  );
  state.failEmail = false;
  state.rejectEmail = true;
  await assert.rejects(
    sendCustomerAuthEmail("a@example.invalid", syntheticLink, "verify"),
  );
  assert.equal(
    (
      await post("request-password-reset", {
        email: "a@example.invalid",
        redirectTo: "/customer/login?mode=reset",
      })
    ).status,
    503,
  );
  state.rejectEmail = false;
  await assert.rejects(
    sendCustomerAuthEmail(
      "not-approved@example.invalid",
      syntheticLink,
      "verify",
    ),
  );
  process.env.CUSTOMER_AUTH_EMAIL_ENABLED = "false";
  await assert.rejects(
    sendCustomerAuthEmail("a@example.invalid", syntheticLink, "verify"),
  );
  checks.push(
    "mocked SMTP failure/rejection, recipient allowlist and email-disabled guard cannot report delivery success",
  );
  console.log(JSON.stringify({ passed: checks.length, failed: 0, checks }));
} finally {
  await appPool?.end();
  await authPool?.end();
  await admin.end();
}
