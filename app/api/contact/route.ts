import { contactFormsEnabled } from "../../lib/enquiries/access";
import { submitDurableEnquiry } from "../../lib/enquiries/submit";

import { isPublicLaunch } from "../../lib/publicLaunch";
import { submitLegacyContact } from "./legacy";

export const runtime = "nodejs";

/** Contact and quotation share one durable endpoint and the existing outbox.
 * No direct SMTP path may report success without a committed enquiry.
 */
export async function POST(request: Request) {
  // Preserve existing isolated service-demonstration behavior outside production launch.
  if (!isPublicLaunch()) return submitLegacyContact(request);
  if (!contactFormsEnabled()) {
    return Response.json({ error: "Online enquiries are temporarily unavailable. Please email hello@monetcore.dev or contact us on WhatsApp.", outcome: "not_created" },
      { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return submitDurableEnquiry(request);
}
