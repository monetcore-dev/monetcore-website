import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  customerEnabled,
  customerOrigin,
  CustomerError,
  validateCustomerOrigin,
} from "./config";
import { customerRateLimit } from "./rateLimit";
import { requireCustomerSession } from "./session";
export async function customerPagePrincipal() {
  if (!customerEnabled()) return null;
  try {
    const incoming = new Headers(await headers());
    const request = new Request(customerOrigin + "/customer", {
      headers: incoming,
    });
    validateCustomerOrigin(request);
    await customerRateLimit(request, "read");
    return await requireCustomerSession(incoming);
  } catch (error) {
    if (error instanceof CustomerError && [401, 403].includes(error.status))
      redirect("/customer/login");
    return null;
  }
}
