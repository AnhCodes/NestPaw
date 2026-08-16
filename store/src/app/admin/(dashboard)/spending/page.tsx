import Link from "next/link";
import { AdminBadge, returnTone } from "@/components/admin-badge";
import { SpendPieChart } from "@/components/spend-pie-chart";
import { getSpendingReport } from "@/lib/admin-spend";
import { formatPrice } from "@/lib/products";

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

function formatPurchaseDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function AdminSpendingPage() {
  const report = await getSpendingReport();
  const recent = report.purchases.slice(0, 20);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-semibold tracking-tight">
            Spending
          </h1>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
            Logged purchases, plus paid orders, revenue, and returns.
          </p>
        </div>
        <a
          href="/api/admin/spending/report"
          className="btn-primary inline-flex shrink-0 items-center justify-center"
        >
          Download PDF
        </a>
      </div>

      <div className="admin-card admin-stats admin-stats-3 mt-8">
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Total
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCents(report.totalSpendCents)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
            {report.purchaseCount} purchase
            {report.purchaseCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Inventory
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCents(report.inventorySpendCents)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
            {report.inventoryLineCount} line
            {report.inventoryLineCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Operations
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCents(report.operationsSpendCents)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
            {report.operationsLineCount} line
            {report.operationsLineCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="admin-card admin-stats admin-stats-3 mt-6">
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Orders
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            <Link href="/admin/orders" className="hover:underline">
              {report.orderCount}
            </Link>
          </p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
            Paid checkouts
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Revenue
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCents(report.revenueCents)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
            Avg {formatCents(report.averageOrderValueCents)}
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Returns
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {report.returnCount}
          </p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
            {report.returnCount === 0
              ? "None yet"
              : `${formatCents(report.returnCents)} approved${
                  report.openReturnCount > 0
                    ? ` · ${report.openReturnCount} open`
                    : ""
                }`}
          </p>
        </div>
      </div>

      <section className="admin-card mt-6 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">By category</h2>
          <Link
            href="/admin/inventory/purchases/new"
            className="text-sm text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
          >
            Log purchase
          </Link>
        </div>
        <div className="mt-4">
          <SpendPieChart slices={report.slices} size={220} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold">Categories</h2>
          <div className="admin-table-wrap mt-3">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Share</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.categories.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: row.color }}
                          aria-hidden
                        />
                        {row.label}
                      </span>
                    </td>
                    <td className="text-[color:var(--admin-muted)]">
                      {report.totalSpendCents > 0
                        ? `${Math.round((row.cents / report.totalSpendCents) * 100)}%`
                        : "—"}
                    </td>
                    <td className="font-medium tabular-nums">
                      {formatCents(row.cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Vendors</h2>
          <div className="admin-table-wrap mt-3">
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Share</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.vendors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-[color:var(--admin-muted)]">
                      No purchases logged yet.
                    </td>
                  </tr>
                ) : (
                  report.vendors.map((row) => (
                    <tr key={row.vendor}>
                      <td>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: row.color }}
                            aria-hidden
                          />
                          {row.vendor}
                        </span>
                      </td>
                      <td className="text-[color:var(--admin-muted)]">
                        {report.vendorSum > 0
                          ? `${Math.round((row.cents / report.vendorSum) * 100)}%`
                          : "—"}
                      </td>
                      <td className="font-medium tabular-nums">
                        {formatCents(row.cents)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Items</h2>
        <div className="admin-table-wrap mt-3">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-[color:var(--admin-muted)]">
                    No purchases logged yet.
                  </td>
                </tr>
              ) : (
                report.items.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">{row.name}</td>
                    <td className="text-[color:var(--admin-muted)]">
                      {row.section}
                    </td>
                    <td className="tabular-nums">{formatCents(row.cents)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold">Returns</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
          >
            Orders
          </Link>
        </div>
        <div className="admin-table-wrap mt-3">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.returns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-[color:var(--admin-muted)]">
                    No returns yet.
                  </td>
                </tr>
              ) : (
                report.returns.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className="hover:underline"
                      >
                        {formatPurchaseDate(row.date)}
                      </Link>
                    </td>
                    <td className="max-w-[18rem] truncate">{row.email}</td>
                    <td>
                      <AdminBadge tone={returnTone(row.status)}>
                        {row.statusLabel}
                      </AdminBadge>
                    </td>
                    <td className="tabular-nums">
                      {formatCents(row.amountCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold">Recent purchases</h2>
          <Link
            href="/admin/inventory"
            className="text-sm text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
          >
            Inventory
          </Link>
        </div>
        <div className="admin-table-wrap mt-3">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Items</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-[color:var(--admin-muted)]">
                    No purchases logged yet.
                  </td>
                </tr>
              ) : (
                recent.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>
                      <Link
                        href={`/admin/inventory/purchases/${purchase.id}`}
                        className="hover:underline"
                      >
                        {formatPurchaseDate(purchase.createdAt)}
                      </Link>
                    </td>
                    <td>{purchase.vendor}</td>
                    <td className="max-w-[18rem] truncate text-[color:var(--admin-muted)]">
                      {purchase.itemNames.join(", ") || "—"}
                    </td>
                    <td className="tabular-nums">
                      {formatCents(purchase.totalCostCents)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
