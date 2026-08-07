import { NextResponse } from "next/server";
import { submitStorefrontReturnRequest } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type ContactBody = {
  name?: string;
  email?: string;
  message?: string;
  company?: string;
  inquiryType?: "general" | "return-request";
  orderId?: string;
};

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit({
    key: `contact:${ip}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  // Resend's free test sender is case-sensitive about the recipient address.
  const to = process.env.CONTACT_TO_EMAIL?.trim().toLowerCase();
  const from =
    process.env.CONTACT_FROM_EMAIL || "NestPaw <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return NextResponse.json(
      {
        error:
          "Contact form is not configured. Add RESEND_API_KEY and CONTACT_TO_EMAIL to store/.env.local",
      },
      { status: 503 },
    );
  }

  let body: ContactBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.company) {
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();
  const inquiryType = body.inquiryType === "return-request" ? "return-request" : "general";
  const orderId = body.orderId?.trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (inquiryType === "return-request" && !orderId) {
    return NextResponse.json(
      { error: "Order number is required for a return request." },
      { status: 400 },
    );
  }

  if (inquiryType === "return-request") {
    const returnLimited = rateLimit({
      key: `contact-return:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!returnLimited.ok) {
      return NextResponse.json(
        { error: "Too many return requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(returnLimited.retryAfterSec) },
        },
      );
    }

    const result = await submitStorefrontReturnRequest({
      orderId: orderId!,
      name,
      email,
      message,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject:
          inquiryType === "return-request"
            ? `NestPaw return request from ${name}`
            : `NestPaw contact from ${name}`,
        text:
          inquiryType === "return-request"
            ? `Type: Return request\nOrder: ${orderId}\nName: ${name}\nEmail: ${email}\n\n${message}`
            : `Type: General contact\nName: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    });

    if (!res.ok) {
      console.error("[contact] Resend error", await res.text());
      return NextResponse.json(
        { error: "Unable to send your message. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json(
      { error: "Unable to send your message. Please try again later." },
      { status: 500 },
    );
  }
}
