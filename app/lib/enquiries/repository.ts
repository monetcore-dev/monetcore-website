import "server-only";
import { enquiryPool } from "./database";
export type EnquiryInput = { kind: "contact" | "quotation"; name: string; email: string; company: string; service: string; budget: string; message: string; package_id: string | null; package_summary: string | null };
export type Enquiry = { id: string; payload: EnquiryInput; notification_state: "pending" | "started" | "accepted" | "uncertain" | "failed"; attempts: number };
/** All limits are durable fixed windows; every valid request/replay consumes admission. */
export async function saveEnquiry(key: string, hash: string, ip: string, payload: EnquiryInput): Promise<Enquiry> {
  const client = await enquiryPool().connect(); let broken = false;
  try {
    await client.query("BEGIN");
    // One fixed global lock order (global counter -> IP counter -> UUID -> payload).
    for (const [bucket, seconds, limit] of [["global", 3600, 100], ["ip:" + ip, 600, 10]] as const) {
      const result = await client.query<{ count: number }>(`INSERT INTO monetcore_enquiries.rate_windows(bucket,window_start,expires_at,count)
        VALUES ($1,to_timestamp(floor(extract(epoch FROM clock_timestamp())/$2)*$2),
          to_timestamp((floor(extract(epoch FROM clock_timestamp())/$2)+1)*$2),1)
        ON CONFLICT(bucket,window_start) DO UPDATE SET count=monetcore_enquiries.rate_windows.count+1 RETURNING count`, [bucket, seconds]);
      const count = result.rows[0]?.count;
      if (!Number.isSafeInteger(count) || count < 1) throw Error("Rate counter unavailable");
      if (count > limit) throw Object.assign(Error("Rate limit"), { code: "ENQUIRY_RATE_LIMIT" });
    }
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", ["request:" + key]);
    const existing = await client.query<Enquiry & { request_hash: string }>(`SELECT e.*, k.request_hash FROM monetcore_enquiries.request_keys k
      JOIN monetcore_enquiries.enquiries e ON e.id=k.enquiry_id WHERE k.idempotency_key=$1::uuid`, [key]);
    if (existing.rows[0]) {
      if (existing.rows[0].request_hash !== hash) throw Object.assign(Error("Identity conflict"), { code: "ENQUIRY_CONFLICT" });
      await client.query("COMMIT"); return existing.rows[0];
    }
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", ["payload:" + hash]);
    const duplicate = await client.query<Enquiry>(`SELECT * FROM monetcore_enquiries.enquiries
      WHERE request_hash=$1 AND created_at >= clock_timestamp()-interval '10 minutes' ORDER BY created_at DESC LIMIT 1`, [hash]);
    const row = duplicate.rows[0] ?? (await client.query<Enquiry>(`INSERT INTO monetcore_enquiries.enquiries(request_hash,payload)
      VALUES($1,$2::jsonb) RETURNING *`, [hash, JSON.stringify(payload)])).rows[0];
    if (!row) throw Error("Enquiry receipt unavailable");
    await client.query("INSERT INTO monetcore_enquiries.request_keys(idempotency_key,request_hash,enquiry_id) VALUES($1::uuid,$2,$3::uuid)", [key, hash, row.id]);
    await client.query("COMMIT"); return row;
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch { broken = true; }
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (!["ENQUIRY_RATE_LIMIT", "ENQUIRY_CONFLICT"].includes(code)) broken = true;
    throw error; // No automatic write retries after an uncertain COMMIT.
  } finally { client.release(broken); }
}
export async function claimNotification(id?: string): Promise<Enquiry | null> {
  const result = await enquiryPool().query<Enquiry>(`WITH candidate AS (
    SELECT id FROM monetcore_enquiries.enquiries WHERE notification_state='pending' AND attempts<5
      AND next_attempt_at <= clock_timestamp() AND ($1::uuid IS NULL OR id=$1::uuid)
      ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1)
    UPDATE monetcore_enquiries.enquiries e SET notification_state='started',attempts=attempts+1,
      started_at=clock_timestamp(),updated_at=clock_timestamp() FROM candidate c WHERE e.id=c.id RETURNING e.*`, [id ?? null]);
  return result.rows[0] ?? null;
}
export async function finishNotification(id: string, state: "accepted" | "pending" | "uncertain", category: string) {
  const result = await enquiryPool().query(`UPDATE monetcore_enquiries.enquiries SET
    notification_state=CASE WHEN $2='pending' AND attempts>=5 THEN 'failed' ELSE $2 END,
    last_error_category=$3,next_attempt_at=clock_timestamp()+interval '1 minute'*power(2,attempts),
    accepted_at=CASE WHEN $2='accepted' THEN clock_timestamp() ELSE accepted_at END,updated_at=clock_timestamp()
    WHERE id=$1::uuid AND notification_state='started'`, [id,state,category]);
  if (result.rowCount !== 1) throw Error("Notification receipt unavailable");
}
export async function maintainEnquiryQueue() {
  await enquiryPool().query(`UPDATE monetcore_enquiries.enquiries SET notification_state='uncertain',last_error_category='interrupted',
    updated_at=clock_timestamp() WHERE notification_state='started' AND started_at<clock_timestamp()-interval '2 minutes'`);
  await enquiryPool().query("DELETE FROM monetcore_enquiries.rate_windows WHERE expires_at < clock_timestamp()-interval '1 hour'");
}

export async function notificationProblems() {
  const result = await enquiryPool().query<{notification_state:string; count:number}>(`SELECT notification_state,count(*)::integer AS count
    FROM monetcore_enquiries.enquiries WHERE notification_state IN ('uncertain','failed') GROUP BY notification_state`);
  return result.rows;
}
