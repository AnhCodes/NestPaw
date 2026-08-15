import Link from "next/link";
import {
  catalogItemTracksStock,
  inventorySectionLabels,
  inventorySectionOrder,
} from "@/lib/inventory-catalog";
import { getMergedInventoryCatalog } from "@/lib/inventory";
import { formatPrice } from "@/lib/products";
import {
  getPurchaseSpendSummary,
  getRevenueSummary,
  listInventoryRows,
  listOrders,
} from "@/lib/orders";
import { AdminBadge, fulfillmentTone } from "@/components/admin-badge";
import { SpendPieChart, type SpendSlice } from "@/components/spend-pie-chart";

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

const spendColors = [
  "var(--admin-accent)",
  "color-mix(in oklab, var(--admin-accent) 70%, var(--admin-fg))",
  "color-mix(in oklab, var(--admin-accent) 48%, var(--admin-muted))",
  "color-mix(in oklab, var(--admin-warning-fg) 75%, var(--admin-accent))",
  "var(--admin-muted)",
  "color-mix(in oklab, var(--admin-accent) 30%, var(--admin-subtle))",
];

export default async function AdminOverviewPage() {
  const [summary, spend, orders, inventoryRows, catalog] = await Promise.all([
    getRevenueSummary(),
    getPurchaseSpendSummary(),
    listOrders(),
    listInventoryRows(),
    getMergedInventoryCatalog(),
  ]);

  const unfulfilled = orders.filter(
    ({ order }) => order.fulfillmentStatus === "unfulfilled",
  );
  const recent = orders.slice(0, 6);
  const stockById = new Map(inventoryRows.map((row) => [row.productId, row]));
  const lowStock = catalog
    .filter((item) => catalogItemTracksStock(item))
    .map((item) => {
      const row = stockById.get(item.id);
      const stock = row?.stock ?? 0;
      const threshold = row?.lowStockThreshold ?? item.lowStockThreshold;
      return {
        id: item.id,
        name: item.name,
        section: inventorySectionLabels[item.section],
        stock,
        threshold,
        low: threshold > 0 && stock <= threshold,
      };
    })
    .filter((item) => item.low);

  const totalSpendCents =
    spend.inventorySpendCents + spend.operationsSpendCents;
  const spendSlices: SpendSlice[] = inventorySectionOrder
    .map((section, index) => ({
      id: section,
      label: inventorySectionLabels[section],
      cents: spend.bySection[section] ?? 0,
      color: spendColors[index] ?? spendColors[0],
    }))
    .filter((slice) => slice.cents > 0);

  if ((spend.bySection.other ?? 0) > 0) {
    spendSlices.push({
      id: "other",
      label: "Other",
      cents: spend.bySection.other ?? 0,
      color: "var(--admin-subtle)",
    });
  }

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
        What needs attention, plus a quick read on sales.
      </p>

      <div className="admin-card admin-stats admin-stats-3 mt-8">
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            To ship
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            <Link href="/admin/orders" className="hover:underline">
              {unfulfilled.length}
            </Link>
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Orders
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {summary.orderCount}
          </p>
        </div>
        <div className="admin-stat">
          <p className="text-xs font-medium text-[color:var(--admin-subtle)]">
            Revenue
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {formatCents(summary.revenueCents)}
          </p>
          <p className="mt-1 text-xs text-[color:var(--admin-muted)]">
            Avg {formatCents(summary.averageOrderValueCents)}
          </p>
        </div>
      </div>

      <section className="admin-card mt-6 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold">Spend</h2>
          <div className="flex items-baseline gap-4">
            <p className="text-2xl font-semibold tracking-tight">
              {formatCents(totalSpendCents)}
            </p>
            <Link
              href="/admin/inventory"
              className="text-sm text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
            >
              Inventory
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <SpendPieChart slices={spendSlices} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
            >
              All orders
            </Link>
          </div>
          <div className="admin-table-wrap mt-3">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-[color:var(--admin-muted)]">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recent.map(({ order, customer }) => (
                    <tr key={order.id}>
                      <td>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="admin-row-link"
                          aria-label={`Open order for ${customer.email}`}
                        />
                        <p className="font-medium">{customer.email}</p>
                        <p className="text-xs text-[color:var(--admin-subtle)]">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "—"}
                        </p>
                      </td>
                      <td>
                        <AdminBadge tone={fulfillmentTone(order.fulfillmentStatus)}>
                          {order.fulfillmentStatus}
                        </AdminBadge>
                      </td>
                      <td className="font-medium">
                        {order.amountTotal != null
                          ? formatCents(order.amountTotal)
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold">Low stock</h2>
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
                  <th>Item</th>
                  <th>On hand</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-[color:var(--admin-muted)]">
                      Nothing is below its threshold.
                    </td>
                  </tr>
                ) : (
                  lowStock.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[color:var(--admin-subtle)]">
                          {item.section}
                        </p>
                      </td>
                      <td>
                        <span className="font-medium text-[color:var(--admin-warning-fg)]">
                          {item.stock}
                        </span>
                        <span className="text-[color:var(--admin-subtle)]">
                          {" "}
                          / {item.threshold}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
