import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      company,
      service,
      budget,
      message,
      website,
      startedAt,
    } = body;

    // Honeypot: real users won't fill this hidden field.
    // If a bot fills it, pretend the request succeeded.
    if (website) {
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    // Reject submissions completed unrealistically fast.
    const submittedAt = Date.now();
    const formStartedAt = Number(startedAt);

    if (
      !formStartedAt ||
      Number.isNaN(formStartedAt) ||
      submittedAt - formStartedAt < 3000
    ) {
      return NextResponse.json(
        { error: "Invalid form submission." },
        { status: 400 }
      );
    }

    // Required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        {
          error:
            "Name, email, and project details are required.",
        },
        { status: 400 }
      );
    }

    // Basic type validation
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid form data." },
        { status: 400 }
      );
    }

    // Optional field type validation
    if (
      (company && typeof company !== "string") ||
      (service && typeof service !== "string") ||
      (budget && typeof budget !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid form data." },
        { status: 400 }
      );
    }

    // Length limits
    if (
      name.length > 100 ||
      email.length > 200 ||
      message.length > 5000 ||
      (company && company.length > 150) ||
      (service && service.length > 100) ||
      (budget && budget.length > 100)
    ) {
      return NextResponse.json(
        { error: "Form submission is too long." },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Make sure server-side email credentials exist
    if (
      !process.env.MONETCORE_EMAIL ||
      !process.env.MONETCORE_EMAIL_PASSWORD
    ) {
      console.error(
        "Missing Monetcore email environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Email service is temporarily unavailable.",
        },
        { status: 500 }
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

Project Details:
${message}
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Your enquiry has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to send your enquiry. Please try again.",
      },
      { status: 500 }
    );
  }
}