import "server-only";
import { Pool } from "pg";
import { assertCustomerEnabled } from "./config";
let authPool: Pool | undefined;
let appPool: Pool | undefined;
function createPool(kind: "auth" | "app") {
  const pool = new Pool({
    host: "127.0.0.1",
    port: 5432,
    database: "monetcore_customer_staging",
    user:
      kind === "auth"
        ? "monetcore_customer_auth"
        : "monetcore_customer_runtime",
    password:
      process.env[
        kind === "auth"
          ? "CUSTOMER_AUTH_DB_PASSWORD"
          : "CUSTOMER_APP_DB_PASSWORD"
      ],
    max: 3,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    statement_timeout: 5000,
    query_timeout: 7000,
    application_name: `monetcore-customer-${kind}`,
    options: `-c timezone=UTC -c search_path=pg_catalog,${kind === "auth" ? "customer_auth" : "customer"}`,
  });
  pool.on("error", () => console.error("Customer database unavailable."));
  return pool;
}
export function getCustomerAuthPool() {
  assertCustomerEnabled();
  return (authPool ??= createPool("auth"));
}
export function getCustomerPool() {
  assertCustomerEnabled();
  return (appPool ??= createPool("app"));
}
