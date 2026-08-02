import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { getOrderById } from "@/lib/orders";
import type { FulfillmentStatus, ReturnStatus } from "@/lib/db/schema";

function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return formatPrice(cents / 100);
}

const fieldClass =
  "mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] placeholder:text-[color:var(--admin-subtle)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30";

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
        className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
      >
        ← Orders
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em]">
        Order
      </h1>
      <p className="mt-2 break-all text-sm text-[color:var(--admin-muted)]">{order.id}</p>

      {shippedNotice ? (
        <p
          className={`mt-6 border px-4 py-3 text-sm ${
            shippedNotice.tone === "warn"
              ? "border-[color:var(--admin-warning-fg)]/30 bg-[color:var(--admin-warning-fg)]/10 text-[color:var(--admin-warning-fg)]"
              : "border-[color:var(--admin-accent)]/30 bg-[color:var(--admin-accent)]/10 text-[color:var(--admin-fg)]"
          }`}
        >
          {shippedNotice.text}
        </p>
      ) : null}
      {query.customerSaved === "1" ? (
        <p className="mt-6 border border-[color:var(--admin-accent)]/30 bg-[color:var(--admin-accent)]/10 px-4 py-3 text-sm text-[color:var(--admin-fg)]">
          Customer details saved.
        </p>
      ) : null}
      {customerError ? (
        <p className="mt-6 border border-[color:var(--admin-warning-fg)]/30 bg-[color:var(--admin-warning-fg)]/10 px-4 py-3 text-sm text-[color:var(--admin-warning-fg)]">
          {customerError}
        </p>
      ) : null}
      {query.returnSaved === "1" ? (
        <p className="mt-6 border border-[color:var(--admin-accent)]/30 bg-[color:var(--admin-accent)]/10 px-4 py-3 text-sm text-[color:var(--admin-fg)]">
          Return status saved.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <section className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h2 className="font-display text-xl font-semibold">Customer</h2>
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
              Save customer
            </button>
            <p className="text-xs text-[color:var(--admin-subtle)]">
              Updates this order&apos;s ship-to details and the linked customer
              profile.{" "}
              <Link
                href={`/admin/customers/${customer.id}`}
                className="underline hover:text-[color:var(--admin-fg)]"
              >
                View customer
              </Link>
            </p>
          </form>
        </section>

        <section className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h2 className="font-display text-xl font-semibold">Fulfillment</h2>
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
              Confirm tracking number
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
              Re-type the tracking number to catch typos before saving. Setting
              status to shipped with tracking emails the customer a USPS link.
            </p>
            <button type="submit" className="btn-primary">
              Save fulfillment
            </button>
          </form>
          <dl className="mt-6 space-y-2 border-t border-[color:var(--admin-border)] pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[color:var(--admin-subtle)]">Payment</dt>
              <dd>{order.paymentStatus ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[color:var(--admin-subtle)]">Total</dt>
              <dd className="font-semibold">{formatCents(order.amountTotal)}</dd>
            </div>
          </dl>
        </section>

        <section className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h2 className="font-display text-xl font-semibold">Returns</h2>
          <form
            action={`/api/admin/orders/${order.id}`}
            method="post"
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="intent" value="return" />
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Return status
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
              Return notes
              <textarea
                name="returnNotes"
                rows={5}
                defaultValue={order.returnNotes ?? ""}
                placeholder="Reason, customer message, approval notes, damaged item details, etc."
                className={fieldClass}
              />
            </label>
            <button type="submit" className="btn-primary">
              Save return status
            </button>
          </form>
          <dl className="mt-6 space-y-2 border-t border-[color:var(--admin-border)] pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[color:var(--admin-subtle)]">Requested</dt>
              <dd>
                {order.returnRequestedAt
                  ? new Date(order.returnRequestedAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="mt-8 border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
        <h2 className="border-b border-[color:var(--admin-border)] px-6 py-4 font-display text-xl font-semibold">
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
                  {item.productId ? ` · ${item.productId}` : ""}
                </p>
              </div>
              <p>{formatCents(item.lineAmount)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
