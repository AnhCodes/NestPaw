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
  storefrontProductId?: string;
};

export const inventorySectionLabels: Record<InventorySection, string> = {
  "store-products": "Store products",
  treats: "Dog treats",
  "printed-materials": "Printed materials",
  "shipping-supplies": "Shipping supplies",
};

export const inventoryCatalog: InventoryCatalogItem[] = [
  ...products.map((product) => ({
    id: product.id,
    name: product.name,
    section: "store-products" as const,
    lowStockThreshold: 3,
    storefrontProductId: product.id,
  })),
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
