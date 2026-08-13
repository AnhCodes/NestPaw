import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { getOrderById } from "@/lib/orders";
import type { FulfillmentStatus, ReturnStatus } from "@/lib/db/schema";
import { AdminBadge, fulfillmentTone } from "@/components/admin-badge";

function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return formatPrice(cents / 100);
}

const fieldClass = "admin-input";

const statuses: FulfillmentStatus[] = [
  "unfulfilled",
  "packed",
  "shipped",
];

const returnStatuses: ReturnStatus[] = [
  "none",
  "requested",
  "reviewing",
  "denied",
  "approved",
  "received",
  "closed",
];

function shippedEmailMessage(value: string | undefined) {
  switch (value) {
    case "sent":
      return {
        tone: "ok" as const,
        text: "Fulfillment saved. Shipping email sent to the customer.",
      };
    case "error":
      return {
        tone: "warn" as const,
        text: "Fulfillment saved, but the shipping email failed to send. Check RESEND_API_KEY / CONTACT_FROM_EMAIL.",
      };
    case "needs_tracking":
      return {
        tone: "warn" as const,
        text: "Marked as shipped, but no tracking number was added, so no customer email was sent.",
      };
    case "unchanged":
      return {
        tone: "ok" as const,
        text: "Fulfillment saved. Shipping email was already sent for this tracking number.",
      };
    case "tracking_mismatch":
      return {
        tone: "warn" as const,
        text: "Tracking numbers did not match. Nothing was saved — re-enter and confirm carefully.",
      };
    case "saved":
      return {
        tone: "ok" as const,
        text: "Fulfillment saved.",
      };
    default:
      return null;
  }
}

function customerErrorMessage(value: string | undefined) {
  switch (value) {
    case "email_required":
      return "Email is required.";
    case "email_taken":
      return "Another customer already uses that email.";
    case "save_failed":
      return "Could not save customer details. Try again.";
    default:
      return null;
  }
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{
    shippedEmail?: string;
    returnSaved?: string;
    customerSaved?: string;
    customerError?: string;
  }>;
}) {
  const { orderId } = await params;
  const query = await searchParams;
  const data = await getOrderById(orderId);
  if (!data) notFound();

  const { order, customer, items } = data;
  const address = (order.shippingAddress ?? {}) as Record<string, string>;
  const shippedNotice = shippedEmailMessage(query.shippedEmail);
  const customerError = customerErrorMessage(query.customerError);

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
      >
        ← Orders and Fulfillment
      </Link>
      <h1 className="mt-3 text-[1.65rem] font-semibold tracking-tight">
        {customer.email}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--admin-muted)]">
        <AdminBadge tone={fulfillmentTone(order.fulfillmentStatus)}>
          {order.fulfillmentStatus}
        </AdminBadge>
        <span>{formatCents(order.amountTotal)}</span>
        <span>{order.paymentStatus ?? "unpaid"}</span>
      </div>

      {shippedNotice ? (
        <p
          className={`admin-notice mt-6 ${
            shippedNotice.tone === "warn"
              ? "admin-notice-warn"
              : "admin-notice-ok"
          }`}
        >
          {shippedNotice.text}
        </p>
      ) : null}
      {query.customerSaved === "1" ? (
        <p className="admin-notice admin-notice-ok mt-6">
          Customer details saved.
        </p>
      ) : null}
      {customerError ? (
        <p className="admin-notice admin-notice-warn mt-6">
          {customerError}
        </p>
      ) : null}
      {query.returnSaved === "1" ? (
        <p className="admin-notice admin-notice-ok mt-6">
          Return status saved.
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="admin-card p-6">
          <h2 className="text-sm font-semibold">Ship</h2>
          <form
            action={`/api/admin/orders/${order.id}`}
            method="post"
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="intent" value="fulfillment" />
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Status
              <select
                name="fulfillmentStatus"
                defaultValue={order.fulfillmentStatus}
                className={fieldClass}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Tracking number
              <input
                name="trackingNumber"
                defaultValue={order.trackingNumber ?? ""}
                autoComplete="off"
                spellCheck={false}
                className={fieldClass}
                placeholder="Required to email tracking"
              />
            </label>
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Confirm tracking
              <input
                name="trackingNumberConfirm"
                defaultValue={order.trackingNumber ?? ""}
                autoComplete="off"
                spellCheck={false}
                className={fieldClass}
                placeholder="Re-type to confirm"
              />
            </label>
            <p className="text-xs text-[color:var(--admin-subtle)]">
              Marking shipped with matching tracking emails a USPS link.
            </p>
            <button type="submit" className="btn-primary">
              Save fulfillment
            </button>
          </form>
        </section>

        <section className="admin-card overflow-hidden">
          <h2 className="border-b border-[color:var(--admin-border)] px-6 py-4 text-sm font-semibold">
            Items
          </h2>
          <ul className="divide-y divide-[color:var(--admin-border)]">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-6 py-4 text-sm"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-[color:var(--admin-subtle)]">
                    Qty {item.quantity}
                  </p>
                </div>
                <p>{formatCents(item.lineAmount)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="admin-card p-6">
          <h2 className="text-sm font-semibold">Ship to</h2>
          <form
            action={`/api/admin/orders/${order.id}`}
            method="post"
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="intent" value="customer" />
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Email
              <input
                name="email"
                type="email"
                required
                defaultValue={customer.email}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Name
              <input
                name="shippingName"
                defaultValue={order.shippingName || customer.name || ""}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Phone
              <input
                name="shippingPhone"
                defaultValue={order.shippingPhone || customer.phone || ""}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Address line 1
              <input
                name="line1"
                defaultValue={address.line1 ?? ""}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Address line 2
              <input
                name="line2"
                defaultValue={address.line2 ?? ""}
                className={fieldClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-[color:var(--admin-fg)]">
                City
                <input
                  name="city"
                  defaultValue={address.city ?? ""}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm text-[color:var(--admin-fg)]">
                State
                <input
                  name="state"
                  defaultValue={address.state ?? ""}
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-[color:var(--admin-fg)]">
                Postal code
                <input
                  name="postal_code"
                  defaultValue={address.postal_code ?? ""}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm text-[color:var(--admin-fg)]">
                Country
                <input
                  name="country"
                  defaultValue={address.country || "US"}
                  className={fieldClass}
                />
              </label>
            </div>
            <button type="submit" className="btn-primary">
              Save address
            </button>
            <p className="text-xs text-[color:var(--admin-subtle)]">
              <Link
                href={`/admin/customers/${customer.id}`}
                className="underline hover:text-[color:var(--admin-fg)]"
              >
                View customer
              </Link>
            </p>
          </form>
        </section>

        <section className="admin-card p-6">
          <h2 className="text-sm font-semibold">Return</h2>
          <form
            action={`/api/admin/orders/${order.id}`}
            method="post"
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="intent" value="return" />
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Status
              <select
                name="returnStatus"
                defaultValue={order.returnStatus}
                className={fieldClass}
              >
                {returnStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Notes
              <textarea
                name="returnNotes"
                rows={4}
                defaultValue={order.returnNotes ?? ""}
                placeholder="Reason, approval notes, damage..."
                className={fieldClass}
              />
            </label>
            <button type="submit" className="btn-primary">
              Save return
            </button>
          </form>
          {order.returnRequestedAt ? (
            <p className="mt-4 text-xs text-[color:var(--admin-subtle)]">
              Requested {new Date(order.returnRequestedAt).toLocaleString()}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
