import "server-only";
import { isIP } from "node:net";
/** Separate from booking/AI: enabling contacts never removes public-launch guards. */
export function contactFormsEnabled() {
  return process.env.NODE_ENV === "production" && process.env.MONETCORE_PUBLIC_LAUNCH === "true" &&
    process.env.MONETCORE_CONTACT_ENABLED === "true" && process.env.MONETCORE_CONTACT_PROXY_VERIFIED === "true" &&
    !process.env.MONETCORE_STAGING && !process.env.MONETCORE_VPS_REVIEW &&
    !process.env.VERCEL && !process.env.VERCEL_ENV;
}
/** Only after owner verifies loopback-only ingress and Nginx overwrites these headers. */
export function enquiryClientAddress(request: Request) {
  if (!contactFormsEnabled()) throw Error("Unavailable");
  const url = new URL(request.url);
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (request.headers.get("origin") !== "https://monetcore.dev" || host !== "monetcore.dev" ||
      request.headers.get("x-forwarded-proto") !== "https" ||
      (forwardedHost !== null && forwardedHost !== "monetcore.dev") ||
      !(url.origin === "https://monetcore.dev" ||
        (["127.0.0.1", "localhost", "monetcore.dev"].includes(url.hostname) && ["http:", "https:"].includes(url.protocol)))) throw Error("Origin");
  const ip = request.headers.get("x-real-ip") ?? "";
  if (!isIP(ip)) throw Error("Client address");
  return ip;
}
