import { products } from "@/lib/products";

export type InventorySection =
  | "store-products"
  | "treats"
  | "printed-materials"
  | "shipping-supplies"
  | "business-ops"
  | "tools-services";

export type InventoryCatalogItem = {
  id: string;
  name: string;
  section: InventorySection;
  lowStockThreshold: number;
  /** Sold storefront product this warehouse item belongs to (kits can share one). */
  storefrontProductId?: string;
  /**
   * When false, purchase logs count toward spend only and do not change admin stock.
   * Use for one-off tools, ads, software, and other business expenses.
   */
  tracksStock?: boolean;
  /**
   * When false, this item is not offered on the purchase log form.
   * Use for processors like Stripe whose cost is a checkout fee, not a buy.
   */
  logPurchases?: boolean;
};

export const inventorySectionOrder: InventorySection[] = [
  "store-products",
  "treats",
  "printed-materials",
  "shipping-supplies",
  "business-ops",
  "tools-services",
];

export const inventorySectionLabels: Record<InventorySection, string> = {
  "store-products": "Store products",
  treats: "Dog treats",
  "printed-materials": "Printed materials",
  "shipping-supplies": "Shipping supplies",
  "business-ops": "Business & equipment",
  "tools-services": "Tools and Services",
};

export const purchaseVendors = [
  "Alibaba",
  "Amazon",
  "Print shop",
  "Higgsfield",
  "Other",
] as const;

export type PurchaseVendor = (typeof purchaseVendors)[number];

export function sectionTracksStock(section: InventorySection) {
  return section !== "tools-services";
}

/** Storefront kits assembled from multiple warehouse items. */
export const kitAssemblies: Record<string, string[]> = {
  "shed-brush": ["deshedding-brush", "grooming-glove"],
};

const kitComponentIds = new Set(Object.values(kitAssemblies).flat());

const storeProductItems: InventoryCatalogItem[] = [
  {
    id: "deshedding-brush",
    name: "Deshedding brush",
    section: "store-products",
    lowStockThreshold: 3,
    storefrontProductId: "shed-brush",
  },
  {
    id: "grooming-glove",
    name: "Grooming glove",
    section: "store-products",
    lowStockThreshold: 3,
    storefrontProductId: "shed-brush",
  },
  ...products
    .filter((product) => product.id !== "shed-brush")
    .filter((product) => !kitComponentIds.has(product.id))
    .map((product) => ({
      id: product.id,
      name: product.name,
      section: "store-products" as const,
      lowStockThreshold: 3,
      storefrontProductId: product.id,
    })),
];

export const inventoryCatalog: InventoryCatalogItem[] = [
  ...storeProductItems,
  {
    id: "treat-single-pack",
    name: "Single packaged dog treat",
    section: "treats",
    lowStockThreshold: 25,
  },
  {
    id: "treat-packaging",
    name: "Dog treat packaging",
    section: "treats",
    lowStockThreshold: 25,
  },
  {
    id: "printed-calm-cards",
    name: "Printed calm tips cards",
    section: "printed-materials",
    lowStockThreshold: 25,
  },
  {
    id: "shipping-boxes",
    name: "Shipping boxes",
    section: "shipping-supplies",
    lowStockThreshold: 20,
  },
  {
    id: "packing-tape",
    name: "Packing tape",
    section: "shipping-supplies",
    lowStockThreshold: 10,
  },
  {
    id: "packing-paper",
    name: "Packing paper / filler",
    section: "shipping-supplies",
    lowStockThreshold: 20,
  },
  {
    id: "poly-mailers",
    name: "Poly mailers",
    section: "shipping-supplies",
    lowStockThreshold: 25,
  },
  {
    id: "label-printer",
    name: "Label printer",
    section: "business-ops",
    lowStockThreshold: 0,
  },
  {
    id: "thermal-shipping-labels",
    name: "Thermal shipping labels",
    section: "business-ops",
    lowStockThreshold: 1,
  },
  {
    id: "shipping-scale",
    name: "Shipping scale",
    section: "business-ops",
    lowStockThreshold: 0,
  },
  {
    id: "office-supplies",
    name: "Office / packing desk supplies",
    section: "business-ops",
    lowStockThreshold: 1,
  },
  {
    id: "marketing-ads",
    name: "Marketing / ads spend",
    section: "business-ops",
    lowStockThreshold: 0,
    tracksStock: false,
  },
  {
    id: "other-business-purchase",
    name: "Other business purchase",
    section: "business-ops",
    lowStockThreshold: 0,
    tracksStock: false,
  },
  {
    id: "stripe",
    name: "Stripe",
    section: "tools-services",
    lowStockThreshold: 0,
    tracksStock: false,
    logPurchases: false,
  },
  {
    id: "higgsfield",
    name: "Higgsfield",
    section: "tools-services",
    lowStockThreshold: 0,
    tracksStock: false,
  },
  {
    id: "software-tools",
    name: "Other software / tools",
    section: "tools-services",
    lowStockThreshold: 0,
    tracksStock: false,
  },
];

export function catalogItemTracksStock(item: InventoryCatalogItem) {
  return item.tracksStock !== false;
}

export function catalogItemLogsPurchases(item: InventoryCatalogItem) {
  return item.logPurchases !== false;
}

export function getInventoryCatalogItem(id: string) {
  return inventoryCatalog.find((item) => item.id === id);
}

export function getKitComponentIds(storefrontProductId: string) {
  return kitAssemblies[storefrontProductId] ?? null;
}

export function isKitStorefrontProduct(productId: string) {
  return Boolean(kitAssemblies[productId]);
}
