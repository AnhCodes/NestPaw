import Link from "next/link";
import {
  PurchaseLogsSection,
  type PurchaseLogView,
} from "@/components/purchase-logs-section";
import {
  getKitComponentIds,
  inventorySectionLabels,
  type InventoryCatalogItem,
  type InventorySection,
} from "@/lib/inventory-catalog";
import {
  canRemoveInventoryItem,
  getMergedInventoryCatalog,
  isBuiltinCatalogItem,
} from "@/lib/inventory";
import { listInventoryPurchases, listInventoryRows } from "@/lib/orders";

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

function AddInventoryItemForm({ section }: { section: InventorySection }) {
  return (
    <form
      action="/api/admin/inventory"
      method="post"
      className="border border-dashed border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5"
    >
      <input type="hidden" name="section" value={section} />
      <input type="hidden" name="tracksStock" value="true" />
      <p className="text-sm font-medium text-[color:var(--admin-fg)]">
        Add item
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
        <label className="block text-sm">
          Name
          <input
            name="name"
            required
            placeholder="e.g. Extra packing pillows"
            className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none placeholder:text-[color:var(--admin-subtle)] focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
          />
        </label>
        <label className="block text-sm">
          Admin stock
          <input
            type="number"
            name="stock"
            min={0}
            defaultValue={0}
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
            defaultValue={3}
            required
            className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
          />
        </label>
        <button type="submit" className="btn-primary h-fit">
          Add
        </button>
      </div>
    </form>
  );
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ synced?: string }>;
}) {
  const { synced } = await searchParams;
  const [rows, purchases, catalog] = await Promise.all([
    listInventoryRows(),
    listInventoryPurchases(),
    getMergedInventoryCatalog(),
  ]);
  const byId = new Map(rows.map((row) => [row.productId, row]));
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const sections: InventorySection[] = [
    "store-products",
    "treats",
    "printed-materials",
    "shipping-supplies",
    "business-ops",
  ];

  const purchaseViews: PurchaseLogView[] = purchases.map((purchase) => ({
    id: purchase.id,
    vendor: purchase.vendor,
    totalCostCents: purchase.totalCostCents,
    notes: purchase.notes,
    createdAt: new Date(purchase.createdAt).toISOString(),
    items: purchase.items.map((item) => {
      const catalogItem = catalogById.get(item.inventoryItemId);
      return {
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        name: catalogItem?.name ?? item.inventoryItemId,
        quantity: item.quantity,
        lineCostCents: item.lineCostCents,
        sectionLabel: catalogItem
          ? inventorySectionLabels[catalogItem.section]
          : "Other",
      };
    }),
  }));

  const storeProducts = catalog.filter(
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
            Log product stock, packing supplies, and business buys like a label
            printer. Stocked items raise admin inventory; expense-only items count
            toward spend only.
          </p>
        </div>
        <Link href="/admin/inventory/purchases/new" className="btn-primary">
          Log purchase
        </Link>
      </div>

      <PurchaseLogsSection
        purchases={purchaseViews}
        sectionLabels={sections.map((section) => inventorySectionLabels[section])}
      />

      <div className="mt-8 space-y-10">
        {sections.map((section) => {
          const items = catalog.filter(
            (item) => item.section === section && item.tracksStock !== false,
          );

          return (
            <section key={section}>
              <h2 className="font-display text-2xl font-semibold text-[color:var(--admin-fg)]">
                {inventorySectionLabels[section]}
              </h2>
              <div className="mt-4 space-y-4">
                {items.length === 0 ? (
                  <div className="border border-dashed border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5 text-sm text-[color:var(--admin-muted)]">
                    No stocked items in this section yet.
                  </div>
                ) : (
                  items.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      stock={byId.get(item.id)?.stock ?? 0}
                      storefrontStock={byId.get(item.id)?.storefrontStock ?? 0}
                      threshold={
                        byId.get(item.id)?.lowStockThreshold ??
                        item.lowStockThreshold
                      }
                      byId={byId}
                      builtin={isBuiltinCatalogItem(item.id)}
                      removable={canRemoveInventoryItem(item.id)}
                    />
                  ))
                )}
                <AddInventoryItemForm section={section} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function InventoryItemCard({
  item,
  stock,
  storefrontStock,
  threshold,
  byId,
  builtin,
  removable,
}: {
  item: InventoryCatalogItem;
  stock: number;
  storefrontStock: number;
  threshold: number;
  byId: Map<string, { stock: number; storefrontStock: number }>;
  builtin: boolean;
  removable: boolean;
}) {
  const isKitComponent = Boolean(
    item.storefrontProductId && getKitComponentIds(item.storefrontProductId),
  );
  const kitStorefront = isKitComponent
    ? componentMin(item.storefrontProductId, byId, "storefrontStock")
    : storefrontStock;
  const kitAdminAvailable = isKitComponent
    ? componentMin(item.storefrontProductId, byId, "stock")
    : stock;
  const low = threshold > 0 && stock <= threshold;
  const outOfSync =
    item.section === "store-products" &&
    (stock !== storefrontStock ||
      (isKitComponent && kitStorefront !== kitAdminAvailable));

  return (
    <div className="border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-5">
      <form action={`/api/admin/inventory/${item.id}`} method="post">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-[color:var(--admin-fg)]">{item.name}</p>
            <p className="text-xs text-[color:var(--admin-subtle)]">
              {item.id}
              {builtin ? "" : " · custom"}
            </p>
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
      {removable ? (
        <form
          action={`/api/admin/inventory/${item.id}`}
          method="post"
          className="mt-4 border-t border-[color:var(--admin-border)] pt-4"
        >
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="redirectTo" value="/admin/inventory" />
          <button
            type="submit"
            className="border border-[color:var(--admin-danger-border)] bg-[var(--admin-danger-bg)] px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-danger-fg)] transition hover:opacity-90"
          >
            Remove
          </button>
        </form>
      ) : null}
    </div>
  );
}
