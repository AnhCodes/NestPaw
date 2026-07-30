import { getSiteUrl } from "@/lib/site";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export type ShippingNotificationResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "not_shipped" | "missing_tracking" | "unchanged" | "missing_email" }
  | { status: "error"; message: string };

function trackingUrl(trackingNumber: string) {
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;
}

export async function sendResendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.CONTACT_FROM_EMAIL || "NestPaw <onboarding@resend.dev>";

  if (!apiKey) {
    return {
      ok: false as const,
      message: "RESEND_API_KEY is not configured.",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[email] Resend error", detail);
    return {
      ok: false as const,
      message: "Unable to send email through Resend.",
    };
  }

  return { ok: true as const };
}

export async function sendShippingNotification(input: {
  to: string;
  customerName?: string | null;
  orderId: string;
  trackingNumber: string;
  previousStatus?: string | null;
  previousTracking?: string | null;
  fulfillmentStatus: string;
}): Promise<ShippingNotificationResult> {
  if (input.fulfillmentStatus !== "shipped") {
    return { status: "skipped", reason: "not_shipped" };
  }

  const trackingNumber = input.trackingNumber.trim();
  if (!trackingNumber) {
    return { status: "skipped", reason: "missing_tracking" };
  }

  const email = input.to.trim().toLowerCase();
  if (!email) {
    return { status: "skipped", reason: "missing_email" };
  }

  const alreadyShipped = input.previousStatus === "shipped";
  const sameTracking =
    (input.previousTracking ?? "").trim() === trackingNumber;
  if (alreadyShipped && sameTracking) {
    return { status: "skipped", reason: "unchanged" };
  }

  const siteUrl = getSiteUrl();
  const trackLink = trackingUrl(trackingNumber);
  const greeting = input.customerName?.trim()
    ? `Hi ${input.customerName.trim()},`
    : "Hi,";

  const text = [
    greeting,
    "",
    "Your NestPaw order is on its way to you and your dog.",
    "We packed it with care, and we hope it makes home life feel a little softer once it arrives.",
    "",
    `Order: ${input.orderId}`,
    `Tracking number: ${trackingNumber}`,
    `Track your package: ${trackLink}`,
    "",
    "Most U.S. orders arrive in about 5 to 8 business days once shipped.",
    "You can use the link above anytime to see where your package is.",
    "",
    "If anything looks off, or you just have a question, reply to this email.",
    "We're here to help:",
    `${siteUrl}/contact`,
    "",
    "Thank you for trusting NestPaw.",
    "We're glad to be part of how you care for your dog.",
  ].join("\n");

  const result = await sendResendEmail({
    to: email,
    subject: "Your NestPaw order is on its way",
    text,
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return { status: "sent" };
}
