import { InventoryPageActions } from "@/components/add-inventory-item-form";
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
      <h1 className="text-[1.65rem] font-semibold tracking-tight">Inventory</h1>
      <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
        Admin stock updates immediately. Storefront stock only changes when you sync.
      </p>

      {synced === "1" ? (
        <p className="admin-notice admin-notice-ok mt-4">
          Storefront stock synced from admin inventory.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="pt-2 text-sm text-[color:var(--admin-muted)]">
          {outOfSyncCount > 0
            ? `${outOfSyncCount} store product${outOfSyncCount === 1 ? "" : "s"} out of sync`
            : "Store products are in sync"}
        </p>
        <InventoryPageActions />
      </div>

      <PurchaseLogsSection
        purchases={purchaseViews}
        sectionLabels={sections.map((section) => inventorySectionLabels[section])}
      />

      <div className="mt-8 space-y-8">
        {sections.map((section) => {
          const items = catalog.filter(
            (item) => item.section === section && item.tracksStock !== false,
          );

          return (
            <section key={section}>
              <h2 className="text-sm font-semibold text-[color:var(--admin-fg)]">
                {inventorySectionLabels[section]}
              </h2>
              <div className="admin-table-wrap mt-3">
                <table className="min-w-[640px]">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Stock</th>
                      <th>Alert at</th>
                      <th>Notes</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-[color:var(--admin-muted)]">
                          No items in this section yet.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <InventoryItemRow
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
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function InventoryItemRow({
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

  const notes = [
    item.section === "store-products"
      ? isKitComponent
        ? `Store ${kitStorefront}`
        : `Store ${storefrontStock}`
      : null,
    isKitComponent ? `Kits ${kitAdminAvailable}` : null,
    outOfSync ? "Out of sync" : null,
    low ? "Low" : null,
    builtin ? null : "Custom",
  ].filter(Boolean);

  return (
    <tr>
      <td>
        <form
          id={`save-${item.id}`}
          action={`/api/admin/inventory/${item.id}`}
          method="post"
        />
        {removable ? (
          <form
            id={`delete-${item.id}`}
            action={`/api/admin/inventory/${item.id}`}
            method="post"
          >
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="redirectTo" value="/admin/inventory" />
          </form>
        ) : null}
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-[color:var(--admin-subtle)]">{item.id}</p>
      </td>
      <td>
        <input
          form={`save-${item.id}`}
          type="number"
          name="stock"
          min={0}
          defaultValue={stock}
          required
          className="admin-input admin-input-compact"
        />
      </td>
      <td>
        <input
          form={`save-${item.id}`}
          type="number"
          name="lowStockThreshold"
          min={0}
          defaultValue={threshold}
          required
          className="admin-input admin-input-compact"
        />
      </td>
      <td className="text-xs text-[color:var(--admin-muted)]">
        {notes.length > 0 ? notes.join(" · ") : "—"}
      </td>
      <td className="text-right">
        <div className="flex justify-end gap-2">
          <button form={`save-${item.id}`} type="submit" className="btn-primary">
            Save
          </button>
          {removable ? (
            <button
              form={`delete-${item.id}`}
              type="submit"
              className="rounded-md px-2 py-1.5 text-xs font-medium text-[color:var(--admin-danger-fg)] hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
