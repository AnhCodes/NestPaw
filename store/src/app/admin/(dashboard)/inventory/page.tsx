import Link from "next/link";
import {
  inventoryCatalog,
  inventorySectionLabels,
  type InventorySection,
} from "@/lib/inventory-catalog";
import { listInventoryRows, listRecentInventoryPurchases } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

function formatPurchaseDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminInventoryPage() {
  const [rows, recentPurchases] = await Promise.all([
    listInventoryRows(),
    listRecentInventoryPurchases(8),
  ]);
  const byId = new Map(rows.map((row) => [row.productId, row]));
  const catalogById = new Map(inventoryCatalog.map((item) => [item.id, item]));
  const sections: InventorySection[] = [
    "store-products",
    "treats",
    "printed-materials",
    "shipping-supplies",
  ];

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.04em]">
        Inventory
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">
        Track both storefront products and packing supplies in one place.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <div>
          <p className="font-medium text-[color:var(--admin-fg)]">Purchase logs</p>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
            Save what you ordered, total spend, and quantities by item.
          </p>
        </div>
        <Link href="/admin/inventory/purchases/new" className="btn-primary">
          Log purchase
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-ink">Recent purchase logs</h2>
          <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--admin-subtle)]">
            Alibaba and suppliers
          </p>
        </div>
        <div className="mt-4 space-y-4">
          {recentPurchases.length === 0 ? (
            <div className="border border-dashed border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5 text-sm text-[color:var(--admin-muted)]">
              No purchase logs yet.
            </div>
          ) : (
            recentPurchases.map((purchase) => (
              <article
                key={purchase.id}
                className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[color:var(--admin-fg)]">
                      {purchase.vendor}
                    </p>
                    <p className="text-xs text-[color:var(--admin-subtle)]">
                      {formatPurchaseDate(purchase.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--admin-fg)]">
                    {formatPrice(purchase.totalCostCents / 100)}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {purchase.items.map((item) => (
                    <span
                      key={item.id}
                      className="border border-[color:var(--admin-border)] px-2 py-1 text-xs text-[color:var(--admin-muted)]"
                    >
                      {(catalogById.get(item.inventoryItemId)?.name ?? item.inventoryItemId) +
                        ` x${item.quantity}`}
                    </span>
                  ))}
                </div>
                {purchase.notes ? (
                  <p className="mt-4 text-sm text-[color:var(--admin-muted)]">
                    {purchase.notes}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <div className="mt-8 space-y-10">
        {sections.map((section) => {
          const items = inventoryCatalog.filter((item) => item.section === section);

          return (
            <section key={section}>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {inventorySectionLabels[section]}
              </h2>
              <div className="mt-4 space-y-4">
                {items.map((item) => {
                  const row = byId.get(item.id);
                  const stock = row?.stock ?? 0;
                  const threshold = row?.lowStockThreshold ?? item.lowStockThreshold;
                  const low = stock <= threshold;

                  return (
                    <form
                      key={item.id}
                      action={`/api/admin/inventory/${item.id}`}
                      method="post"
                      className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[color:var(--admin-fg)]">{item.name}</p>
                          <p className="text-xs text-[color:var(--admin-subtle)]">{item.id}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.section === "store-products" ? (
                            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-accent)]">
                              Syncs to storefront
                            </span>
                          ) : null}
                          {low ? (
                            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-warning-fg)]">
                              Low stock
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="block text-sm">
                          Units in stock
                          <input
                            type="number"
                            name="stock"
                            min={0}
                            defaultValue={stock}
                            required
                            className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                          />
                        </label>
                        <label className="block text-sm">
                          Low-stock threshold
                          <input
                            type="number"
                            name="lowStockThreshold"
                            min={0}
                            defaultValue={threshold}
                            required
                            className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                          />
                        </label>
                        <button type="submit" className="btn-primary h-fit">
                          Save
                        </button>
                      </div>
                    </form>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
