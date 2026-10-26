
import "server-only";
import { Pool } from "pg";

let pool: Pool | undefined;

export function getPostgresPool(): Pool {
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
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}
