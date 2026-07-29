import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { getOrderById } from "@/lib/orders";
import type { FulfillmentStatus, ReturnStatus } from "@/lib/db/schema";

function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return formatPrice(cents / 100);
}

const statuses: FulfillmentStatus[] = [
  "unfulfilled",
  "packed",
  "shipped",
  "delivered",
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const data = await getOrderById(orderId);
  if (!data) notFound();

  const { order, customer, items } = data;
  const address = order.shippingAddress as Record<string, string> | null;

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

      <div className="mt-8 grid gap-8 xl:grid-cols-3">
        <section className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h2 className="font-display text-xl font-semibold">Customer</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="text-[color:var(--admin-subtle)]">Email</dt>
              <dd>
                <Link
                  href={`/admin/customers/${customer.id}`}
                  className="hover:underline"
                >
                  {customer.email}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[color:var(--admin-subtle)]">Name</dt>
              <dd>{order.shippingName || customer.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--admin-subtle)]">Phone</dt>
              <dd>{order.shippingPhone || customer.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-[color:var(--admin-subtle)]">Ship to</dt>
              <dd className="whitespace-pre-line">
                {address
                  ? [
                      address.line1,
                      address.line2,
                      [address.city, address.state, address.postal_code]
                        .filter(Boolean)
                        .join(", "),
                      address.country,
                    ]
                      .filter(Boolean)
                      .join("\n")
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6">
          <h2 className="font-display text-xl font-semibold">Fulfillment</h2>
          <form
            action={`/api/admin/orders/${order.id}`}
            method="post"
            className="mt-4 space-y-4"
          >
            <input type="hidden" name="returnStatus" value={order.returnStatus} />
            <input type="hidden" name="returnNotes" value={order.returnNotes ?? ""} />
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Status
              <select
                name="fulfillmentStatus"
                defaultValue={order.fulfillmentStatus}
                className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
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
                className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] placeholder:text-[color:var(--admin-subtle)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                placeholder="Optional"
              />
            </label>
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
            <input type="hidden" name="fulfillmentStatus" value={order.fulfillmentStatus} />
            <input type="hidden" name="trackingNumber" value={order.trackingNumber ?? ""} />
            <label className="block text-sm text-[color:var(--admin-fg)]">
              Return status
              <select
                name="returnStatus"
                defaultValue={order.returnStatus}
                className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
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
                className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] placeholder:text-[color:var(--admin-subtle)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
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
