import { createHash } from "node:crypto";

const MAX_BYTES = 32_768;
const buckets = new Map<string, { count: number; until: number }>();
/** Best-effort per-instance protection, not a replacement for a shared edge limit. */
export function rateLimit(
  request: Request,
  scope: string,
  limit = 10,
  windowMs = 600_000,
  now = Date.now(),
) {
  for (const [key, value] of buckets)
    if (value.until <= now) buckets.delete(key);
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const key = `${scope}:${createHash("sha256").update(address).digest("hex")}`;
  const bucket = buckets.get(key);
  if (bucket && bucket.count >= limit)
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((bucket.until - now) / 1000)),
        },
      },
    );
  if (!bucket && buckets.size >= 2000)
    return Response.json(
      { error: "Service is busy. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  buckets.set(key, {
    count: (bucket?.count ?? 0) + 1,
    until: bucket?.until ?? now + windowMs,
  });
  return null;
}
export async function readSubmission(
  request: Request,
): Promise<Record<string, unknown> | Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Invalid submission origin." },
      { status: 403 },
    );
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return Response.json({ error: "Use a JSON submission." }, { status: 415 });
  if (Number(request.headers.get("content-length")) > MAX_BYTES)
    return Response.json(
      { error: "Submission is too large." },
      { status: 413 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json(
      { error: "Invalid JSON submission." },
      { status: 400 },
    );
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) {
        await reader.cancel();
        return Response.json(
          { error: "Submission is too large." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error("Not an object");
    return body as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: "Invalid JSON submission." },
      { status: 400 },
    );
  } finally {
    reader.releaseLock();
  }
}
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
export const consultationTypes = [
  "Discovery Call - 30 minutes",
  "Technical Consultation - 45 minutes",
  "Business Automation Consultation - 45 minutes",
];
export function validateSubmission(
  body: Record<string, unknown>,
  kind: "contact" | "booking",
  now = Date.now(),
) {
  const limits: Record<string, number> = {
    name: 100,
    email: 200,
    company: 150,
    service: 150,
    budget: 100,
    message: kind === "booking" ? 3000 : 5000,
    phone: 50,
    website: 200,
    consultationType: 150,
    date: 10,
    time: 5,
  };
  for (const [key, max] of Object.entries(limits)) {
    const value = body[key];
    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== "string" || value.length > max)
    )
      return "Invalid or overlong form field.";
  }
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    /[\r\n\0]/.test(body.name)
  )
    return "Please enter a valid name.";
  if (
    typeof body.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  )
    return "Please provide a valid email address.";
  if (
    kind === "contact" &&
    (typeof body.message !== "string" || !body.message.trim())
  )
    return "Please add meaningful project details.";
  const started =
    typeof body.startedAt === "number" || typeof body.startedAt === "string"
      ? Number(body.startedAt)
      : NaN;
  if (
    !Number.isFinite(started) ||
    started <= 0 ||
    started > now ||
    now - started < (kind === "booking" ? 1500 : 3000)
  )
    return "Please wait a moment before submitting.";
  if (
    kind === "booking" &&
    (!consultationTypes.includes(String(body.consultationType)) ||
      typeof body.date !== "string" ||
      !isValidDate(body.date))
  )
    return "Choose a valid consultation and date.";
  return null;
}

/** Google Calendar descriptions support HTML; customer text must stay literal. */
export function escapeCalendarText(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
}
