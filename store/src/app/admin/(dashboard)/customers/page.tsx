import Link from "next/link";
import { listCustomers } from "@/lib/orders";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.04em]">
        Customers
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">
        People who have completed a NestPaw checkout.
      </p>

      <div className="mt-8 overflow-x-auto border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[color:var(--admin-border)] bg-[var(--admin-surface-soft)] text-[0.7rem] uppercase tracking-[0.12em] text-[color:var(--admin-subtle)]">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--admin-border)]">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-[color:var(--admin-muted)]">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[var(--admin-hover)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-[color:var(--admin-fg)] hover:underline"
                    >
                      {customer.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{customer.name || "—"}</td>
                  <td className="px-4 py-3">{customer.phone || "—"}</td>
                  <td className="px-4 py-3 text-[color:var(--admin-muted)]">
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString()
                      : "—"}
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
