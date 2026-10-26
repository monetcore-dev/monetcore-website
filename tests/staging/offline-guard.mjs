// Preparation tests are deliberately unable to open any network sockets.
import net from "node:net";
import tls from "node:tls";
import { syncBuiltinESMExports } from "node:module";
const blocked = () => {
  throw new Error("Staging preparation is offline-only.");
};
net.connect = blocked;
net.createConnection = blocked;
net.Socket.prototype.connect = blocked;
tls.connect = blocked;
globalThis.fetch = async () => blocked();
syncBuiltinESMExports();
for (const key of [
  "MONETCORE_DB_PASSWORD",
  "MONETCORE_STAGING",
  "MONETCORE_VPS_REVIEW",
  "GOOGLE_CALENDAR_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RATE_LIMIT_KEY_SECRET",
  "RATE_LIMIT_REQUIRED",
  "VERCEL",
])
  delete process.env[key];
process.env.VERCEL_ENV = "development";
process.env.MONETCORE_EMAIL = "sink@example.invalid";
process.env.MONETCORE_EMAIL_PASSWORD = "offline-mock-only";
