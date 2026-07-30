import { products } from "@/lib/products";

export type InventorySection =
  | "store-products"
  | "treats"
  | "printed-materials"
  | "shipping-supplies";

export type InventoryCatalogItem = {
  id: string;
  name: string;
  section: InventorySection;
  lowStockThreshold: number;
  /** Sold storefront product this warehouse item belongs to (kits can share one). */
  storefrontProductId?: string;
};

export const inventorySectionLabels: Record<InventorySection, string> = {
  "store-products": "Store products",
  treats: "Dog treats",
  "printed-materials": "Printed materials",
  "shipping-supplies": "Shipping supplies",
};

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
];

export function getInventoryCatalogItem(id: string) {
  return inventoryCatalog.find((item) => item.id === id);
}

export function getKitComponentIds(storefrontProductId: string) {
  return kitAssemblies[storefrontProductId] ?? null;
}

export function isKitStorefrontProduct(productId: string) {
  return Boolean(kitAssemblies[productId]);
}
