import "server-only";
import nodemailer from "nodemailer";
import { claimNotification, finishNotification, maintainEnquiryQueue, notificationProblems } from "./repository";
const mailbox = "hello@monetcore.dev";
export async function processEnquiryNotification(id?: string) {
  // Missing credentials never claim/consume the pending operation.
  if (process.env.MONETCORE_EMAIL !== mailbox || !process.env.MONETCORE_EMAIL_PASSWORD) throw Error("Enquiry SMTP configuration unavailable");
  const row = await claimNotification(id);
  if (!row) return false;
  const transport = nodemailer.createTransport({ host: "mail.privateemail.com", port: 465, secure: true,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    disableFileAccess: true, disableUrlAccess: true, auth: { user: mailbox, pass: process.env.MONETCORE_EMAIL_PASSWORD } });
  let state: "accepted" | "pending" | "uncertain" = "uncertain", category = "smtp_uncertain";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const input = row.payload;
    const delivery = await Promise.race([transport.sendMail({
      from: `"Monetcore Website" <${mailbox}>`, to: mailbox, envelope: { from: mailbox, to: [mailbox] }, replyTo: input.email,
      messageId: `<monetcore.enquiry.${row.id}@monetcore.dev>`, subject: input.kind === "quotation" ? "New Monetcore Quotation Request" : "New Monetcore Project Enquiry",
      text: `Enquiry reference: ${row.id}\n\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || "Not provided"}\nCompany: ${input.company}\nService: ${input.service}\nBudget: ${input.budget}\n${input.package_summary ?? ""}\n\nProject details:\n${input.message}`,
    }), new Promise<never>((_,reject) => { timer = setTimeout(() => { transport.close(); reject(Error("SMTP deadline")); },45000); })]);
    const accepted = Array.isArray(delivery.accepted) && delivery.accepted.some(a => typeof a === "string" && a.toLowerCase() === mailbox);
    if (accepted && (!delivery.rejected || delivery.rejected.length === 0)) { state = "accepted"; category = "smtp_accepted"; }
    else if (!accepted && Array.isArray(delivery.rejected) && delivery.rejected.includes(mailbox)) { state = "pending"; category = "smtp_rejected"; }
  } catch (error) {
    // Only known pre-message failures are safe to retry. DATA/timeouts/crashes remain uncertain.
    const command = error && typeof error === "object" && "command" in error ? String(error.command) : "";
    if (["CONN", "EHLO", "HELO", "AUTH", "MAIL FROM", "RCPT TO"].includes(command)) { state = "pending"; category = "smtp_pre_message"; }
  } finally { if (timer) clearTimeout(timer); transport.close(); }
  // Failed receipt persistence leaves 'started'; stale attempts become uncertain, never blindly replayed.
  await finishNotification(row.id,state,category);
  return true;
}
export async function drainEnquiryQueue() {
  await maintainEnquiryQueue();
  for (let i=0;i<10;i++) if (!await processEnquiryNotification()) break;
  const problems = await notificationProblems();
  if (problems.some(row => row.count > 0)) {
    console.error("Enquiry notification reconciliation required.", problems);
    throw Error("Operator reconciliation required");
  }
}
