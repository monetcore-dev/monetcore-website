import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { POST } from "../app/api/assistant/route.ts";
import { proxy, config as proxyConfig } from "../proxy.ts";
import { ownerTestAccess } from "../app/lib/assistant/access.ts";
import { configuration, admissionScript, stagingRunCheckScript } from "../app/lib/assistant/controls.ts";
import { pricingApprovalId, pricingPolicy } from "../app/lib/assistant/pricing.ts";
const password = "synthetic-owner-only-password-over-32-characters";
const runId = "33333333-3333-4333-8333-333333333333";
const env = {
  VERCEL: "1", VERCEL_ENV: "production",
  VERCEL_GIT_COMMIT_REF: "feature/monetcore-stage1-websites",
  AI_ASSISTANT_ENABLED: "true", AI_OWNER_TEST_ENABLED: "true",
  AI_OWNER_PASSWORD_SHA256: createHash("sha256").update(password).digest("hex"),
  STAGING_AI_TEST_RUN_ID: runId,
  OPENAI_API_KEY: "synthetic-owner-project-key", OPENAI_MODEL: pricingPolicy.model,
  AI_PRICING_APPROVAL: pricingApprovalId, AI_MAX_CALL_COST_MICRO_USD: "2500",
  AI_UPSTASH_REDIS_REST_URL: "https://assistant-only.upstash.io",
  AI_UPSTASH_REDIS_REST_TOKEN: "synthetic-redis-only-token",
  AI_EXPECTED_REDIS_HOST: "assistant-only.upstash.io", AI_REDIS_ISOLATED: "true",
  AI_RATE_LIMIT_KEY_SECRET: "synthetic-owner-rate-secret-over-thirty-two-characters",
};
function request({ authorization = `Basic ${Buffer.from(`owner:${password}`).toString("base64")}`, origin = "https://monetcore.dev", path = "/api/assistant", caseId = "case-01", index = 1 } = {}) {
  return new Request(origin + path, {
    method: "POST",
    headers: { authorization, origin, "content-type": "application/json", "x-monetcore-test-case": caseId, "x-vercel-forwarded-for": `192.0.2.${index}` },
    body: JSON.stringify({ messages: ["SYNTHETIC_PRIVATE_QUESTION: What does Starter cost?"] }),
  });
}
test("production-domain owner controls (all provider and Redis operations mocked)", async (t) => {
  const saved = { ...process.env }, originalFetch = global.fetch, originalInfo = console.info, originalError = console.error;
  let calls = [], used = 0, stop = false, offline = false, uncertain = false, providerFailure = false;
  const logs = [];
  function reset() {
    for (const k of Object.keys(process.env)) delete process.env[k];
    Object.assign(process.env, saved, env);
    calls = []; used = 0; stop = false; offline = false; uncertain = false; providerFailure = false;
  }
  console.info = (...args) => logs.push(args);
  console.error = (...args) => logs.push(args);
  global.fetch = async (url, options) => {
    calls.push(url);
    if (url === env.AI_UPSTASH_REDIS_REST_URL) {
      if (offline) throw new Error("synthetic offline");
      const cmd = JSON.parse(options.body);
      if (cmd[0] === "ZREM") return Response.json({ result: 1 });
      assert.equal(cmd[0], "EVAL");
      if (cmd[1] === stagingRunCheckScript) return Response.json({ result: stop ? 0 : 1 });
      assert.equal(cmd[1], admissionScript);
      assert.equal(cmd[2], "10");
      assert.equal(cmd[11], "monetcore:assistant:v1:preview:test-run:binding");
      assert.equal(cmd[12], `monetcore:assistant:v1:preview:test-run:${runId}:admitted`);
      assert.equal(cmd.at(-1), runId);
      if (stop) return Response.json({ result: 0 });
      if (used >= 20) return Response.json({ result: 4 });
      used++;
      if (uncertain) { uncertain = false; throw new Error("synthetic lost response"); }
      return Response.json({ result: 1 });
    }
    if (url === "https://api.openai.com/v1/responses/input_tokens") return Response.json({ object: "response.input_tokens", input_tokens: 2500 });
    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(options.headers.Authorization, `Bearer ${env.OPENAI_API_KEY}`);
    assert.ok(!JSON.stringify(options).includes(password));
    if (providerFailure) throw new Error("synthetic timeout");
    return Response.json({ status: "completed", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify({ topics: ["package-starter"] }) }] }], usage: { input_tokens: 2500, output_tokens: 100 } });
  };
  try {
    await t.test("every activation flag absent or false disables inference before network", async () => {
      for (const flag of ["AI_ASSISTANT_ENABLED", "AI_OWNER_TEST_ENABLED"]) for (const value of [undefined, "false", "TRUE"]) {
        reset(); if (value === undefined) delete process.env[flag]; else process.env[flag] = value;
        assert.equal(configuration(), null);
        assert.equal((await POST(request())).status, 503);
        assert.equal(calls.length, 0);
      }
      reset(); process.env.VERCEL_ENV = "development";
      assert.equal(configuration(), null);
      reset(); process.env.VERCEL_ENV = "preview"; delete process.env.STAGING_AI_ASSISTANT_ENABLED;
      assert.equal(configuration(), null);
    });
    await t.test("missing, malformed and incorrect authentication never reaches Redis or OpenAI", async () => {
      reset();
      for (const authorization of ["", "Bearer fake", "Basic !", `Basic ${Buffer.from("owner:wrong").toString("base64")}`, `Basic ${Buffer.from(`visitor:${password}`).toString("base64")}`]) {
        const response = await POST(request({ authorization }));
        assert.equal(response.status, 401);
        assert.match(response.headers.get("www-authenticate"), /Monetcore owner/);
        assert.match(response.headers.get("cache-control"), /no-store/);
      }
      assert.equal(calls.length, 0);
    });
    await t.test("only exact production domain and approved branch permitted", async () => {
      reset();
      for (const origin of ["http://monetcore.dev", "https://www.monetcore.dev", "https://fake.vercel.app", "https://monetcore.dev.evil.invalid"]) assert.equal((await POST(request({ origin }))).status, 403);
      for (const branch of ["main", "feature/monetcore-stage1-websites-other", ""]) {
        process.env.VERCEL_GIT_COMMIT_REF = branch;
        assert.equal((await POST(request())).status, 503);
      }
      assert.equal(calls.length, 0);
    });
    await t.test("missing credentials, permanent run ID, isolation and pricing fail closed", async () => {
      for (const key of ["OPENAI_API_KEY", "OPENAI_MODEL", "AI_OWNER_PASSWORD_SHA256", "AI_PRICING_APPROVAL", "AI_MAX_CALL_COST_MICRO_USD", "STAGING_AI_TEST_RUN_ID", "AI_UPSTASH_REDIS_REST_URL", "AI_UPSTASH_REDIS_REST_TOKEN", "AI_RATE_LIMIT_KEY_SECRET", "AI_EXPECTED_REDIS_HOST", "AI_REDIS_ISOLATED"]) {
        reset(); delete process.env[key];
        assert.equal((await POST(request())).status, 503, key);
        assert.equal(calls.length, 0, key);
      }
      reset(); process.env.AI_UPSTASH_REDIS_REST_URL = "https://unapproved-booking.upstash.io";
      assert.equal((await POST(request())).status, 503);
      assert.equal(calls.length, 0);
      reset(); process.env.AI_MAX_CALL_COST_MICRO_USD = "2079";
      assert.equal((await POST(request())).status, 503);
      assert.equal(calls.length, 0);
    });
    await t.test("old shared Redis configuration is never used as a fallback", async () => {
      reset(); delete process.env.AI_UPSTASH_REDIS_REST_URL;
      process.env.UPSTASH_REDIS_REST_URL = "https://booking-do-not-use.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "must-not-use";
      assert.equal((await POST(request())).status, 503);
      assert.equal(calls.length, 0);
      reset();
      process.env.UPSTASH_REDIS_REST_URL = env.AI_UPSTASH_REDIS_REST_URL;
      assert.equal((await POST(request())).status, 503);
      assert.equal(calls.length, 0);
    });
    await t.test("Proxy protects page and API; unrelated routes excluded by matcher", async () => {
      reset();
      assert.deepEqual(proxyConfig.matcher, ["/assistant/:path*", "/api/assistant/:path*"]);
      for (const path of ["/assistant", "/api/assistant"]) {
        assert.equal(proxy(request({ path, authorization: "" })).status, 401);
        const allowed = proxy(request({ path }));
        assert.equal(allowed.headers.get("x-middleware-next"), "1");
        assert.match(allowed.headers.get("cache-control"), /no-store/);
        assert.match(allowed.headers.get("x-robots-tag"), /noindex/);
      }
      assert.equal(calls.length, 0);
    });
    await t.test("case IDs still mandatory, approved answers and sanitized metrics work", async () => {
      reset(); assert.equal((await POST(request({ caseId: "" }))).status, 400);
      assert.equal(used, 0);
      const r = await POST(request()); assert.equal(r.status, 200);
      assert.match(JSON.stringify(await r.json()), /₦99,000/);
      assert.equal(used, 1);
      assert.ok(logs.some((l) => l[0] === "Monetcore AI staging measurement" && l[1].error_category === "success"));
      assert.doesNotMatch(JSON.stringify(logs), /SYNTHETIC_PRIVATE|synthetic-owner|synthetic-redis|192\.0\.2|Authorization/);
    });
    await t.test("production shares permanent Preview run; failures consume all 20 admissions", async () => {
      reset(); providerFailure = true;
      for (let i = 0; i < 20; i++) assert.equal((await POST(request({ index: i + 1 }))).status, 503);
      assert.equal(used, 20);
      const paid = calls.filter((u) => u.includes("openai.com")).length;
      assert.equal((await POST(request({ index: 21 }))).status, 429);
      assert.equal(calls.filter((u) => u.includes("openai.com")).length, paid);
      // Switching environment cannot select new permanent state or another allowance.
      process.env.VERCEL_ENV = "preview"; process.env.STAGING_AI_ASSISTANT_ENABLED = "true";
      assert.equal((await POST(request())).status, 429);
      assert.equal(used, 20);
    });
    await t.test("Redis outages, uncertain admission and emergency stop block provider requests", async () => {
      reset(); offline = true;
      assert.equal((await POST(request())).status, 503);
      reset(); stop = true;
      assert.equal((await POST(request())).status, 503); assert.equal(used, 0);
      reset(); uncertain = true;
      assert.equal((await POST(request())).status, 503); assert.equal(used, 1);
      assert.equal(calls.filter((u) => u.includes("openai.com")).length, 0);
    });
    await t.test("Preview cannot enable production and missing Vercel attestation blocks access", async () => {
      reset(); delete process.env.AI_ASSISTANT_ENABLED; process.env.STAGING_AI_ASSISTANT_ENABLED = "true";
      assert.equal((await POST(request())).status, 503);
      reset(); delete process.env.VERCEL;
      assert.equal(ownerTestAccess(request()).status, 503);
      assert.equal(calls.length, 0);
    });
  } finally {
    global.fetch = originalFetch; console.info = originalInfo; console.error = originalError;
    for (const k of Object.keys(process.env)) delete process.env[k]; Object.assign(process.env, saved);
  }
});
