import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import type { FulfillmentStatus, ReturnStatus } from "@/lib/db/schema";
import { sendShippingNotification } from "@/lib/email";
import {
  getOrderById,
  updateOrderFulfillment,
  updateOrderReturn,
} from "@/lib/orders";

const statuses = new Set<FulfillmentStatus>([
  "unfulfilled",
  "packed",
  "shipped",
  "delivered",
]);

const returnStatuses = new Set<ReturnStatus>([
  "none",
  "requested",
  "reviewing",
  "denied",
  "approved",
  "received",
  "closed",
]);

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "fulfillment");
  const fulfillmentStatus = String(form.get("fulfillmentStatus") ?? "");
  const trackingNumber = String(form.get("trackingNumber") ?? "").trim();
  const returnStatus = String(form.get("returnStatus") ?? "");
  const returnNotes = String(form.get("returnNotes") ?? "").trim();

  if (!statuses.has(fulfillmentStatus as FulfillmentStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!returnStatuses.has(returnStatus as ReturnStatus)) {
    return NextResponse.json({ error: "Invalid return status" }, { status: 400 });
  }

  const existing = await getOrderById(orderId);
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await Promise.all([
    updateOrderFulfillment(
      orderId,
      fulfillmentStatus as FulfillmentStatus,
      trackingNumber || null,
    ),
    updateOrderReturn(orderId, returnStatus as ReturnStatus, returnNotes || null),
  ]);

  const redirectUrl = new URL(`/admin/orders/${orderId}`, request.url);

  if (intent === "fulfillment") {
    const notify = await sendShippingNotification({
      to: existing.customer.email,
      customerName: existing.order.shippingName || existing.customer.name,
      orderId,
      trackingNumber,
      previousStatus: existing.order.fulfillmentStatus,
      previousTracking: existing.order.trackingNumber,
      fulfillmentStatus,
    });

    if (notify.status === "sent") {
      redirectUrl.searchParams.set("shippedEmail", "sent");
    } else if (notify.status === "error") {
      redirectUrl.searchParams.set("shippedEmail", "error");
    } else if (notify.reason === "missing_tracking" && fulfillmentStatus === "shipped") {
      redirectUrl.searchParams.set("shippedEmail", "needs_tracking");
    } else if (notify.reason === "unchanged") {
      redirectUrl.searchParams.set("shippedEmail", "unchanged");
    } else {
      redirectUrl.searchParams.set("shippedEmail", "saved");
    }
  } else {
    redirectUrl.searchParams.set("returnSaved", "1");
  }

  return NextResponse.redirect(redirectUrl, {
    status: 303,
  });
}
