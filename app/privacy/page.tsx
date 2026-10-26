import Link from "next/link";
import SiteHeader from "../components/SiteHeader";
import { pageMetadata } from "../lib/metadata";

export const metadata = pageMetadata(
  "/privacy",
  "Privacy Policy",
  "How Monetcore System Solutions handles website enquiries, consultation information, analytics, browser storage and privacy requests.",
);

const sections = [
  {
    id: "information",
    title: "Information we collect",
    paragraphs: [
      "Contact and quotation forms collect your name, email address and project message. You may also provide your company, service interests and estimated budget. Website quotations include your package selection and permission to respond to the request.",
      "Consultation forms collect your name, email address, consultation type and appointment date and time. You may also provide your phone or WhatsApp number, company, service interests and discussion details.",
      "Technical information associated with website requests may be processed by hosting and security services. The application uses address-derived identifiers, request counts and expiry information for rate limiting. These identifiers should not be treated as anonymous information.",
      "Please do not send passwords, payment credentials, identity documents or unnecessary sensitive personal information through enquiry forms. Only provide another person's information if you are entitled to do so.",
    ],
  },
  {
    id: "purposes",
    title: "How and why we use information",
    paragraphs: [
      "We use information to respond to enquiries, prepare quotations, arrange consultations, provide requested services, maintain relevant business records and protect the website against abuse. Vercel Web Analytics is temporarily disabled for this release.",
      "Depending on the purpose and circumstances, processing may be necessary to take steps at your request before a contract, perform a contract, meet applicable legal obligations or pursue legitimate interests such as website security and responding to business enquiries, subject to your rights. Where consent is relied on, it must relate to a specific purpose and may be withdrawn.",
      "Enquiry contacts are not automatically subscribed to promotional communications. Promotional marketing requires separate, voluntary opt-in consent and an unsubscribe mechanism. Permission to respond to a quotation is not marketing consent.",
    ],
  },
  {
    id: "processing",
    title: "Enquiries, consultations and technology demonstrations",
    paragraphs: [
      "Contact and quotation submissions are emailed to our configured business mailbox using Namecheap Private Email. The website contact handler does not itself insert these enquiries into the booking database. Your email address is used so we can reply.",
      "The consultation booking implementation stores reservation information in a PostgreSQL database and uses Google Calendar for appointment information. Calendar entries can contain contact and project details. Booking acknowledgements and administrator notifications are sent by email. A reservation can remain stored when a Calendar or notification operation fails.",
      "The homepage AI Core is a visual representation of our capabilities. Local interactive demonstrations use simulations; they do not themselves send real messages, create bookings, move money or submit your form information to a live AI model. The separately linked external demonstration has its own data-handling context; use fictional details there.",
      "Data processing for a separately agreed software or AI automation engagement may require additional project-specific notices and contractual terms. This website policy does not replace those arrangements.",
    ],
  },
  {
    id: "ai-assistant",
    title: "Monetcore AI Assistant",
    paragraphs: [
      "The Monetcore AI Assistant is prepared with live inference disabled by default. Initial live testing is restricted to authenticated owner access without a shared request allowance or application spending cap; it is not public AI availability. When separately activated, your question and a limited recent history of your questions are sent to OpenAI to classify the information you need. The website then selects approved Monetcore answers and enquiry links; it does not use the assistant to send emails, create appointments, change business records or take external actions.",
      "Conversation history is held in page memory, not stored as a transcript in the application database or automatically emailed to our team. Leaving or reloading the page clears that local history. Please do not submit personal, sensitive or confidential information. Clearing the page does not delete information already processed by a provider.",
      "When activated, OpenAI processes submitted text and associated technical information. Requests ask the provider not to store Responses API response objects; this is not a guarantee of zero retention. Provider security logs, retention, processing locations and applicable terms require verification before activation. We do not claim verified international-transfer safeguards or completed legal compliance for this proposed processing.",
      "The assistant does not use Redis or an application database for usage controls. Short-lived request identifiers, keyed question digests and an in-flight lock are held only in the current server process to reduce duplicates and concurrent calls. These controls reset on process restart and do not coordinate across instances or enforce global spending limits. Application operational logs exclude chat text and API credentials. Contact hello@monetcore.dev or use our enquiry form if you prefer human assistance.",
    ],
  },
  {
    id: "providers",
    title: "Service providers and external services",
    paragraphs: [
      "This VPS website implementation uses Namecheap hosting, Namecheap Private Email for email delivery, PostgreSQL for booking records, Google Calendar for appointments and Upstash Redis where shared rate limiting is configured. Providers receive information relevant to the features involved and may process associated technical metadata.",
      "Google Maps is provided as an external link rather than an embedded map. Opening it, using WhatsApp or following social and external demonstration links takes you to another service whose privacy practices also apply.",
      "Information may also need to be disclosed where required by applicable law or for establishing, exercising or defending legal claims.",
    ],
  },
  {
    id: "analytics-storage",
    title: "Analytics, cookies and browser storage",
    paragraphs: [
      "Vercel Web Analytics is temporarily disabled: the website does not load its analytics script or send Web Analytics events. The integration is retained for possible future use following privacy verification and approval. This does not make the website tracking-free or cookie-free: hosting, security and external services may still process technical information or use cookies and similar technologies.",
      "The Smart Project Planner stores selected goals, challenges, budget ranges and capabilities in browser session storage so they can remain available during the tab's session. Generated enquiry drafts and local demonstration changes are held in page memory rather than intentionally saved as personal enquiry text in that session-storage record.",
      "Browser settings can manage cookies and browser storage. Blocking storage or third-party requests may affect some functionality. External services opened through links have their own cookie and storage practices.",
    ],
  },
  {
    id: "retention",
    title: "How long information is retained",
    paragraphs: [
      "General enquiries that do not become projects are retained for 12 months after the last communication. Consultation booking records are retained for 12 months after the appointment.",
      "Longer retention is permitted only where justified by applicable legal, contractual or financial requirements. Information connected to an ongoing project may need to be retained for the relevant engagement and applicable obligations.",
      "Monetcore System Solutions is responsible for handling privacy requests and carrying out manual retention reviews and deletion across relevant email, database and Calendar records. The website does not implement an automated deletion schedule for these records. Copies in provider backups may follow separate retention cycles. You can contact us about the information and retention arrangements relevant to you.",
    ],
  },
  {
    id: "international",
    title: "International processing",
    paragraphs: [
      "Our service providers may process information outside Nigeria. Applicable locations depend on the provider, account configuration and service involved. Provider data-processing and international-transfer arrangements remain under review and have not been confirmed as approved or completed. International transfers are subject to the requirements of the Nigeria Data Protection Act 2023.",
      "Please contact us for information about processing locations and the arrangements relevant to your enquiry or engagement.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "The implementation includes server-side input validation, encrypted SMTP connections, server-only integration credentials, request protections and rate limiting. Security also depends on provider settings and operational access controls. No website or communication system can guarantee absolute security.",
    ],
  },
  {
    id: "rights",
    title: "Your privacy rights",
    paragraphs: [
      "Subject to applicable legal conditions, you may request information about processing, access to your personal information, correction, erasure, restriction or portability, and object to relevant processing. Where consent is the basis, you may withdraw it without affecting processing that was lawful before withdrawal.",
      "You may also raise concerns about qualifying solely automated decisions with significant effects. The website's local simulations do not themselves make such decisions.",
      "Send privacy requests to hello@monetcore.dev with the subject Privacy Request. We may need proportionate information to verify your identity and locate the relevant records. Applicable legal requirements or other protected rights may limit a request. Please do not send identity documents unless an appropriate verification method has been agreed.",
      "You may raise a complaint with the Nigeria Data Protection Commission (NDPC) if you believe your personal information has been handled unlawfully.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "We may update this policy when our services, processing or legal requirements change. You can contact our privacy address for clarification about this policy or the handling of your information.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="corporate-page min-h-screen bg-slate-50 px-5 pb-20 pt-32 text-slate-950 sm:px-8"
      >
        <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold text-blue-800">
            Monetcore System Solutions
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-6 leading-8 text-slate-700">
            This policy explains how Monetcore System Solutions handles personal
            information through monetcore.dev, business enquiries and
            consultation arrangements.
          </p>
          <address className="mt-5 space-y-2 not-italic leading-7 text-slate-700">
            <p>Ventures Park, 5 Kwaji Close, Maitama, Abuja, Nigeria.</p>
            <p>
              Privacy requests:{" "}
              <a
                className="font-semibold text-blue-800 underline underline-offset-4"
                href="mailto:hello@monetcore.dev?subject=Privacy%20Request"
              >
                hello@monetcore.dev
              </a>
            </p>
          </address>
          <nav
            aria-label="Privacy policy contents"
            className="mt-8 rounded-2xl bg-blue-50 p-5"
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <Link
                    className="text-sm font-semibold text-blue-800 underline underline-offset-4"
                    href={`#${section.id}`}
                  >
                    {section.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="mt-10 scroll-mt-28 border-t border-slate-200 pt-8"
            >
              <h2 className="text-2xl font-bold tracking-tight">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 leading-8 text-slate-700">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>
      </main>
    </>
  );
}
