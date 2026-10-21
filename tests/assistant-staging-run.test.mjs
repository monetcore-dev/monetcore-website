import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/assistant/route.ts";
import {
  configuration,
  reserve,
  admissionScript,
  stagingRunCheckScript,
} from "../app/lib/assistant/controls.ts";
import {
  pricingPolicy,
  pricingApprovalId,
} from "../app/lib/assistant/pricing.ts";
import { reportMeasurement } from "../app/lib/assistant/measurements.ts";
const runId = "22222222-2222-4222-8222-222222222222";
const env = {
  VERCEL: "1",
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "feature/monetcore-stage1-websites",
  STAGING_AI_ASSISTANT_ENABLED: "true",
  STAGING_AI_TEST_RUN_ID: runId,
  OPENAI_API_KEY: "synthetic-only-key",
  OPENAI_MODEL: pricingPolicy.model,
  AI_PRICING_APPROVAL: pricingApprovalId,
  UPSTASH_REDIS_REST_URL: "https://test-only.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "synthetic-only-redis-token",
  RATE_LIMIT_KEY_SECRET: "synthetic-only-secret-over-thirty-two-characters",
  AI_MAX_CALL_COST_MICRO_USD: "10000",
};
function request(index = 1, id = "case-01") {
  return new Request("https://preview.example/api/assistant", {
    method: "POST",
    headers: {
      origin: "https://preview.example",
      "content-type": "application/json",
      "x-vercel-forwarded-for": `192.0.2.${index}`,
      "x-monetcore-test-case": id,
    },
    body: JSON.stringify({
      messages: ["SENSITIVE_SYNTHETIC_QUESTION: explain Smart Starter"],
    }),
  });
}
// A serialized in-memory model of Redis EVAL's command contract, not a Lua engine.
// No external service can be called: every URL is handled/checked in this fixture.
class MockServices {
  constructor() {
    this.used = 0;
    this.binding = runId;
    this.bindingTtl = -1;
    this.counterTtl = -1;
    this.control = "enabled";
    this.counters = new Map();
    this.leases = new Map();
    this.calls = [];
    this.providerCalls = 0;
    this.tokenCalls = 0;
    this.commands = [];
    this.mode = "success";
    this.redisOffline = false;
    this.uncertainAdmission = false;
    this.stopAfterCount = false;
    this.deleteAfterCount = false;
  }
  validState(expected, min = 0) {
    return (
      this.binding === expected &&
      this.bindingTtl === -1 &&
      this.counterTtl === -1 &&
      this.used !== null &&
      /^(0|[1-9]\d*)$/.test(String(this.used)) &&
      Number(this.used) >= min &&
      Number(this.used) <= 20
    );
  }
  async fetch(url, options) {
    this.calls.push(url);
    if (url === env.UPSTASH_REDIS_REST_URL) {
      if (this.redisOffline) throw new Error("Synthetic Redis unavailable");
      const command = JSON.parse(options.body);
      this.commands.push(command);
      let result;
      if (command[0] === "ZREM") {
        this.leases.delete(command[2]);
        result = 1;
      } else if (command[0] === "EVAL") {
        const n = Number(command[2]),
          keys = command.slice(3, 3 + n),
          args = command.slice(3 + n);
        if (command[1] === stagingRunCheckScript) {
          assert.equal(n, 3);
          result =
            this.control === "enabled" && this.validState(args[0], 1) ? 1 : 0;
        } else {
          assert.equal(command[1], admissionScript);
          assert.equal(n, 10);
          assert.equal(args.length, 10);
          assert.equal(
            keys[8],
            "monetcore:assistant:v1:preview:test-run:binding",
          );
          assert.equal(
            keys[9],
            `monetcore:assistant:v1:preview:test-run:${runId}:admitted`,
          );
          if (this.control !== "enabled") result = 0;
          else if (!this.validState(args[9])) result = 3;
          else if (Number(this.used) >= 20) result = 4;
          else {
            const now = Number(args[0]),
              cost = Number(args[2]);
            for (const [lease, until] of this.leases)
              if (until <= now) this.leases.delete(lease);
            const values = keys
              .slice(1, 7)
              .map((k) => this.counters.get(k) || 0);
            if (
              values[0] >= 5 ||
              values[1] >= 30 ||
              values[2] >= 100 ||
              values[3] >= 1000 ||
              values[4] + cost > 1000000 ||
              values[5] + cost > 10000000 ||
              this.leases.size >= 3
            )
              result = 2;
            else {
              this.used = Number(this.used) + 1;
              keys
                .slice(1, 7)
                .forEach((key, i) =>
                  this.counters.set(key, values[i] + (i >= 4 ? cost : 1)),
                );
              this.leases.set(args[1], now + 60000);
              result = 1;
              if (this.uncertainAdmission) {
                this.uncertainAdmission = false;
                throw new Error("Synthetic lost admission response");
              }
            }
          }
        }
      } else throw new Error("Unapproved mocked Redis command");
      return Response.json({ result });
    }
    if (url === "https://api.openai.com/v1/responses/input_tokens") {
      this.tokenCalls++;
      if (this.mode === "count_timeout")
        throw new DOMException("SENSITIVE_TIMEOUT", "TimeoutError");
      if (this.stopAfterCount) this.control = "stopped";
      if (this.deleteAfterCount) this.used = null;
      return Response.json({
        object: "response.input_tokens",
        input_tokens: this.mode === "count_excess" ? 4001 : 2500,
      });
    }
    assert.equal(url, "https://api.openai.com/v1/responses");
    this.providerCalls++;
    if (this.mode === "timeout")
      throw new DOMException("SENSITIVE_TIMEOUT", "TimeoutError");
    if (this.mode === "http_failure")
      return Response.json(
        { error: "SENSITIVE_PROVIDER_ERROR" },
        { status: 500 },
      );
    const data = {
      status: "completed",
      output: [
        {
          type: "message",
          role: "assistant",
          content: [
            {
              type: "output_text",
              text: JSON.stringify({ topics: ["package-starter"] }),
            },
          ],
        },
      ],
      usage: {
        input_tokens: this.mode === "usage_excess" ? 4001 : 2500,
        output_tokens: 100,
      },
      debug: "SENSITIVE_PROVIDER_DEBUG",
      secret: "synthetic-only-key",
    };
    if (this.mode === "malformed")
      data.output[0].content[0].text = "SENSITIVE_INVALID_JSON";
    if (this.mode === "missing_usage") delete data.usage;
    return Response.json(data);
  }
}
async function fixture(fn) {
  const saved = { ...process.env },
    fetch = global.fetch,
    info = console.info,
    error = console.error;
  const logs = [];
  const services = new MockServices();
  Object.assign(process.env, env);
  global.fetch = services.fetch.bind(services);
  console.info = (...v) => logs.push(v);
  console.error = (...v) => logs.push(v);
  try {
    await fn(services, logs);
  } finally {
    global.fetch = fetch;
    console.info = info;
    console.error = error;
    for (const key of Object.keys(env)) delete process.env[key];
    Object.assign(process.env, saved);
  }
}
test("staging test-run cap and sanitized metrics (all integrations mocked)", async (t) => {
  await t.test(
    "disabled by default and invalid run configuration make zero external requests",
    () =>
      fixture(async (s, logs) => {
        delete process.env.STAGING_AI_ASSISTANT_ENABLED;
        assert.equal((await POST(request())).status, 503);
        assert.equal(s.calls.length, 0);
        assert.deepEqual(logs, []);
        process.env.STAGING_AI_ASSISTANT_ENABLED = "true";
        for (const id of [
          "",
          "../reset",
          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        ]) {
          process.env.STAGING_AI_TEST_RUN_ID = id;
          assert.equal((await POST(request())).status, 503);
          assert.equal(s.calls.length, 0);
        }
      }),
  );
  await t.test(
    "missing, expiring, invalid or mismatched Redis state never creates a run",
    () =>
      fixture(async (s) => {
        const states = [
          { used: null },
          { binding: null },
          { binding: "different-run" },
          { counterTtl: 60000 },
          { bindingTtl: 60000 },
          { used: -1 },
          { used: 21 },
          { used: "00" },
          { used: "1.5" },
        ];
        for (const state of states) {
          Object.assign(
            s,
            { used: 0, binding: runId, counterTtl: -1, bindingTtl: -1 },
            state,
          );
          assert.equal((await POST(request())).status, 503);
          assert.equal(s.providerCalls, 0);
          assert.equal(s.tokenCalls, 0);
          for (const cmd of s.commands)
            assert.ok(!["SET", "DEL", "EXPIRE"].includes(cmd[0]));
        }
      }),
  );
  await t.test(
    "all 20 admitted attempts are spent even on failure; 21st cannot count or infer",
    () =>
      fixture(async (s) => {
        const modes = [
          "timeout",
          "count_timeout",
          "http_failure",
          "malformed",
          "count_excess",
        ];
        for (let i = 0; i < 20; i++) {
          s.mode = modes[i % 5];
          assert.ok([413, 503].includes((await POST(request(i + 1))).status));
          assert.equal(s.used, i + 1);
        }
        const calls = s.calls.length;
        const response = await POST(request(100));
        assert.equal(response.status, 429);
        assert.equal(response.headers.get("retry-after"), null);
        assert.equal(s.used, 20);
        assert.equal(s.calls.length, calls + 1);
        assert.equal(s.providerCalls, 12);
      }),
  );
  await t.test("concurrent admissions cannot cross 20", () =>
    fixture(async (s) => {
      s.used = 19;
      const c = configuration();
      const results = await Promise.all(
        Array.from({ length: 30 }, (_, i) => reserve(c, request(i + 1))),
      );
      assert.equal(results.filter((r) => r.result === 1).length, 1);
      assert.equal(results.filter((r) => r.result === 4).length, 29);
      assert.equal(s.used, 20);
      for (const r of results.filter((r) => r.result === 1)) await r.release();
      assert.equal(s.used, 20);
    }),
  );
  await t.test(
    "uncertain admission is consumed and unavailable Redis fails closed",
    () =>
      fixture(async (s) => {
        s.used = 19;
        s.uncertainAdmission = true;
        assert.equal((await POST(request())).status, 503);
        assert.equal(s.used, 20);
        assert.equal(s.tokenCalls, 0);
        assert.equal((await POST(request(2))).status, 429);
        s.redisOffline = true;
        assert.equal((await POST(request(3))).status, 503);
        assert.equal(s.used, 20);
        assert.equal(s.providerCalls, 0);
      }),
  );
  await t.test(
    "stop and deleted run state block counting/inference at both checkpoints",
    () =>
      fixture(async (s) => {
        s.control = "stopped";
        assert.equal((await POST(request())).status, 503);
        assert.equal(s.used, 0);
        assert.equal(s.tokenCalls, 0);
        s.control = "enabled";
        s.stopAfterCount = true;
        assert.equal((await POST(request(2))).status, 503);
        assert.equal(s.used, 1);
        assert.equal(s.providerCalls, 0);
        s.control = "enabled";
        s.stopAfterCount = false;
        s.deleteAfterCount = true;
        assert.equal((await POST(request(3))).status, 503);
        assert.equal(s.used, null);
        assert.equal(s.providerCalls, 0);
        assert.equal((await POST(request(4))).status, 503);
        assert.equal(s.used, null);
      }),
  );
  await t.test(
    "reporting failure never retries, refunds or bypasses quota",
    () =>
      fixture(async (s) => {
        console.info = () => {
          throw new Error("SENSITIVE_LOG_FAILURE");
        };
        for (let i = 0; i < 20; i++) {
          assert.equal((await POST(request(i + 1))).status, 200);
          assert.equal(s.used, i + 1);
        }
        assert.equal(s.providerCalls, 20);
        assert.equal((await POST(request(21))).status, 429);
        assert.equal(s.providerCalls, 20);
        assert.equal(s.used, 20);
      }),
  );
  await t.test(
    "metrics allowlist, token counts and integer cost contain no question or provider secrets",
    () =>
      fixture(async (s, logs) => {
        assert.equal((await POST(request(1, "case-07"))).status, 200);
        const record = logs.find(
          (l) => l[0] === "Monetcore AI staging measurement",
        )[1];
        assert.deepEqual(record, {
          synthetic_test_case_id: "case-07",
          selected_topic_ids: ["package-starter"],
          provider_input_tokens: 2500,
          provider_output_tokens: 100,
          estimated_generation_cost_micro_usd: 1160,
          error_category: "success",
        });
        assert.doesNotMatch(
          JSON.stringify(logs),
          /SENSITIVE|synthetic-only|192\.0\.2|Bearer|prompt|transcript/,
        );
        assert.equal(
          (await POST(request(2, "customer@example.invalid"))).status,
          400,
        );
        assert.equal(s.used, 1);
        assert.doesNotMatch(JSON.stringify(logs), /customer@example/);
        const count = logs.length;
        process.env.VERCEL_ENV = "production";
        reportMeasurement({
          caseId: "case-01",
          category: "success",
          topics: [],
          inputTokens: 1,
          outputTokens: 1,
        });
        assert.equal(logs.length, count);
      }),
  );
  await t.test(
    "unknown usage remains null; usage above approved limits is reported as failure",
    () =>
      fixture(async (s, logs) => {
        s.mode = "missing_usage";
        assert.equal((await POST(request())).status, 200);
        let record = logs.at(-1)[1];
        assert.equal(record.error_category, "usage_unavailable");
        assert.equal(record.estimated_generation_cost_micro_usd, null);
        s.mode = "usage_excess";
        assert.equal((await POST(request(2))).status, 503);
        record = logs.at(-1)[1];
        assert.equal(record.error_category, "usage_limit_mismatch");
        assert.equal(s.used, 2);
      }),
  );
  await t.test("UTC day/month rollover does not reset the run allowance", () =>
    fixture(async (s) => {
      const original = Date.now;
      try {
        s.used = 19;
        Date.now = () => Date.UTC(2026, 9, 31, 23, 59);
        const c = configuration();
        const r = await reserve(c, request());
        assert.equal(r.result, 1);
        await r.release();
        Date.now = () => Date.UTC(2026, 10, 1, 0, 1);
        assert.equal((await reserve(c, request(2))).result, 4);
        assert.equal(s.used, 20);
        assert.equal(s.counterTtl, -1);
        assert.equal(s.bindingTtl, -1);
      } finally {
        Date.now = original;
      }
    }),
  );
  await t.test(
    "existing spending and concurrency ceilings reject without incrementing run quota",
    () =>
      fixture(async (s) => {
        const now = new Date(),
          day = now.toISOString().slice(0, 10);
        s.counters.set(`monetcore:assistant:v1:preview:cost:${day}`, 1000000);
        assert.equal((await POST(request())).status, 429);
        assert.equal(s.used, 0);
        s.counters.clear();
        for (let i = 0; i < 3; i++) s.leases.set(String(i), Date.now() + 60000);
        assert.equal((await POST(request())).status, 429);
        assert.equal(s.used, 0);
        assert.equal(s.tokenCalls, 0);
      }),
  );
});
