import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { listOrders } from "@/lib/orders";

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.04em]">
        Orders
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">
        Paid checkouts from Stripe, ready for fulfillment.
      </p>

      <div className="mt-8 overflow-x-auto border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[color:var(--admin-border)] bg-[var(--admin-surface-soft)] text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--admin-subtle)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Fulfillment</th>
              <th className="px-4 py-3 font-semibold">Tracking</th>
              <th className="px-4 py-3 font-semibold">Returns</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--admin-border)]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-[color:var(--admin-muted)]">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map(({ order, customer }) => (
                <tr key={order.id} className="hover:bg-[var(--admin-hover)]">
                  <td className="px-4 py-3 text-[color:var(--admin-muted)]">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-[color:var(--admin-fg)] hover:underline"
                    >
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3">
                    {order.amountTotal != null
                      ? formatCents(order.amountTotal)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{order.paymentStatus ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">
                    {order.fulfillmentStatus}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[color:var(--admin-muted)]">
                    {order.trackingNumber || "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {order.returnStatus === "none" ? "—" : order.returnStatus}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
