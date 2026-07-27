import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { logOrder, type LoggedOrderLineItem } from "@/lib/order-logger";

// Webhooks need the raw body for signature verification.
export const runtime = "nodejs";

function getStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function extractProductId(
  lineItem: Stripe.LineItem,
): string | undefined {
  const price = lineItem.price;
  if (!price || typeof price === "string") return undefined;

  const product = price.product;
  if (product && typeof product !== "string" && !("deleted" in product && product.deleted)) {
    const productId = product.metadata?.productId;
    if (productId) return productId;
  }

  return price.metadata?.productId || undefined;
}

function toLineItem(lineItem: Stripe.LineItem): LoggedOrderLineItem {
  const price = lineItem.price && typeof lineItem.price !== "string" ? lineItem.price : null;
  const product =
    price?.product &&
    typeof price.product !== "string" &&
    !("deleted" in price.product && price.product.deleted)
      ? price.product
      : null;

  return {
    productId: extractProductId(lineItem),
    name:
      lineItem.description ||
      product?.name ||
      price?.nickname ||
      "Item",
    quantity: lineItem.quantity ?? 1,
    unitAmount: price?.unit_amount ?? null,
    lineAmount: lineItem.amount_total ?? null,
  };
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing stripe-signature header or STRIPE_WEBHOOK_SECRET" },
      { status: 400 },
    );
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const sessionObject = event.data.object as Stripe.Checkout.Session;
  const sessionId = sessionObject.id;
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  const email =
    getStringOrNull(session.customer_details?.email) ||
    getStringOrNull(session.customer_email);

  const shippingName =
    getStringOrNull(session.collected_information?.shipping_details?.name) ||
    getStringOrNull(session.customer_details?.name);
  const shippingPhone = getStringOrNull(session.customer_details?.phone);

  const lineItems = session.line_items?.data ?? [];

  logOrder({
    orderId: session.id,
    createdAt: new Date().toISOString(),
    eventType: event.type,
    status: session.status ?? null,
    paymentStatus: session.payment_status ?? null,
    email,
    currency: session.currency ?? null,
    amountTotal: session.amount_total ?? null,
    source: session.metadata?.source ?? null,
    fulfillment: session.metadata?.fulfillment ?? null,
    shippingName,
    shippingPhone,
    shippingAddress:
      session.collected_information?.shipping_details?.address ?? null,
    lineItems: lineItems.map(toLineItem),
  });

  return NextResponse.json({ received: true });
}
