import Link from "next/link";
import {
  getKitComponentIds,
  inventoryCatalog,
  inventorySectionLabels,
  type InventorySection,
} from "@/lib/inventory-catalog";
import { listInventoryRows, listRecentInventoryPurchases } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

function componentMin(
  storefrontProductId: string | undefined,
  byId: Map<string, { stock: number; storefrontStock: number }>,
  field: "stock" | "storefrontStock",
) {
  if (!storefrontProductId) return 0;
  const components = getKitComponentIds(storefrontProductId);
  if (!components || components.length === 0) {
    return byId.get(storefrontProductId)?.[field] ?? 0;
  }
  return Math.min(...components.map((id) => byId.get(id)?.[field] ?? 0));
}

function formatPurchaseDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ synced?: string }>;
}) {
  const { synced } = await searchParams;
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

  const storeProducts = inventoryCatalog.filter(
    (item) => item.section === "store-products",
  );
  const outOfSyncCount = storeProducts.filter((item) => {
    const row = byId.get(item.id);
    if ((row?.stock ?? 0) !== (row?.storefrontStock ?? 0)) return true;
    if (!item.storefrontProductId || !getKitComponentIds(item.storefrontProductId)) {
      return false;
    }
    return (
      componentMin(item.storefrontProductId, byId, "storefrontStock") !==
      componentMin(item.storefrontProductId, byId, "stock")
    );
  }).length;

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.04em]">
        Inventory
      </h1>
      <p className="mt-2 text-[color:var(--admin-muted)]">
        Admin stock updates immediately. Storefront stock only changes when you sync.
      </p>

      {synced === "1" ? (
        <p className="mt-4 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[color:var(--admin-accent)]">
          Storefront stock synced from admin inventory.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <div>
          <p className="font-medium text-[color:var(--admin-fg)]">
            Sync stock to storefront
          </p>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
            Publish admin warehouse counts for store products. For the shedding
            brush kit, storefront stock becomes the lower of brush and glove.
          </p>
          {outOfSyncCount > 0 ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-warning-fg)]">
              {outOfSyncCount} product{outOfSyncCount === 1 ? "" : "s"} out of sync
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-accent)]">
              Store products are in sync
            </p>
          )}
        </div>
        <form action="/api/admin/inventory/sync" method="post">
          <button type="submit" className="btn-primary">
            Sync to storefront
          </button>
        </form>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
        <div>
          <p className="font-medium text-[color:var(--admin-fg)]">Purchase logs</p>
          <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
            Save what you ordered, total spend, and quantities by item. Admin stock
            increases automatically.
          </p>
        </div>
        <Link href="/admin/inventory/purchases/new" className="btn-primary">
          Log purchase
        </Link>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-[color:var(--admin-fg)]">Recent purchase logs</h2>
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
                        ` x${item.quantity}` +
                        (item.lineCostCents
                          ? ` · ${formatPrice(item.lineCostCents / 100)}`
                          : "")}
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
              <h2 className="font-display text-2xl font-semibold text-[color:var(--admin-fg)]">
                {inventorySectionLabels[section]}
              </h2>
              <div className="mt-4 space-y-4">
                {items.map((item) => {
                  const row = byId.get(item.id);
                  const stock = row?.stock ?? 0;
                  const storefrontStock = row?.storefrontStock ?? 0;
                  const isKitComponent = Boolean(
                    item.storefrontProductId &&
                      getKitComponentIds(item.storefrontProductId),
                  );
                  const kitStorefront = isKitComponent
                    ? componentMin(item.storefrontProductId, byId, "storefrontStock")
                    : storefrontStock;
                  const kitAdminAvailable = isKitComponent
                    ? componentMin(item.storefrontProductId, byId, "stock")
                    : stock;
                  const threshold = row?.lowStockThreshold ?? item.lowStockThreshold;
                  const low = stock <= threshold;
                  const outOfSync =
                    item.section === "store-products" &&
                    (stock !== storefrontStock ||
                      (isKitComponent && kitStorefront !== kitAdminAvailable));

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
                            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-subtle)]">
                              {isKitComponent
                                ? `Kit storefront: ${kitStorefront} (min brush/glove)`
                                : `Storefront: ${storefrontStock}`}
                            </span>
                          ) : null}
                          {isKitComponent ? (
                            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-accent)]">
                              Kit component · admin kits: {kitAdminAvailable}
                            </span>
                          ) : null}
                          {outOfSync ? (
                            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-warning-fg)]">
                              Out of sync
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
                          Admin stock
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
