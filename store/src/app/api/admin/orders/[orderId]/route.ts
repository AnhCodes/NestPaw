import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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
  updateOrderShippingDetails,
} from "@/lib/orders";

const statuses = new Set<FulfillmentStatus>([
  "unfulfilled",
  "packed",
  "shipped",
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

function normalizeTracking(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return await verifyAdminSessionToken(token);
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
  const requestedRedirect = String(form.get("redirectTo") ?? "");
  const redirectPath =
    requestedRedirect === "/admin/orders" ||
    requestedRedirect === "/admin/fulfillment"
      ? "/admin/orders"
      : `/admin/orders/${orderId}`;
  const redirectUrl = new URL(redirectPath, request.url);

  const existing = await getOrderById(orderId);
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (intent === "customer") {
    try {
      await updateOrderShippingDetails(orderId, {
        email: String(form.get("email") ?? ""),
        shippingName: String(form.get("shippingName") ?? ""),
        shippingPhone: String(form.get("shippingPhone") ?? ""),
        shippingAddress: {
          line1: String(form.get("line1") ?? ""),
          line2: String(form.get("line2") ?? ""),
          city: String(form.get("city") ?? ""),
          state: String(form.get("state") ?? ""),
          postal_code: String(form.get("postal_code") ?? ""),
          country: String(form.get("country") ?? "US"),
        },
      });
      redirectUrl.searchParams.set("customerSaved", "1");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save customer details";
      redirectUrl.searchParams.set(
        "customerError",
        message === "Another customer already uses that email"
          ? "email_taken"
          : message === "Email is required"
            ? "email_required"
            : "save_failed",
      );
    }
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${existing.customer.id}`);
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const fulfillmentStatus = String(form.get("fulfillmentStatus") ?? "");
  const trackingNumber = String(form.get("trackingNumber") ?? "").trim();
  const trackingNumberConfirm = String(
    form.get("trackingNumberConfirm") ?? "",
  ).trim();
  const returnStatus = String(form.get("returnStatus") ?? "");
  const returnNotes = String(form.get("returnNotes") ?? "").trim();

  if (intent === "fulfillment") {
    if (!statuses.has(fulfillmentStatus as FulfillmentStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (
      normalizeTracking(trackingNumber) !==
      normalizeTracking(trackingNumberConfirm)
    ) {
      redirectUrl.searchParams.set("shippedEmail", "tracking_mismatch");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    await updateOrderFulfillment(
      orderId,
      fulfillmentStatus as FulfillmentStatus,
      trackingNumber || null,
    );

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
    } else if (
      notify.reason === "missing_tracking" &&
      fulfillmentStatus === "shipped"
    ) {
      redirectUrl.searchParams.set("shippedEmail", "needs_tracking");
    } else if (notify.reason === "unchanged") {
      redirectUrl.searchParams.set("shippedEmail", "unchanged");
    } else {
      redirectUrl.searchParams.set("shippedEmail", "saved");
    }

    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (intent === "return") {
    if (!returnStatuses.has(returnStatus as ReturnStatus)) {
      return NextResponse.json({ error: "Invalid return status" }, { status: 400 });
    }

    await updateOrderReturn(
      orderId,
      returnStatus as ReturnStatus,
      returnNotes || null,
    );
    redirectUrl.searchParams.set("returnSaved", "1");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  return NextResponse.json({ error: "Invalid intent" }, { status: 400 });
}
