import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import {
  pricingPolicy,
  minimumReservationMicroUsd,
  pricingApprovalId,
} from "./pricing";
export function configuration() {
  const enabled =
    process.env.VERCEL_ENV === "preview"
      ? process.env.STAGING_AI_ASSISTANT_ENABLED === "true" &&
        process.env.VERCEL_GIT_COMMIT_REF ===
          "feature/monetcore-stage1-websites"
      : process.env.VERCEL_ENV === "production" &&
        process.env.AI_ASSISTANT_ENABLED === "true";
  if (!enabled) return null;
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const secret = process.env.RATE_LIMIT_KEY_SECRET;
  const cost = Number(process.env.AI_MAX_CALL_COST_MICRO_USD);
  const stagingRunId =
    process.env.VERCEL_ENV === "preview"
      ? process.env.STAGING_AI_TEST_RUN_ID
      : undefined;
  if (
    (process.env.VERCEL_ENV === "preview" &&
      (!stagingRunId ||
        !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
          stagingRunId,
        ))) ||
    !key ||
    model !== pricingPolicy.model ||
    process.env.AI_PRICING_APPROVAL !== pricingApprovalId ||
    !url ||
    !token ||
    !secret ||
    secret.length < 32 ||
    !Number.isSafeInteger(cost) ||
    cost < minimumReservationMicroUsd ||
    cost > 1000000
  )
    throw new Error("Configuration");
  const endpoint = new URL(url);
  if (
    endpoint.protocol !== "https:" ||
    !endpoint.hostname.endsWith(".upstash.io") ||
    endpoint.port ||
    endpoint.pathname !== "/" ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.username ||
    endpoint.password
  )
    throw new Error("Configuration");
  return { key, model, url, token, secret, cost, stagingRunId };
}
export type Config = NonNullable<ReturnType<typeof configuration>>;
// One atomic admission: emergency stop, visitor limits, global allowances, cost,
// and expiring concurrency leases. Failed/uncertain calls are never refunded.
export const admissionScript = `
if redis.call('GET',KEYS[1]) ~= 'enabled' then return 0 end
local runCount=nil
if ARGV[10] ~= '' then
 if #KEYS ~= 10 or redis.call('GET',KEYS[9]) ~= ARGV[10] or redis.call('PTTL',KEYS[9]) ~= -1 or redis.call('PTTL',KEYS[10]) ~= -1 then return 3 end
 local raw=redis.call('GET',KEYS[10])
 if not raw or not string.match(raw,'^%d+$') then return 3 end
 runCount=tonumber(raw)
 if not runCount or runCount<0 or runCount>20 or tostring(runCount)~=raw then return 3 end
 if runCount>=20 then return 4 end
end
local now=tonumber(ARGV[1])
redis.call('ZREMRANGEBYSCORE',KEYS[8],'-inf',now)
if tonumber(redis.call('GET',KEYS[2]) or '0')>=5 or tonumber(redis.call('GET',KEYS[3]) or '0')>=30 or tonumber(redis.call('GET',KEYS[4]) or '0')>=100 or tonumber(redis.call('GET',KEYS[5]) or '0')>=1000 or tonumber(redis.call('GET',KEYS[6]) or '0')+tonumber(ARGV[3])>1000000 or tonumber(redis.call('GET',KEYS[7]) or '0')+tonumber(ARGV[3])>10000000 or redis.call('ZCARD',KEYS[8])>=3 then return 2 end
if runCount then redis.call('INCRBY',KEYS[10],1) end
for i=2,7 do
 local amount=1
 if i>=6 then amount=tonumber(ARGV[3]) end
 redis.call('INCRBY',KEYS[i],amount)
 redis.call('EXPIRE',KEYS[i],tonumber(ARGV[i+2]))
end
redis.call('ZADD',KEYS[8],now+60000,ARGV[2])
redis.call('EXPIRE',KEYS[8],120)
return 1`;
/** Recheck the same non-expiring state before counting and before inference.
 * No initialization, expiry refresh, decrement or reset path exists here.
 */
export const stagingRunCheckScript = `
if redis.call('GET',KEYS[1]) ~= 'enabled' then return 0 end
if redis.call('GET',KEYS[2]) ~= ARGV[1] or redis.call('PTTL',KEYS[2]) ~= -1 or redis.call('PTTL',KEYS[3]) ~= -1 then return 0 end
local raw=redis.call('GET',KEYS[3])
if not raw or not string.match(raw,'^%d+$') then return 0 end
local n=tonumber(raw)
if not n or n<1 or n>20 or tostring(n)~=raw then return 0 end
return 1`;
async function redis(c: Config, command: unknown[]) {
  const r = await fetch(c.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${c.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(2000),
  });
  if (!r.ok) throw new Error("Controls");
  const data = await r.json();
  if (!data || typeof data !== "object" || data.error || !("result" in data))
    throw new Error("Controls");
  return data.result;
}
export async function reserve(c: Config, request: Request) {
  // Vercel overwrites this header; activation is restricted to Vercel environments.
  if (process.env.VERCEL !== "1") throw new Error("Configuration");
  const address = request.headers
    .get("x-vercel-forwarded-for")
    ?.split(",")[0]
    .trim();
  if (!address) throw new Error("Controls");
  const hash = createHmac("sha256", c.secret).update(address).digest("hex");
  const now = Date.now(),
    date = new Date(now),
    day = date.toISOString().slice(0, 10),
    month = day.slice(0, 7),
    minute = Math.floor(now / 60000);
  const prefix = `monetcore:assistant:v1:${process.env.VERCEL_ENV}:`;
  const lease = randomUUID();
  const keys = [
    `${prefix}control`,
    `${prefix}visitor:${hash}:${minute}`,
    `${prefix}visitor:${hash}:${day}`,
    `${prefix}calls:${day}`,
    `${prefix}calls:${month}`,
    `${prefix}cost:${day}`,
    `${prefix}cost:${month}`,
    `${prefix}leases`,
  ];
  if (c.stagingRunId)
    keys.push(
      `${prefix}test-run:binding`,
      `${prefix}test-run:${c.stagingRunId}:admitted`,
    );
  const result = await redis(c, [
    "EVAL",
    admissionScript,
    String(keys.length),
    ...keys,
    String(now),
    lease,
    String(c.cost),
    "120",
    "172800",
    "172800",
    "5356800",
    "172800",
    "5356800",
    c.stagingRunId ?? "",
  ]);
  if (![0, 1, 2, 3, 4].includes(result)) throw new Error("Controls");
  return {
    result,
    async release() {
      await redis(c, ["ZREM", keys[7], lease]);
    },
    async check() {
      if (c.stagingRunId) {
        if (
          (await redis(c, [
            "EVAL",
            stagingRunCheckScript,
            "3",
            keys[0],
            keys[8],
            keys[9],
            c.stagingRunId,
          ])) !== 1
        )
          throw new Error("Stopped");
      } else if ((await redis(c, ["GET", keys[0]])) !== "enabled") {
        throw new Error("Stopped");
      }
    },
  };
}
