import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import {
  customerState as state,
  organizationA,
  organizationB,
} from "./customer-fixture.mjs";
const fixture = new URL("./customer-fixture.mjs", import.meta.url).href;
registerHooks({
  resolve(specifier, context, next) {
    if (
      (context.parentURL?.includes("/app/lib/customer/") &&
        ["./database", "./auth"].includes(specifier)) ||
      specifier.endsWith("/lib/customer/database")
    )
      return { url: fixture, shortCircuit: true };
    return next(specifier, context);
  },
});
const config = await import("../app/lib/customer/config.ts");
const { principalFromSession, requireCustomerSession } =
  await import("../app/lib/customer/session.ts");
const repo = await import("../app/lib/customer/repository.ts");
const { validateProjectRequest } =
  await import("../app/lib/customer/validation.ts");
const { customerRateLimit } = await import("../app/lib/customer/rateLimit.ts");
const { POST: submit } =
  await import("../app/api/customer/organizations/[organizationId]/requests/route.ts");
const { POST: deactivate } =
  await import("../app/api/customer/account/route.ts");
const saved = { ...process.env };
const principal = {
  userId: "user-a",
  name: "Synthetic",
  email: "customer@example.invalid",
};
const valid = {
  title: "Synthetic project",
  category: "Custom software",
  objectives: "A synthetic business objective for testing",
  requirements: "Synthetic requirements for tenant isolation testing",
  budget: "Not yet decided",
  timeline: "To be discussed",
  notes: "",
  idempotencyKey: "00000000-0000-4000-8000-000000000004",
};
function enable() {
  Object.assign(process.env, {
    NODE_ENV: "production",
    MONETCORE_STAGING: "true",
    MONETCORE_VPS_REVIEW: "true",
    MONETCORE_VPS_PROXY_VERIFIED: "true",
    CUSTOMER_PLATFORM_ENABLED: "true",
    CUSTOMER_DATABASE_NAME: "monetcore_customer_staging",
    CUSTOMER_AUTH_SECRET: "synthetic-customer-secret-at-least-32-characters",
    CUSTOMER_AUTH_DB_PASSWORD: "synthetic",
    CUSTOMER_APP_DB_PASSWORD: "synthetic",
    CUSTOMER_AUTH_TEST_EMAILS: "customer@example.invalid",
  });
}
function request(body = valid, extra = {}) {
  return new Request(
    `https://review.monetcore.dev/api/customer/organizations/${organizationA}/requests`,
    {
      method: "POST",
      headers: {
        host: "review.monetcore.dev",
        origin: "https://review.monetcore.dev",
        "x-forwarded-proto": "https",
        "x-forwarded-for": "192.0.2.10",
        "content-type": "application/json",
        ...extra,
      },
      body: JSON.stringify(body),
    },
  );
}
function session() {
  return {
    user: {
      id: "user-a",
      name: "Synthetic",
      email: "customer@example.invalid",
      emailVerified: true,
      active: true,
    },
    session: { expiresAt: new Date(Date.now() + 3600000) },
  };
}
beforeEach(() => {
  for (const k of Object.keys(process.env)) delete process.env[k];
  state.queries = [];
  state.session = null;
  state.fail = false;
  state.failAudit = false;
  state.rate = 1;
  state.request = null;
  state.context = null;
  state.released = 0;
});
after(() => {
  for (const k of Object.keys(process.env)) delete process.env[k];
  Object.assign(process.env, saved);
});
test("customer platform and registration fail closed by default; no database operation", async () => {
  assert.equal(config.customerEnabled(), false);
  assert.equal(
    (
      await submit(request(), {
        params: Promise.resolve({ organizationId: organizationA }),
      })
    ).status,
    503,
  );
  assert.equal(state.queries.length, 0);
  enable();
  assert.equal(config.customerEnabled(), true);
  assert.equal(config.customerRegistrationEnabled(), false);
  assert.equal(config.customerEmailEnabled(), false);
  for (const key of ["VERCEL", "VERCEL_ENV"]) {
    process.env[key] = "preview";
    assert.equal(config.customerEnabled(), false);
    delete process.env[key];
  }
  process.env.CUSTOMER_DATABASE_NAME = "monetcore_db";
  assert.equal(config.customerEnabled(), false);
});
test("session missing, expired, revoked, unverified or deactivated cannot authorize", () => {
  for (const data of [
    null,
    {},
    { ...session(), session: { expiresAt: new Date(0) } },
  ])
    assert.throws(() => principalFromSession(data));
  for (const field of ["active", "emailVerified"]) {
    const data = session();
    data.user[field] = false;
    assert.throws(() => principalFromSession(data));
  }
  assert.equal(principalFromSession(session()).userId, "user-a");
});
test("proxy origin checks reject cross-site mutations and spoofed hosts but allow signed email navigation", () => {
  enable();
  config.validateCustomerOrigin(request(), true);
  for (const extra of [
    { host: "evil.example" },
    { origin: "https://evil.example" },
    { "x-forwarded-host": "evil.example" },
    { "x-forwarded-proto": "http" },
    { "sec-fetch-site": "cross-site" },
  ])
    assert.throws(() =>
      config.validateCustomerOrigin(request(valid, extra), true),
    );
  config.validateCustomerOrigin(
    new Request("https://review.monetcore.dev/api/customer/auth/verify-email", {
      headers: { host: "review.monetcore.dev", "sec-fetch-site": "cross-site" },
    }),
    false,
  );
});
test("staging email recipient allowlist rejects unapproved addresses", () => {
  enable();
  assert.doesNotThrow(() => config.assertTestEmail("CUSTOMER@example.invalid"));
  assert.throws(() => config.assertTestEmail("unapproved@example.invalid"));
  process.env.CUSTOMER_AUTH_TEST_EMAILS = "";
  assert.throws(() => config.assertTestEmail("customer@example.invalid"));
});
test("project validation rejects privilege/tenant injection, invalid options and oversized fields", () => {
  assert.equal(validateProjectRequest(valid).title, valid.title);
  for (const change of [
    { organizationId: organizationB },
    { submitted_by: "other" },
    { role: "platform_owner" },
    { status: "approved" },
    { title: "x" },
    { requirements: "x" },
    { notes: "x".repeat(2001) },
    { category: "fake" },
    { budget: "$100" },
    { timeline: "tomorrow" },
    { idempotencyKey: "bad" },
  ])
    assert.throws(() => validateProjectRequest({ ...valid, ...change }));
});
test("Organization A cannot read or write B even with a supplied valid B identifier", async () => {
  enable();
  await assert.rejects(
    repo.customerDashboard(principal, organizationB),
    (e) => e.status === 403,
  );
  await assert.rejects(
    repo.submitProjectRequest(principal, organizationB, valid),
    (e) => e.status === 403,
  );
  assert.equal(
    state.queries.some((q) =>
      q.text.includes("INSERT INTO customer.project_requests"),
    ),
    false,
  );
  assert.ok(state.queries.filter((q) => q.text === "ROLLBACK").length === 2);
  assert.equal(state.context, null);
});
test("request and audit commit together, same payload is idempotent and changed retry conflicts", async () => {
  enable();
  const first = await repo.submitProjectRequest(
    principal,
    organizationA,
    valid,
  );
  assert.equal(first.duplicate, false);
  assert.ok(
    state.queries.some((q) =>
      q.text.includes("INSERT INTO customer.audit_events"),
    ),
  );
  assert.equal(state.queries.at(-1).text, "COMMIT");
  const second = await repo.submitProjectRequest(
    principal,
    organizationA,
    valid,
  );
  assert.equal(second.duplicate, true);
  await assert.rejects(
    repo.submitProjectRequest(principal, organizationA, {
      ...valid,
      title: "Changed title",
    }),
    (e) => e.status === 409,
  );
  assert.equal(state.context, null);
});
test("audit failure rolls back; there is no automatic retry or false success", async () => {
  enable();
  state.failAudit = true;
  await assert.rejects(
    repo.submitProjectRequest(principal, organizationA, valid),
  );
  assert.equal(state.queries.at(-1).text, "ROLLBACK");
  assert.equal(
    state.queries.filter((q) =>
      q.text.includes("INSERT INTO customer.project_requests"),
    ).length,
    1,
  );
  assert.equal(state.released, 1);
});
test("unauthorized API access and unverified identity fail without tenant reads", async () => {
  enable();
  assert.equal(
    (
      await submit(request(), {
        params: Promise.resolve({ organizationId: organizationA }),
      })
    ).status,
    401,
  );
  state.session = session();
  state.session.user.emailVerified = false;
  assert.equal(
    (
      await submit(request(), {
        params: Promise.resolve({ organizationId: organizationA }),
      })
    ).status,
    403,
  );
  assert.equal(
    state.queries.some((q) => q.text.includes("customer.memberships")),
    false,
  );
});
test("database outage, malformed rate result and burst exhaustion fail closed", async () => {
  enable();
  state.fail = true;
  const old = console.error;
  console.error = () => {};
  try {
    const response = await submit(request(), {
      params: Promise.resolve({ organizationId: organizationA }),
    });
    assert.equal(response.status, 503);
    assert.ok(!(await response.text()).includes("synthetic internal"));
  } finally {
    console.error = old;
  }
  state.fail = false;
  state.rate = 16;
  await assert.rejects(
    customerRateLimit(request(), "auth"),
    (e) => e.status === 429,
  );
  state.rate = NaN;
  await assert.rejects(
    customerRateLimit(request(), "auth"),
    (e) => e.status === 503,
  );
});
test("account deactivation revokes sessions and appends an audit record transactionally", async () => {
  enable();
  state.session = session();
  const response = await deactivate(request({ action: "deactivate" }));
  assert.equal(response.status, 200);
  assert.ok(state.queries.some((q) => q.text.includes("active=false")));
  assert.ok(
    state.queries.some((q) =>
      q.text.includes("DELETE FROM customer_auth.auth_session"),
    ),
  );
  assert.ok(
    state.queries.some((q) => q.values.includes("account_deactivated")),
  );
  assert.equal(state.queries.at(-1).text, "COMMIT");
});
test("disabled customer auth endpoints and registration never reach the identity library", async () => {
  const { POST: authPost } =
    await import("../app/api/customer/auth/[...all]/route.ts");
  let response = await authPost(
    new Request(
      "https://review.monetcore.dev/api/customer/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          host: "review.monetcore.dev",
          origin: "https://review.monetcore.dev",
          "x-forwarded-for": "192.0.2.12",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Synthetic",
          email: "customer@example.invalid",
          password: "Synthetic password 123!",
        }),
      },
    ),
  );
  assert.equal(response.status, 503);
  enable();
  response = await authPost(
    new Request(
      "https://review.monetcore.dev/api/customer/auth/sign-up/email",
      {
        method: "POST",
        headers: {
          host: "review.monetcore.dev",
          origin: "https://review.monetcore.dev",
          "x-forwarded-for": "192.0.2.12",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Synthetic",
          email: "customer@example.invalid",
          password: "Synthetic password 123!",
        }),
      },
    ),
  );
  assert.equal(response.status, 503);
});

test("removing an approved staging email blocks an existing session", async () => {
  enable();
  state.session = session();
  assert.equal((await requireCustomerSession(new Headers())).userId, "user-a");
  process.env.CUSTOMER_AUTH_TEST_EMAILS = "other@example.invalid";
  await assert.rejects(
    requireCustomerSession(new Headers()),
    (error) => error.status === 403,
  );
});
