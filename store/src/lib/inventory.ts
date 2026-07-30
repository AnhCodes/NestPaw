import { createHash, randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import {
  getKitComponentIds,
  inventoryCatalog,
  isKitStorefrontProduct,
} from "@/lib/inventory-catalog";
import { inventory } from "@/lib/db/schema";
import { products } from "@/lib/products";

export type StockMap = Record<string, number>;

function stockById(
  rows: { productId: string; stock: number; storefrontStock: number }[],
) {
  return new Map(rows.map((row) => [row.productId, row]));
}

function kitPublishedStock(
  storefrontProductId: string,
  byId: Map<string, { stock: number; storefrontStock: number }>,
) {
  const components = getKitComponentIds(storefrontProductId);
  if (!components || components.length === 0) return 0;
  return Math.min(
    ...components.map((id) => byId.get(id)?.storefrontStock ?? 0),
  );
}

function kitAdminStock(
  storefrontProductId: string,
  byId: Map<string, { stock: number; storefrontStock: number }>,
) {
  const components = getKitComponentIds(storefrontProductId);
  if (!components || components.length === 0) return 0;
  return Math.min(...components.map((id) => byId.get(id)?.stock ?? 0));
}

export async function getStockMap(): Promise<StockMap> {
  const fallback = (): StockMap =>
    Object.fromEntries(products.map((p) => [p.id, p.stock]));

  if (!isDatabaseConfigured()) {
    return fallback();
  }

  try {
    const db = getDb();
    const rows = await db.select().from(inventory);
    const byId = stockById(rows);
    const map: StockMap = Object.fromEntries(products.map((p) => [p.id, 0]));

    for (const product of products) {
      if (isKitStorefrontProduct(product.id)) {
        // Kit sellable quantity is always the scarcer published component.
        map[product.id] = kitPublishedStock(product.id, byId);
      } else {
        map[product.id] = byId.get(product.id)?.storefrontStock ?? 0;
      }
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
    if (item.tracksStock === false) continue;
    await db
      .insert(inventory)
      .values({
        productId: item.id,
        stock: 0,
        storefrontStock: 0,
        lowStockThreshold: item.lowStockThreshold,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  // Keep a published snapshot row for kit storefront products.
  for (const product of products) {
    if (!isKitStorefrontProduct(product.id)) continue;
    await db
      .insert(inventory)
      .values({
        productId: product.id,
        stock: 0,
        storefrontStock: 0,
        lowStockThreshold: 3,
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
      storefrontStock: 0,
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

/** Copy admin warehouse stock → published storefront stock for store products. */
export async function syncStockToStorefront() {
  const db = getDb();
  const now = new Date();

  const storeItems = inventoryCatalog.filter(
    (item) => item.section === "store-products",
  );

  for (const item of storeItems) {
    await db
      .update(inventory)
      .set({
        storefrontStock: sql`${inventory.stock}`,
        updatedAt: now,
      })
      .where(eq(inventory.productId, item.id));
  }

  // Refresh kit snapshot rows from the scarcer component.
  const freshRows = await db.select().from(inventory);
  const freshById = stockById(freshRows);
  for (const product of products) {
    if (!isKitStorefrontProduct(product.id)) continue;
    const published = kitAdminStock(product.id, freshById);
    await db
      .insert(inventory)
      .values({
        productId: product.id,
        stock: published,
        storefrontStock: published,
        lowStockThreshold: 3,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: inventory.productId,
        set: {
          stock: published,
          storefrontStock: published,
          updatedAt: now,
        },
      });
  }

  return storeItems.length;
}

export async function incrementAdminStock(
  items: { inventoryItemId: string; quantity: number }[],
) {
  const db = getDb();
  const now = new Date();

  for (const item of items) {
    const catalogItem = inventoryCatalog.find(
      (row) => row.id === item.inventoryItemId,
    );
    if (!catalogItem || item.quantity <= 0) continue;
    if (catalogItem.tracksStock === false) continue;

    await db
      .insert(inventory)
      .values({
        productId: item.inventoryItemId,
        stock: item.quantity,
        storefrontStock: 0,
        lowStockThreshold: catalogItem.lowStockThreshold,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: inventory.productId,
        set: {
          stock: sql`${inventory.stock} + ${item.quantity}`,
          updatedAt: now,
        },
      });
  }
}

/** Decrement admin + storefront stock for paid order lines. */
export async function decrementStockForItems(
  items: { productId?: string | null; quantity: number }[],
) {
  const db = getDb();
  for (const item of items) {
    if (!item.productId || item.productId === "shipping") continue;

    const componentIds = getKitComponentIds(item.productId) ?? [item.productId];

    for (const inventoryItemId of componentIds) {
      await db
        .update(inventory)
        .set({
          stock: sql`GREATEST(0, ${inventory.stock} - ${item.quantity})`,
          storefrontStock: sql`GREATEST(0, ${inventory.storefrontStock} - ${item.quantity})`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.productId, inventoryItemId));
    }

    if (isKitStorefrontProduct(item.productId)) {
      await db
        .update(inventory)
        .set({
          stock: sql`GREATEST(0, ${inventory.stock} - ${item.quantity})`,
          storefrontStock: sql`GREATEST(0, ${inventory.storefrontStock} - ${item.quantity})`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.productId, item.productId));
    }
  }
}

export function newId(prefix?: string) {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function stableCustomerId(email: string) {
  const hash = createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 24);
  return `cus_${hash}`;
}
