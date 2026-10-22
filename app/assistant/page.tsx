import SiteHeader from "../components/SiteHeader";
import { pageMetadata } from "../lib/metadata";
import AssistantChat from "./AssistantChat";
import { isReviewPreview } from "../lib/previewSafety";
export const dynamic = "force-dynamic";
export const metadata = {
  ...pageMetadata(
    "/assistant",
    "Monetcore AI Assistant",
    "Explore approved Monetcore company, services, product status and website package information with our AI-assisted information guide.",
  ),
  robots: { index: false, follow: false },
};
export default function AssistantPage() {
  return (
    <>
      <SiteHeader />
      <main
        id="main-content"
        className="corporate-page min-h-screen bg-slate-50 px-5 pb-20 pt-32 text-slate-950 sm:px-8"
      >
        <div className="mx-auto max-w-3xl">
          <p className="font-semibold text-blue-800">
            Monetcore System Solutions
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Monetcore AI Assistant
          </h1>
          <p className="mt-5 leading-7">
            An AI-assisted guide to our company, services, products and website
            packages.
          </p>
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-7">
            <p>
              Live AI is disabled by default. Initial production-domain testing
              is restricted to the owner. Direct API testing has no shared request
              allowance or spending cap. When
              separately enabled, OpenAI interprets your questions and selects
              answers from approved Monetcore information. Questions and limited
              recent question history are sent to OpenAI. The assistant cannot
              confirm quotations or availability, make commitments, send
              messages or take actions.
            </p>
            <p className="mt-2">
              Use the enquiry links to discuss your requirements with our team.
              Please do not submit sensitive or confidential information.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3 font-semibold text-blue-900">
              <a className="underline underline-offset-4" href="/privacy">
                Privacy Policy
              </a>
              <a
                className="underline underline-offset-4"
                href="/contact#consultation"
              >
                Contact Monetcore
              </a>
              <a
                className="underline underline-offset-4"
                href="mailto:hello@monetcore.dev"
              >
                hello@monetcore.dev
              </a>
            </div>
          </div>
          <AssistantChat stagingTest={isReviewPreview() || process.env.VERCEL_ENV === "production"} />
        </div>
      </main>
    </>
  );
}
