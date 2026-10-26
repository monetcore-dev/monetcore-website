import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { ownerTestAccess, isControlledTestEnabled, assistantRequestOrigin } from "../app/lib/assistant/access.ts";
import { proxy, config } from "../proxy.ts";
const password = "synthetic-owner-password-longer-than-thirty-two-characters";
const authorization = `Basic ${Buffer.from(`owner:${password}`).toString("base64")}`;
const request = (url, value = authorization) => new Request(url, { headers: { authorization: value } });
test("owner authentication and disabled-default guards for direct Production and Preview", async (t) => {
  const saved = { ...process.env };
  function reset(mode = "production") {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, saved, { VERCEL: "1", VERCEL_ENV: mode,
      VERCEL_GIT_COMMIT_REF: mode === "production" ? "main" : "feature/monetcore-stage1-websites",
      AI_ASSISTANT_ENABLED: "true", STAGING_AI_ASSISTANT_ENABLED: "true", AI_OWNER_TEST_ENABLED: "true",
      AI_ASSISTANT_EMERGENCY_STOP: "false", AI_OWNER_PASSWORD_SHA256: createHash("sha256").update(password).digest("hex") });
  }
  try {
    await t.test("production permits only authenticated HTTPS corporate-domain owner", () => {
      reset(); assert.equal(ownerTestAccess(request("https://monetcore.dev/assistant")), null);
      for (const url of ["http://monetcore.dev/assistant", "https://www.monetcore.dev/assistant", "https://unapproved.vercel.app/assistant"])
        assert.equal(ownerTestAccess(request(url)).status, 403);
      for (const value of ["", "Basic !", "Bearer synthetic", `Basic ${Buffer.from("owner:short").toString("base64")}`])
        assert.equal(ownerTestAccess(request("https://monetcore.dev/assistant", value)).status, 401);
    });
    await t.test("trusted Vercel routing handles internal URLs without bypassing Basic authentication", () => {
      reset();
      for (const url of ["http://localhost:3000/assistant", "https://127.0.0.1:3000/assistant", "https://internal.vercel.app/assistant"]) {
        const headers = { host: "monetcore.dev", "x-forwarded-proto": "https", "x-forwarded-host": "monetcore.dev" };
        const r = new Request(url, { headers: { ...headers, authorization } });
        assert.equal(assistantRequestOrigin(r), "https://monetcore.dev");
        assert.equal(ownerTestAccess(r), null);
        assert.equal(proxy(r).headers.get("x-middleware-next"), "1");
        const denied = proxy(new Request(url, { headers }));
        assert.equal(denied.status, 401);
        assert.match(denied.headers.get("www-authenticate"), /Basic/);
      }
    });
    await t.test("spoofed/missing/mismatched routing metadata fails closed", () => {
      reset();
      const good = { host: "monetcore.dev", "x-forwarded-proto": "https" };
      for (const headers of [
        {}, { "x-forwarded-host": "monetcore.dev", "x-forwarded-proto": "https" },
        { ...good, host: "evil.example" }, { ...good, host: "www.monetcore.dev" },
        { ...good, host: "monetcore.dev:443" }, { ...good, host: "monetcore.dev.evil.example" },
        { ...good, host: "monetcore.dev, evil.example" },
        { ...good, "x-forwarded-host": "evil.example" },
        { ...good, "x-forwarded-host": "monetcore.dev, evil.example" },
        { host: "monetcore.dev" }, { ...good, "x-forwarded-proto": "http" },
        { ...good, "x-forwarded-proto": "https,http" },
        { forwarded: 'host=monetcore.dev;proto=https', "x-vercel-id": "spoofed" },
      ]) {
        const r = new Request("http://localhost:3000/assistant", { headers: { ...headers, authorization } });
        assert.equal(assistantRequestOrigin(r), null);
        assert.equal(ownerTestAccess(r).status, 403);
      }
      assert.equal(assistantRequestOrigin(new Request("https://monetcore.dev/assistant", { headers: { host: "evil.example" } })), null);
      delete process.env.VERCEL;
      assert.equal(assistantRequestOrigin(new Request("http://localhost:3000/assistant", { headers: good })), null);
      process.env.VERCEL = "1"; process.env.VERCEL_ENV = "preview";
      assert.equal(assistantRequestOrigin(new Request("http://localhost:3000/assistant", { headers: good })), null);
    });
    await t.test("Preview also requires owner authentication and exact development branch", () => {
      reset("preview"); assert.equal(ownerTestAccess(request("https://preview.example/assistant")), null);
      assert.equal(ownerTestAccess(request("https://preview.example/assistant", "")).status, 401);
      process.env.VERCEL_GIT_COMMIT_REF = "main"; assert.equal(isControlledTestEnabled(), false);
    });
    await t.test("each environment activation flag is independent and absence fails closed", () => {
      reset(); delete process.env.AI_ASSISTANT_ENABLED; assert.equal(isControlledTestEnabled(), false);
      reset("preview"); delete process.env.STAGING_AI_ASSISTANT_ENABLED; assert.equal(isControlledTestEnabled(), false);
      for (const key of ["AI_OWNER_TEST_ENABLED", "AI_ASSISTANT_EMERGENCY_STOP", "VERCEL"]) {
        reset(); delete process.env[key]; assert.equal(ownerTestAccess(request("https://monetcore.dev/assistant")).status, 503);
      }
      reset(); process.env.AI_OWNER_PASSWORD_SHA256 = "invalid";
      assert.equal(ownerTestAccess(request("https://monetcore.dev/assistant")).status, 503);
      reset(); process.env.VERCEL_GIT_COMMIT_REF = "unapproved-branch";
      assert.equal(isControlledTestEnabled(), false);
    });
    await t.test("Proxy scope excludes all booking/contact/homepage paths and disables caching", () => {
      reset(); assert.deepEqual(config.matcher, ["/assistant/:path*", "/api/assistant/:path*"]);
      const denied = proxy(request("https://monetcore.dev/assistant", ""));
      assert.equal(denied.status, 401); assert.match(denied.headers.get("cache-control"), /no-store/);
      assert.match(denied.headers.get("x-robots-tag"), /noindex/);
      assert.equal(proxy(request("https://monetcore.dev/assistant")).headers.get("x-middleware-next"), "1");
    });
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env, saved);
  }
});
