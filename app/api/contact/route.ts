import {
  readSubmission,
  rateLimit,
  validateSubmission,
} from "@/app/lib/submissionSafety";
import { isReviewPreview, previewFormMessage } from "@/app/lib/previewSafety";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  getWebsitePackage,
  packagePrice,
  packageRenewal,
} from "@/app/config/websitePackages";

export async function POST(request: Request) {
  if (isReviewPreview()) {
    return NextResponse.json({ error: previewFormMessage }, { status: 403 });
  }
  try {
    const limited = rateLimit(request, "contact");
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
      auth: {
        user: process.env.MONETCORE_EMAIL,
        pass: process.env.MONETCORE_EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Monetcore Website" <${process.env.MONETCORE_EMAIL}>`,
      to: process.env.MONETCORE_EMAIL,
      replyTo: email,
      subject: `New Monetcore Project Enquiry — ${name}`,
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
Proposed Price: ${packagePrice(selectedPackage)}
Proposed Annual Renewal: ${packageRenewal(selectedPackage)} after 12 months
Final business approval and quotation required. Optional integrations and third-party usage separately quoted.
Consent to quotation response: yes`
    : ""
}

Project Details:
${message}
      `,
    });

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
