import {
  readSubmission,
  enforceRateLimit,
  validateSubmission,
} from "@/app/lib/submissionSafety";
import {
  isReviewPreview,
  isStagingContactEnabled,
  previewFormMessage,
} from "@/app/lib/previewSafety";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  getWebsitePackage,
  packagePrice,
  packageRenewal,
} from "@/app/config/websitePackages";

export async function POST(request: Request) {
  const staging = isStagingContactEnabled();
  if (isReviewPreview() && !staging) {
    return NextResponse.json({ error: previewFormMessage }, { status: 403 });
  }
  try {
    const limited = await enforceRateLimit(request, staging ? "staging:contact" : "contact", 10, 600_000, staging);
    if (limited) return limited;
    const body = await readSubmission(request);
    if (body instanceof Response) return body;
    if (body.website && typeof body.website === "string")
      return NextResponse.json({ success: true });
    const invalid = validateSubmission(body, "contact");
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    body.name = (body.name as string).trim();
    body.email = (body.email as string).trim();
    body.message = (body.message as string).trim();
    const {
      name,
      email,
      company,
      service,
      budget,
      message,
      packageId,
      consent,
    } = body as {
      name: string;
      email: string;
      company?: string;
      service?: string;
      budget?: string;
      message: string;
      packageId?: unknown;
      consent?: unknown;
    };

    const selectedPackage = getWebsitePackage(packageId);
    if (packageId !== undefined && (!selectedPackage || consent !== true)) {
      return NextResponse.json(
        { error: "Choose a valid website package and consent to a response." },
        { status: 400 },
      );
    }

    // Staging may use only the explicitly approved mailbox, never a submitted recipient.
    if (staging && process.env.MONETCORE_EMAIL !== "hello@monetcore.dev") {
      return NextResponse.json(
        {
          error:
            "Staging email is not configured. Please contact the site administrator.",
        },
        { status: 503 },
      );
    }

    // Make sure server-side email credentials exist
    if (!process.env.MONETCORE_EMAIL || !process.env.MONETCORE_EMAIL_PASSWORD) {
      console.error("Missing Monetcore email environment variables.");

      return NextResponse.json(
        {
          error: "Email service is temporarily unavailable.",
        },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      host: "mail.privateemail.com",
      port: 465,
      secure: true,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: {
        user: process.env.MONETCORE_EMAIL,
        pass: process.env.MONETCORE_EMAIL_PASSWORD,
      },
    });

    const delivery = await transporter.sendMail({
      from: `"Monetcore Website" <${process.env.MONETCORE_EMAIL}>`,
      to: staging ? "hello@monetcore.dev" : process.env.MONETCORE_EMAIL,
      replyTo: email,
      subject: `${staging ? "[STAGING TEST] " : ""}New Monetcore Project Enquiry — ${name}`,
      text: `
New project enquiry from monetcore.dev

Name: ${name}
Email: ${email}
Company: ${company || "Not provided"}
Service: ${service || "Not specified"}
Budget: ${budget || "Not specified"}
${
  selectedPackage
    ? `Website Package: ${selectedPackage.name}
Package Price: ${packagePrice(selectedPackage)}
Annual Renewal: ${packageRenewal(selectedPackage)} after 12 months
Final scope is confirmed in a written quotation. Optional integrations and third-party usage separately quoted.
Consent to quotation response: yes`
    : ""
}

Project Details:
${message}
      `,
    });

    if (
      staging &&
      (!Array.isArray(delivery?.accepted) ||
        !delivery.accepted.some(
          (address) =>
            typeof address === "string" &&
            address.toLowerCase() === "hello@monetcore.dev",
        ) ||
        (Array.isArray(delivery.rejected) && delivery.rejected.length > 0))
    ) {
      throw new Error("SMTP did not confirm staging acceptance");
    }

    return NextResponse.json({
      success: true,
      message: "Your enquiry has been sent successfully.",
    });
  } catch {
    console.error("Contact form error:");

    return NextResponse.json(
      {
        error: "Unable to send your enquiry. Please try again.",
      },
      { status: 500 },
    );
  }
}
