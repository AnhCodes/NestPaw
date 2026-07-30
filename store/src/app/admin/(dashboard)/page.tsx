import Link from "next/link";
import { getInventoryCatalogItem } from "@/lib/inventory-catalog";
import { formatPrice } from "@/lib/products";
import {
  getInventorySpendSummary,
  getRevenueSummary,
  listInventoryRows,
  listOrders,
} from "@/lib/orders";
import { getAdminWebAnalytics } from "@/lib/vercel-web-analytics";

function formatCents(cents: number) {
  return formatPrice(cents / 100);
}

export default async function AdminOverviewPage() {
  const [summary, inventorySpend, orders, inventoryRows, analytics] =
    await Promise.all([
      getRevenueSummary(),
      getInventorySpendSummary(),
      listOrders(),
      listInventoryRows(),
      getAdminWebAnalytics(7),
    ]);

  const recent = orders.slice(0, 8);

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.04em]">
        Overview
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">
        Sales, fulfillment queue, and inventory at a glance.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            {formatCents(inventorySpend.spendCents)}
          </p>
          <p className="mt-2 text-xs text-[color:var(--admin-muted)]">
            {inventorySpend.purchaseCount === 0
              ? "No purchase logs yet"
              : `${inventorySpend.purchaseCount} purchase log${
                  inventorySpend.purchaseCount === 1 ? "" : "s"
                }`}
          </p>
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Site analytics
            </h2>
            <p className="mt-1 text-sm text-[color:var(--admin-muted)]">{analytics.windowLabel}</p>
          </div>
        </div>

        {analytics.status === "ok" || analytics.status === "no-data" ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-subtle)]">
                  Visitors
                </p>
                <p className="mt-3 font-display text-3xl font-semibold">
                  {analytics.visitors ?? "—"}
                </p>
              </div>
              <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--admin-subtle)]">
                  Pageviews
                </p>
                <p className="mt-3 font-display text-3xl font-semibold">
                  {analytics.pageviews ?? "—"}
                </p>
              </div>
              {analytics.reason ? (
                <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5 text-sm text-[color:var(--admin-muted)] sm:col-span-2">
                  {analytics.reason}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
                <div className="border-b border-[color:var(--admin-border)] px-4 py-3">
                  <h3 className="font-semibold">Top pages</h3>
                </div>
                <div className="divide-y divide-[color:var(--admin-border)]">
                  {analytics.topPages.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-[color:var(--admin-muted)]">
                      No page analytics yet.
                    </p>
                  ) : (
                    analytics.topPages.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                      >
                        <p className="truncate font-medium">{row.label}</p>
                        <div className="text-right text-[color:var(--admin-muted)]">
                          <p>{row.pageviews ?? "—"} views</p>
                          <p>{row.visitors ?? "—"} visitors</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)]">
                <div className="border-b border-[color:var(--admin-border)] px-4 py-3">
                  <h3 className="font-semibold">Devices</h3>
                </div>
                <div className="divide-y divide-[color:var(--admin-border)]">
                  {analytics.topDevices.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-[color:var(--admin-muted)]">
                      No device analytics yet.
                    </p>
                  ) : (
                    analytics.topDevices.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                      >
                        <p className="font-medium">{row.label}</p>
                        <div className="text-right text-[color:var(--admin-muted)]">
                          <p>{row.pageviews ?? "—"} views</p>
                          <p>{row.visitors ?? "—"} visitors</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5 text-sm text-[color:var(--admin-muted)]">
            {analytics.reason}
          </div>
        )}
      </section>

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
            {inventoryRows.filter((row) => getInventoryCatalogItem(row.productId))
              .length === 0 ? (
              <p className="px-4 py-6 text-sm text-[color:var(--admin-muted)]">
                No inventory items yet.
              </p>
            ) : (
              inventoryRows
                .filter((row) => getInventoryCatalogItem(row.productId))
                .map((row) => {
                  const item = getInventoryCatalogItem(row.productId);
                  return (
                    <div
                      key={row.productId}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <p className="text-sm font-medium">
                        {item?.name ?? row.productId}
                      </p>
                      <p className="text-sm text-[color:var(--admin-muted)]">
                        {row.stock} in stock
                      </p>
                    </div>
                  );
                })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
