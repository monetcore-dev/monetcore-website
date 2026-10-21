import { NextResponse, type NextRequest } from "next/server";
import { ownerTestAccess } from "./app/lib/assistant/access";

export function proxy(request: NextRequest) {
  const denied = ownerTestAccess(request);
  if (denied) return denied;
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

// No interception of booking, contact, homepage or other product routes.
export const config = { matcher: ["/assistant/:path*", "/api/assistant/:path*"] };
