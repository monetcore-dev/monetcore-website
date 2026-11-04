import "server-only";
import { createHmac } from "node:crypto";
import { enquiryClientAddress } from "./access";
import { saveEnquiry, type EnquiryInput } from "./repository";
import { readSubmission, validateSubmission } from "../submissionSafety";
import { getWebsitePackage, packagePrice, packageRenewal } from "../../config/websitePackages";
function reply(body: Record<string,unknown>, status: number) { return Response.json(body,{status,headers:{"Cache-Control":"no-store"}}); }
export async function submitDurableEnquiry(request: Request) {
  let key = "", attempted = false;
  try {
    let address: string;
    try { address = enquiryClientAddress(request); } catch { return reply({error:"Invalid submission origin.",outcome:"not_created"},403); }
    const secret = process.env.MONETCORE_ENQUIRY_RATE_SECRET;
    if (!secret || secret.length < 32) return reply({error:"Enquiries are temporarily unavailable. Please use WhatsApp or email.",outcome:"not_created"},503);
    // Reuse bounded JSON reader after trusted production-origin validation. Its direct URL check
    // expects a public URL; adapt only this already-attested Request, never shared booking behavior.
    const canonical = new Request("https://monetcore.dev/api/contact", request);
    const body = await readSubmission(canonical);
    if (body instanceof Response) return reply({...(await body.json()),outcome:"not_created"},body.status);
    if (body.website) return reply({error:"Unable to accept this enquiry.",outcome:"not_created"},400);
    const invalid = validateSubmission(body,"contact");
    if (invalid) return reply({error:invalid,outcome:"not_created"},400);
    key = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(key)) return reply({error:"Reload the form before submitting.",outcome:"not_created"},400);
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (phone && !/^[+0-9() .-]{5,50}$/.test(phone)) return reply({error:"Please enter a valid phone number.",outcome:"not_created"},400);
    const selected = getWebsitePackage(body.packageId);
    if (body.packageId !== undefined && (!selected || body.consent !== true)) return reply({error:"Choose a valid package and consent to a response.",outcome:"not_created"},400);
    const text = (name: string) => typeof body[name] === "string" ? body[name].trim() : "";
    const payload: EnquiryInput = {kind:selected?"quotation":"contact",name:text("name"),email:text("email").toLowerCase(),...(phone ? {phone} : {}),company:text("company"),service:text("service"),budget:text("budget"),message:text("message"),package_id:selected?.id ?? null,
      package_summary:selected?`${selected.name}: ${packagePrice(selected)}; annual renewal ${packageRenewal(selected)}. Written scope required. Consent to response: yes.`:null};
    const digest = (purpose: string,value: string) => createHmac("sha256",secret).update(purpose+":"+value).digest("hex");
    attempted = true;
    const row = await saveEnquiry(key,digest("payload",JSON.stringify(payload)),digest("ip",address),payload);
    return reply({success:true,outcome:"received",requestReference:key,enquiryReference:row.id,
      message:"Your enquiry has been securely received. Our team will review it. This is not a quotation or appointment confirmation."},202);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENQUIRY_RATE_LIMIT") return Response.json({error:"Too many enquiries. Please wait or contact us on WhatsApp.",outcome:"not_created"},{status:429,headers:{"Cache-Control":"no-store","Retry-After":"3600"}});
    if (code === "ENQUIRY_CONFLICT") return reply({error:"This request reference cannot be reused. Contact hello@monetcore.dev.",outcome:"unknown",requestReference:key},409);
    console.error("Enquiry persistence unavailable.");
    return reply({error:attempted?"We could not verify receipt. Do not resubmit; contact hello@monetcore.dev with your reference.":"Enquiries are temporarily unavailable. Please use WhatsApp or email.",
      outcome:attempted?"unknown":"not_created",...(key?{requestReference:key}:{})},503);
  }
}
