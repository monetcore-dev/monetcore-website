import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { configuration, admit } from "../app/lib/assistant/controls.ts";
import { pricingPolicy, pricingApprovalId } from "../app/lib/assistant/pricing.ts";
const password = "synthetic-local-lock-password-more-than-thirty-two-characters";
const env = { VERCEL: "1", VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main",
  AI_ASSISTANT_ENABLED: "true", AI_OWNER_TEST_ENABLED: "true", AI_ASSISTANT_EMERGENCY_STOP: "false",
  AI_OWNER_PASSWORD_SHA256: createHash("sha256").update(password).digest("hex"),
  OPENAI_API_KEY: "synthetic-local-key", OPENAI_MODEL: pricingPolicy.model, AI_PRICING_APPROVAL: pricingApprovalId };
const request = (id = randomUUID(), signal) => new Request("https://monetcore.dev/api/assistant", {
  headers: { authorization: `Basic ${Buffer.from(`owner:${password}`).toString("base64")}`, "x-monetcore-request-id": id }, signal });
test("best-effort local controls explicitly do not provide shared Redis guarantees", async (t) => {
  const saved = { ...process.env }, now = Date.now;
  let clock = 1900000000000;
  Date.now = () => clock;
  Object.assign(process.env, env);
  try {
    await t.test("one process admits only one concurrent request", async () => {
      const c = configuration();
      const results = await Promise.all(Array.from({ length: 30 }, (_, i) => admit(c, request(), `payload-${i}`)));
      assert.equal(results.filter(r => r.allowed).length, 1);
      assert.equal(results.filter(r => !r.allowed && r.status === 429).length, 29);
      results.find(r => r.allowed).release();
    });
    await t.test("cooldown and duplicate request IDs/content survive release and errors in this process", () => {
      clock += 61000; const c = configuration(), id = randomUUID();
      const first = admit(c, request(id), "same-payload"); assert.equal(first.allowed, true); first.release();
      assert.equal(admit(c, request(), "different-payload").status, 429);
      clock += 6000;
      assert.equal(admit(c, request(id), "changed-payload").status, 409);
      assert.equal(admit(c, request(), "same-payload").status, 409);
      clock += 61000; const later = admit(c, request(id), "same-payload"); assert.equal(later.allowed, true); later.release();
    });
    await t.test("emergency stop and client abort block a provider checkpoint", () => {
      clock += 61000; const c = configuration(); const first = admit(c, request(), "stop");
      process.env.AI_ASSISTANT_EMERGENCY_STOP = "true"; assert.throws(() => first.check()); first.release();
      process.env.AI_ASSISTANT_EMERGENCY_STOP = "false";
      clock += 61000; const controller = new AbortController(); const next = admit(c, request(randomUUID(), controller.signal), "abort");
      controller.abort(); assert.throws(() => next.check()); next.release();
      clock += 61000; assert.throws(() => admit(c, request(randomUUID(), controller.signal), "already-aborted"));
    });
    await t.test("there is no misleading permanent 20-request allowance", () => {
      for (let i = 0; i < 25; i++) {
        clock += 61000; const admitted = admit(configuration(), request(), `synthetic-${i}`);
        assert.equal(admitted.allowed, true); admitted.release();
      }
    });
    await t.test("a second process has independent state even while the first is busy", () => {
      clock += 61000; const held = admit(configuration(), request(), "process-a"); assert.equal(held.allowed, true);
      try {
        const code = `import { configuration, admit } from './app/lib/assistant/controls.ts';
          const r = admit(configuration(), new Request('https://monetcore.dev/api/assistant', {headers:{'x-monetcore-request-id':'44444444-4444-4444-8444-444444444444'}}), 'process-b');
          if (!r.allowed) process.exit(1); r.release();`;
        const result = spawnSync(process.execPath, ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--import", "./tests/register.mjs", "--input-type=module", "-e", code], { cwd: process.cwd(), env: { ...process.env, ...env }, encoding: "utf8" });
        assert.equal(result.status, 0, "Independent instance must be documented as having independent state");
      } finally { held.release(); }
    });
  } finally {
    Date.now = now;
    for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env, saved);
  }
});
