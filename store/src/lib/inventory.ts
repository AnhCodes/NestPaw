import { createHash, randomUUID } from "crypto";
import { and, eq, gt, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { inventoryCatalog } from "@/lib/inventory-catalog";
import { inventory } from "@/lib/db/schema";
import { products } from "@/lib/products";

export type StockMap = Record<string, number>;

export async function getStockMap(): Promise<StockMap> {
  const fallback = (): StockMap =>
    Object.fromEntries(products.map((p) => [p.id, p.stock]));

  if (!isDatabaseConfigured()) {
    return fallback();
  }

  try {
    const db = getDb();
    const rows = await db.select().from(inventory);
    const map: StockMap = Object.fromEntries(products.map((p) => [p.id, 0]));
    for (const row of rows) {
      map[row.productId] = row.stock;
    }
    return map;
  } catch (err) {
    console.error("[nestpaw][inventory] getStockMap failed", err);
    return fallback();
  }
}

export async function getStock(productId: string): Promise<number> {
  const map = await getStockMap();
  return map[productId] ?? 0;
}

export async function seedInventory() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is required to seed inventory");
  }

  const db = getDb();
  const now = new Date();
  for (const item of inventoryCatalog) {
    const product = products.find((p) => p.id === item.id);
    await db
      .insert(inventory)
      .values({
        productId: item.id,
        stock: product?.stock ?? 0,
        lowStockThreshold: item.lowStockThreshold,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
}

export async function updateStock(productId: string, stock: number) {
  const db = getDb();
  await db
    .insert(inventory)
    .values({
      productId,
      stock,
      lowStockThreshold: 3,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: inventory.productId,
      set: { stock, updatedAt: new Date() },
    });
}

export async function updateLowStockThreshold(
  productId: string,
  lowStockThreshold: number,
) {
  const db = getDb();
  await db
    .update(inventory)
    .set({ lowStockThreshold, updatedAt: new Date() })
    .where(eq(inventory.productId, productId));
}

/** Decrement stock for paid order lines. Idempotent if stock already low. */
export async function decrementStockForItems(
  items: { productId?: string | null; quantity: number }[],
) {
  const db = getDb();
  for (const item of items) {
    if (!item.productId || item.productId === "shipping") continue;
    await db
      .update(inventory)
      .set({
        stock: sql`GREATEST(0, ${inventory.stock} - ${item.quantity})`,
        updatedAt: new Date(),
      })
      .where(
        and(eq(inventory.productId, item.productId), gt(inventory.stock, 0)),
      );
  }
}

export function newId(prefix?: string) {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function stableCustomerId(email: string) {
  const hash = createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0, 24);
  return `cus_${hash}`;
}
