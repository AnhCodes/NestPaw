import { getSiteUrl } from "@/lib/site";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type ShippingNotificationResult =
  | { status: "sent" }
  | { status: "skipped"; reason: "not_shipped" | "missing_tracking" | "unchanged" | "missing_email" }
  | { status: "error"; message: string };

function trackingUrl(trackingNumber: string) {
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function shippingEmailHtml(input: {
  greeting: string;
  orderId: string;
  trackingNumber: string;
  trackLink: string;
  siteUrl: string;
}) {
  const { greeting, orderId, trackingNumber, trackLink, siteUrl } = input;
  const logoUrl = `${siteUrl}/marketing/nestpaw-wordmark-teal-email.png`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#e9e3e0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e9e3e0;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

<!-- Header -->
<tr><td style="padding:0 8px 20px;">
  <a href="${siteUrl}" style="text-decoration:none;">
    <img src="${logoUrl}" alt="NestPaw" width="160" height="31" style="display:block;border:0;outline:none;text-decoration:none;width:160px;height:31px;" />
  </a>
</td></tr>

<!-- Hero card -->
<tr><td style="background-color:#5a6866;border-radius:16px 16px 0 0;padding:36px 36px 32px;">
  <p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#bdab9c;">Order update</p>
  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-weight:600;color:#e9e3e0;">Your order is on its way &#128054;</h1>
</td></tr>

<!-- Body card -->
<tr><td style="background-color:#f7f3f1;border-radius:0 0 16px 16px;padding:36px;">
  <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#5a6866;">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#6b7876;">Your NestPaw order is on its way to you and your dog. We packed it with care, and we hope it makes home life feel a little softer once it arrives.</p>

  <!-- Order details -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e9e3e0;border-radius:12px;">
  <tr><td style="padding:22px 24px;">
    <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8a7a6e;">Order</p>
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#5a6866;word-break:break-all;">${escapeHtml(orderId)}</p>
    <p style="margin:0 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8a7a6e;">Tracking number</p>
    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#5a6866;">${escapeHtml(trackingNumber)}</p>
  </td></tr>
  </table>

  <!-- Track button -->
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
  <tr><td align="center" style="border-radius:999px;background-color:#5a6866;">
    <a href="${trackLink}" style="display:inline-block;padding:14px 36px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#e9e3e0;text-decoration:none;border-radius:999px;">Track your package</a>
  </td></tr>
  </table>

  <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#6b7876;text-align:center;">Most U.S. orders arrive in about 5 to 8 business days once shipped.</p>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 8px 0;text-align:center;">
  <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#6b7876;">Questions? Reply to this email or visit <a href="${siteUrl}/contact" style="color:#5a6866;font-weight:700;text-decoration:none;">our contact page</a>.</p>
  <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6b7876;">Thank you for trusting NestPaw. We're glad to be part of how you care for your dog.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
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
      ...(input.html ? { html: input.html } : {}),
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
    html: shippingEmailHtml({
      greeting,
      orderId: input.orderId,
      trackingNumber,
      trackLink,
      siteUrl,
    }),
    replyTo: process.env.CONTACT_TO_EMAIL?.trim() || undefined,
  });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return { status: "sent" };
}
