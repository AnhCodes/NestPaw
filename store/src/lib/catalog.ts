import { products, type Product } from "@/lib/products";
import { getStockMap, type StockMap } from "@/lib/inventory";

export function applyStock(product: Product, stock: number): Product {
  return { ...product, stock };
}

export function applyStockMap(catalog: Product[], stockById: StockMap): Product[] {
  return catalog.map((product) =>
    applyStock(product, stockById[product.id] ?? 0),
  );
}

export async function getProductsWithStock(): Promise<Product[]> {
  const stockById = await getStockMap();
  return applyStockMap(products, stockById);
}

export async function getProductWithStock(
  slug: string,
): Promise<Product | undefined> {
  const product = products.find((p) => p.slug === slug);
  if (!product) return undefined;
  const stockById = await getStockMap();
  return applyStock(product, stockById[product.id] ?? 0);
}

export async function getProductByIdWithStock(
  id: string,
): Promise<Product | undefined> {
  const product = products.find((p) => p.id === id);
  if (!product) return undefined;
  const stockById = await getStockMap();
  return applyStock(product, stockById[product.id] ?? 0);
}
