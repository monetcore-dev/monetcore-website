import "server-only";
import { Pool, type PoolConfig } from "pg";
import { createHash } from "node:crypto";
import { assertBookingIntegrationsAllowed } from "./stagingBooking";
import { isReviewPreview } from "./previewSafety";
let pool: Pool | undefined;
let identity: string | undefined;
/** A service-role API key is NOT a PostgreSQL password/connection string. */
export function postgresConfiguration(): PoolConfig {
    assertBookingIntegrationsAllowed();
    const remote = process.env.BOOKING_DATABASE_URL;
    if (remote) {
        // The existing VPS-review isolation contract is local-only. Never redirect it.
        if (isReviewPreview())
            throw new Error("Remote review database not approved");
        const url = new URL(remote);
        const host = process.env.BOOKING_DATABASE_EXPECTED_HOST;
        const user = process.env.BOOKING_DATABASE_EXPECTED_USER;
        if (!host || !user || !["postgres:", "postgresql:"].includes(url.protocol) ||
            url.hostname !== host || decodeURIComponent(url.username) !== user ||
            !url.password || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".") ||
            /^[0-9.]+$/.test(host) || /localhost|\.local$/.test(host) ||
            ["postgres", "supabase_admin", "supabase_auth_admin"].includes(user.split(".")[0]) ||
            url.search || url.hash || !["", "5432", "6543"].includes(url.port) ||
            !/^\/[a-zA-Z0-9_-]+$/.test(url.pathname))
            throw new Error("Remote database configuration invalid");
        const ca = process.env.BOOKING_DATABASE_CA_PEM;
        if (ca && !ca.includes("-----BEGIN CERTIFICATE-----"))
            throw new Error("Database CA invalid");
        return {
            connectionString: remote,
            // No URI sslmode override or rejectUnauthorized:false is accepted.
            ssl: { rejectUnauthorized: true, servername: host, ...(ca ? { ca: ca.replace(/\\n/g, "\n") } : {}) },
            max: 1, connectionTimeoutMillis: 5000, query_timeout: 7000,
            idleTimeoutMillis: 10000, allowExitOnIdle: true,
            application_name: "monetcore-bookings",
        };
    }
    if (process.env.VERCEL || process.env.VERCEL_ENV)
        throw new Error("Remote booking database not configured");
    const password = process.env.MONETCORE_DB_PASSWORD;
    if (!password)
        throw new Error("Missing MONETCORE_DB_PASSWORD");
    return { host: "127.0.0.1", port: 5432, database: "monetcore_db", user: "monetcore_app", password,
        max: 5, statement_timeout: 5000, query_timeout: 7000, application_name: "monetcore-bookings",
        options: "-c timezone=UTC -c search_path=pg_catalog,public", idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 };
}
export function getPostgresPool(): Pool {
    const config = postgresConfiguration(); // Validate guards even for a cached pool.
    const next = createHash("sha256").update(JSON.stringify(config)).digest("hex");
    if (pool && next !== identity)
        throw new Error("Database configuration changed; restart required");
    if (!pool) {
        identity = next;
        pool = new Pool(config);
        pool.on("error", () => console.error("PostgreSQL idle connection unavailable."));
    }
    return pool;
}
