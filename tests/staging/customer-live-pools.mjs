// Test-only transport: actual PostgreSQL over a fixed disposable Unix socket.
import { Pool } from "pg";
import { assertCustomerEnabled } from "../../app/lib/customer/config.ts";
const common = {
  host: "/tmp/monetcore-customer-pg-socket",
  database: "monetcore_customer_staging",
  max: 5,
};
export const authPool = new Pool({
  ...common,
  user: "monetcore_customer_auth",
  options: "-c search_path=pg_catalog,customer_auth",
});
export const appPool = new Pool({
  ...common,
  user: "monetcore_customer_runtime",
  options: "-c search_path=pg_catalog,customer",
});
export function getCustomerAuthPool() {
  assertCustomerEnabled();
  return authPool;
}
export function getCustomerPool() {
  assertCustomerEnabled();
  return appPool;
}
