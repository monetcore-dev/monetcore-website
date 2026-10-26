import "server-only";
import {
  CustomerError,
  assertCustomerEnabled,
  validateCustomerOrigin,
  customerResponseError,
} from "./config";
import { customerRateLimit } from "./rateLimit";
import { requireCustomerSession, type CustomerPrincipal } from "./session";
export async function readCustomerJson(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json")
    throw new CustomerError(400, "json_required");
  if (Number(request.headers.get("content-length")) > 16384 || !request.body)
    throw new CustomerError(400, "body_limit");
  const reader = request.body.getReader();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel();
  }, 5000);
  try {
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 16384) {
        await reader.cancel();
        throw new CustomerError(400, "body_limit");
      }
      chunks.push(value);
    }
    if (timedOut) throw new CustomerError(400, "body_timeout");
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new CustomerError(400, "invalid_json");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof CustomerError) throw error;
    throw new CustomerError(400, "invalid_json");
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
export async function customerApi(
  request: Request,
  mutation: boolean,
  work: (principal: CustomerPrincipal) => Promise<Response>,
) {
  try {
    assertCustomerEnabled();
    validateCustomerOrigin(request, mutation);
    await customerRateLimit(request, mutation ? "write" : "read");
    const principal = await requireCustomerSession(request.headers);
    const response = await work(principal);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return customerResponseError(error);
  }
}
