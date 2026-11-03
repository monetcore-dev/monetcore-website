import "server-only";
import { Pool } from "pg";
import { createHash } from "node:crypto";
import { contactFormsEnabled } from "./access";
let pool: Pool | undefined;
let identity: string | undefined;
export function enquiryPool() {
  if (!contactFormsEnabled() || !process.env.MONETCORE_ENQUIRY_DB_PASSWORD) throw Error("Enquiry database unavailable");
  const config = { host: "127.0.0.1", port: 5432, database: "monetcore_db", user: "monetcore_enquiries",
    password: process.env.MONETCORE_ENQUIRY_DB_PASSWORD, max: 3, connectionTimeoutMillis: 3000,
    statement_timeout: 5000, query_timeout: 7000, idleTimeoutMillis: 10000,
    application_name: "monetcore-enquiries", options: "-c timezone=UTC -c search_path=pg_catalog,monetcore_enquiries" };
  const next = createHash("sha256").update(JSON.stringify(config)).digest("hex");
  if (pool && next !== identity) throw Error("Enquiry configuration changed; restart required");
  if (!pool) { pool = new Pool(config); identity = next; pool.on("error", () => console.error("Enquiry database unavailable.")); }
  return pool;
}
export async function closeEnquiryPool() { if (pool) { await pool.end(); pool = undefined; identity = undefined; } }
