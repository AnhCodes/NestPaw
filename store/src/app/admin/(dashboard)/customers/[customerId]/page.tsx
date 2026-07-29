import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { getCustomerById } from "@/lib/orders";

function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return formatPrice(cents / 100);
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  const data = await getCustomerById(customerId);
  if (!data) notFound();

  const { customer, orders } = data;

  return (
    <div>
      <Link
        href="/admin/customers"
        className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
      >
        ← Customers
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em]">
        {customer.name || customer.email}
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">{customer.email}</p>

      <dl className="mt-8 grid gap-4 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[color:var(--admin-subtle)]">Phone</dt>
          <dd className="mt-1">{customer.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-[color:var(--admin-subtle)]">Customer since</dt>
          <dd className="mt-1">
            {customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString()
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[color:var(--admin-subtle)]">Orders</dt>
          <dd className="mt-1">{orders.length}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">Order history</h2>
        <div className="mt-4 divide-y divide-[color:var(--admin-border)] border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
          {orders.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[color:var(--admin-muted)]">No orders.</p>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-[var(--admin-hover)]"
              >
                <div>
                  <p className="text-sm font-medium">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : order.id}
                  </p>
                  <p className="text-xs capitalize text-[color:var(--admin-subtle)]">
                    {order.fulfillmentStatus} · {order.paymentStatus ?? "—"}
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  {formatCents(order.amountTotal)}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
