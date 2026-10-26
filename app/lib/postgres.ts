
import "server-only";
import { Pool } from "pg";
import { assertBookingIntegrationsAllowed } from "./stagingBooking";

let pool: Pool | undefined;

export function getPostgresPool(): Pool {
  // Check before returning a cached pool: disabling staging must stop DB helpers too.
  if (process.env.VERCEL || process.env.VERCEL_ENV) throw new Error("VPS database unavailable on Vercel");
  assertBookingIntegrationsAllowed();
  if (pool) {
    return pool;
  }

  const password = process.env.MONETCORE_DB_PASSWORD;

  if (!password) {
    throw new Error("Missing MONETCORE_DB_PASSWORD");
  }

  pool = new Pool({
    host: "127.0.0.1",
    port: 5432,
    database: "monetcore_db",
    user: "monetcore_app",
    password,
    max: 5,
    statement_timeout: 5000,
    query_timeout: 7000,
    application_name: "monetcore-bookings",
    options: "-c timezone=UTC -c search_path=pg_catalog,public",
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on("error", () => console.error("PostgreSQL idle connection unavailable."));
  return pool;
}
