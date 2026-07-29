import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";
import type { FulfillmentStatus, ReturnStatus } from "@/lib/db/schema";
import { updateOrderFulfillment, updateOrderReturn } from "@/lib/orders";

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

  await Promise.all([
    updateOrderFulfillment(
      orderId,
      fulfillmentStatus as FulfillmentStatus,
      trackingNumber || null,
    ),
    updateOrderReturn(orderId, returnStatus as ReturnStatus, returnNotes || null),
  ]);

  return NextResponse.redirect(new URL(`/admin/orders/${orderId}`, request.url), {
    status: 303,
  });
}
