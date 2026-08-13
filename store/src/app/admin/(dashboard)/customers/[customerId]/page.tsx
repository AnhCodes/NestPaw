import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { getCustomerById } from "@/lib/orders";

function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—";
  return formatPrice(cents / 100);
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

export default async function AdminCustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { customerId } = await params;
  const query = await searchParams;
  const data = await getCustomerById(customerId);
  if (!data) notFound();

  const { customer, orders } = data;
  const error = customerErrorMessage(query.error);

  return (
    <div>
      <Link
        href="/admin/customers"
        className="text-sm font-medium text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
      >
        ← Customers
      </Link>
      <h1 className="mt-3 text-[1.65rem] font-semibold tracking-tight">
        {customer.name || customer.email}
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">{customer.email}</p>

      {query.saved === "1" ? (
        <p className="admin-notice admin-notice-ok mt-6">Customer details saved.</p>
      ) : null}
      {error ? (
        <p className="admin-notice admin-notice-warn mt-6">{error}</p>
      ) : null}

      <form
        action={`/api/admin/customers/${customer.id}`}
        method="post"
        className="admin-card mt-8 grid gap-4 p-6 sm:grid-cols-3"
      >
        <label className="block text-sm text-[color:var(--admin-fg)]">
          Name
          <input
            name="name"
            defaultValue={customer.name ?? ""}
            className="admin-input"
          />
        </label>
        <label className="block text-sm text-[color:var(--admin-fg)]">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue={customer.email}
            className="admin-input"
          />
        </label>
        <label className="block text-sm text-[color:var(--admin-fg)]">
          Phone
          <input
            name="phone"
            defaultValue={customer.phone ?? ""}
            className="admin-input"
          />
        </label>
        <div className="sm:col-span-3">
          <button type="submit" className="btn-primary">
            Save customer
          </button>
        </div>
      </form>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Order history</h2>
        <div className="admin-card mt-3 divide-y divide-[color:var(--admin-border)]">
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
