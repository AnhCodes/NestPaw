import Link from "next/link";
import {
  catalogItemTracksStock,
  inventoryCatalog,
} from "@/lib/inventory-catalog";
import { formatPrice } from "@/lib/products";
import {
  getPurchaseSpendSummary,
  getRevenueSummary,
  listInventoryRows,
  listOrders,
} from "@/lib/orders";

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

export default async function AdminOverviewPage() {
  const [summary, spend, orders, inventoryRows] = await Promise.all([
    getRevenueSummary(),
    getPurchaseSpendSummary(),
    listOrders(),
    listInventoryRows(),
  ]);

  const recent = orders.slice(0, 8);
  const stockById = new Map(inventoryRows.map((row) => [row.productId, row.stock]));
  const stockItems = inventoryCatalog
    .filter((item) => catalogItemTracksStock(item))
    .map((item) => ({
      id: item.id,
      name: item.name,
      stock: stockById.get(item.id) ?? 0,
    }));

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.04em]">
        Overview
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">
        Sales, fulfillment queue, and inventory at a glance.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-subtle)]">
            Paid orders
          </p>
          <p className="mt-3 font-display text-3xl font-semibold">
            {summary.orderCount}
          </p>
        </div>
        <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-subtle)]">
            Revenue
          </p>
          <p className="mt-3 font-display text-3xl font-semibold">
            {formatCents(summary.revenueCents)}
          </p>
        </div>
        <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-subtle)]">
            Average order
          </p>
          <p className="mt-3 font-display text-3xl font-semibold">
            {formatCents(summary.averageOrderValueCents)}
          </p>
        </div>
        <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-subtle)]">
            Inventory spend
          </p>
          <p className="mt-3 font-display text-3xl font-semibold">
            {formatCents(spend.inventorySpendCents)}
          </p>
          <p className="mt-2 text-xs text-[color:var(--admin-muted)]">
            {spend.inventoryLineCount === 0
              ? "No product inventory purchases yet"
              : `Alibaba ${formatCents(spend.alibabaInventorySpendCents)} · products, treats, and print`}
          </p>
        </div>
        <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-subtle)]">
            Operations spend
          </p>
          <p className="mt-3 font-display text-3xl font-semibold">
            {formatCents(spend.operationsSpendCents)}
          </p>
          <p className="mt-2 text-xs text-[color:var(--admin-muted)]">
            {spend.operationsLineCount === 0
              ? "No ops purchases yet"
              : "Shipping supplies, equipment, ads, and tools"}
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
            >
              View all →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[color:var(--admin-border)] border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
            {recent.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[color:var(--admin-muted)]">No orders yet.</p>
            ) : (
              recent.map(({ order, customer }) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-[var(--admin-hover)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[color:var(--admin-fg)]">
                      {customer.email}
                    </p>
                    <p className="text-xs text-[color:var(--admin-subtle)]">
                      {order.fulfillmentStatus} ·{" "}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {order.amountTotal != null
                      ? formatCents(order.amountTotal)
                      : "—"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Stock</h2>
            <Link
              href="/admin/inventory"
              className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
            >
              Inventory →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[color:var(--admin-border)] border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
            {stockItems.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[color:var(--admin-muted)]">
                No inventory items yet.
              </p>
            ) : (
              stockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-sm text-[color:var(--admin-muted)]">
                    {item.stock} in stock
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
