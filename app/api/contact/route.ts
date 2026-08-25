import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, company, service, budget, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and project details are required." },
        { status: 400 }
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
      { error: "Unable to send your enquiry. Please try again." },
      { status: 500 }
    );
  }
}