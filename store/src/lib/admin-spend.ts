import { getMergedInventoryCatalog } from "@/lib/inventory";
import {
  inventorySectionLabels,
  inventorySectionOrder,
} from "@/lib/inventory-catalog";
import {
  getPurchaseSpendSummary,
  getReturnSummary,
  getRevenueSummary,
  listInventoryPurchases,
} from "@/lib/orders";
import type { ReturnStatus } from "@/lib/db/schema";

export type SpendSlice = {
  id: string;
  label: string;
  cents: number;
  color: string;
};

export type SpendingCategoryRow = {
  id: string;
  label: string;
  cents: number;
  color: string;
};

export type SpendingVendorRow = {
  vendor: string;
  cents: number;
  color: string;
};

export type SpendingItemRow = {
  id: string;
  name: string;
  section: string;
  cents: number;
};

export type SpendingPurchaseRow = {
  id: string;
  vendor: string;
  totalCostCents: number;
  createdAt: Date;
  notes: string | null;
  itemNames: string[];
};

export type SpendingReturnRow = {
  id: string;
  email: string;
  amountCents: number;
  status: ReturnStatus;
  statusLabel: string;
  date: Date;
};

export const returnStatusLabels: Record<ReturnStatus, string> = {
  none: "None",
  requested: "Requested",
  reviewing: "Reviewing",
  denied: "Denied",
  approved: "Approved",
  received: "Received",
  closed: "Closed",
};

export type SpendingReport = {
  generatedAt: Date;
  totalSpendCents: number;
  inventorySpendCents: number;
  operationsSpendCents: number;
  purchaseCount: number;
  inventoryLineCount: number;
  operationsLineCount: number;
  orderCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
  returnCount: number;
  openReturnCount: number;
  closedReturnCount: number;
  deniedReturnCount: number;
  returnCents: number;
  slices: SpendSlice[];
  categories: SpendingCategoryRow[];
  vendors: SpendingVendorRow[];
  vendorSum: number;
  items: SpendingItemRow[];
  purchases: SpendingPurchaseRow[];
  returns: SpendingReturnRow[];
};

export const spendColors = [
  "var(--admin-accent)",
  "color-mix(in oklab, var(--admin-accent) 70%, var(--admin-fg))",
  "color-mix(in oklab, var(--admin-accent) 48%, var(--admin-muted))",
  "color-mix(in oklab, var(--admin-warning-fg) 75%, var(--admin-accent))",
  "var(--admin-muted)",
  "color-mix(in oklab, var(--admin-accent) 30%, var(--admin-subtle))",
];

export function buildSpendSlices(
  bySection: Partial<Record<string, number>>,
): SpendSlice[] {
  const slices: SpendSlice[] = inventorySectionOrder
    .map((section, index) => ({
      id: section,
      label: inventorySectionLabels[section],
      cents: bySection[section] ?? 0,
      color: spendColors[index] ?? spendColors[0],
    }))
    .filter((slice) => slice.cents > 0);

  if ((bySection.other ?? 0) > 0) {
    slices.push({
      id: "other",
      label: "Other",
      cents: bySection.other ?? 0,
      color: "var(--admin-subtle)",
    });
  }

  return slices;
}

export async function getSpendingReport(): Promise<SpendingReport> {
  const [spend, purchases, catalog, revenue, returns] = await Promise.all([
    getPurchaseSpendSummary(),
    listInventoryPurchases(),
    getMergedInventoryCatalog(),
    getRevenueSummary(),
    getReturnSummary(),
  ]);

  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const totalSpendCents =
    spend.inventorySpendCents + spend.operationsSpendCents;
  const slices = buildSpendSlices(spend.bySection);

  const categories: SpendingCategoryRow[] = [
    ...inventorySectionOrder.map((section, index) => ({
      id: section,
      label: inventorySectionLabels[section],
      cents: spend.bySection[section] ?? 0,
      color: spendColors[index] ?? spendColors[0],
    })),
    ...(spend.bySection.other
      ? [
          {
            id: "other",
            label: "Other",
            cents: spend.bySection.other,
            color: "var(--admin-subtle)",
          },
        ]
      : []),
  ].sort((a, b) => b.cents - a.cents);

  const vendorTotals = new Map<string, number>();
  const itemTotals = new Map<string, SpendingItemRow>();

  const purchaseRows: SpendingPurchaseRow[] = purchases.map((purchase) => {
    vendorTotals.set(
      purchase.vendor,
      (vendorTotals.get(purchase.vendor) ?? 0) + purchase.totalCostCents,
    );

    const itemNames: string[] = [];
    for (const item of purchase.items) {
      const catalogItem = catalogById.get(item.inventoryItemId);
      const name = catalogItem?.name ?? item.inventoryItemId;
      itemNames.push(name);

      const prev = itemTotals.get(item.inventoryItemId);
      itemTotals.set(item.inventoryItemId, {
        id: item.inventoryItemId,
        name,
        section: catalogItem
          ? inventorySectionLabels[catalogItem.section]
          : "Other",
        cents: (prev?.cents ?? 0) + item.lineCostCents,
      });
    }

    return {
      id: purchase.id,
      vendor: purchase.vendor,
      totalCostCents: purchase.totalCostCents,
      createdAt: new Date(purchase.createdAt),
      notes: purchase.notes,
      itemNames,
    };
  });

  const vendors = [...vendorTotals.entries()]
    .map(([vendor, cents], index) => ({
      vendor,
      cents,
      color: spendColors[index] ?? spendColors[0],
    }))
    .sort((a, b) => b.cents - a.cents);

  return {
    generatedAt: new Date(),
    totalSpendCents,
    inventorySpendCents: spend.inventorySpendCents,
    operationsSpendCents: spend.operationsSpendCents,
    purchaseCount: spend.purchaseCount,
    inventoryLineCount: spend.inventoryLineCount,
    operationsLineCount: spend.operationsLineCount,
    slices,
    categories,
    vendors,
    vendorSum: vendors.reduce((sum, row) => sum + row.cents, 0),
    items: [...itemTotals.values()]
      .filter((row) => row.cents > 0)
      .sort((a, b) => b.cents - a.cents),
    purchases: purchaseRows,
    orderCount: revenue.orderCount,
    revenueCents: revenue.revenueCents,
    averageOrderValueCents: revenue.averageOrderValueCents,
    returnCount: returns.returnCount,
    openReturnCount: returns.openReturnCount,
    closedReturnCount: returns.closedReturnCount,
    deniedReturnCount: returns.deniedReturnCount,
    returnCents: returns.returnCents,
    returns: returns.orders.map((order) => ({
      id: order.id,
      email: order.email,
      amountCents: order.amountTotal ?? 0,
      status: order.returnStatus,
      statusLabel: returnStatusLabels[order.returnStatus],
      date: new Date(order.returnRequestedAt ?? order.createdAt),
    })),
  };
}
