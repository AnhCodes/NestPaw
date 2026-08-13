import Link from "next/link";
import { listCustomers } from "@/lib/orders";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-tight">Customers</h1>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
        Click a row to edit details and see order history.
      </p>

      <div className="admin-table-wrap mt-6">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Since</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-[color:var(--admin-muted)]">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="admin-row-link"
                      aria-label={`Open ${customer.email}`}
                    />
                    <p className="font-medium">
                      {customer.name || customer.email}
                    </p>
                    {customer.name ? (
                      <p className="text-xs text-[color:var(--admin-subtle)]">
                        {customer.email}
                      </p>
                    ) : null}
                  </td>
                  <td className="text-[color:var(--admin-muted)]">
                    {customer.phone || "—"}
                  </td>
                  <td className="text-[color:var(--admin-muted)]">
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
