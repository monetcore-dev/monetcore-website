/** Explicit production launch mode: public pages, no unverified integrations. */
export function isPublicLaunch() {
  return process.env.MONETCORE_PUBLIC_LAUNCH === "true";
}
export function publicLaunchUnavailable() {
  return Response.json({ error: "Online submissions are not available yet. Email hello@monetcore.dev or contact us on WhatsApp at +234 706 588 0558.", outcome: "not_created" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
