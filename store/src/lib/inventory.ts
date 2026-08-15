import { createHash, randomUUID } from "crypto";
import { eq, isNotNull, sql } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import {
  getKitComponentIds,
  inventoryCatalog,
  inventorySectionOrder,
  isKitStorefrontProduct,
  sectionTracksStock,
  type InventoryCatalogItem,
  type InventorySection,
} from "@/lib/inventory-catalog";
import { inventory } from "@/lib/db/schema";
import { products } from "@/lib/products";

export type StockMap = Record<string, number>;

const inventorySections = new Set<InventorySection>(inventorySectionOrder);

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

export function isBuiltinCatalogItem(id: string) {
  return inventoryCatalog.some((item) => item.id === id);
}

export function slugifyInventoryId(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "item"
  );
}

function customRowToCatalogItem(row: {
  productId: string;
  name: string | null;
  section: string | null;
  lowStockThreshold: number;
  tracksStock: boolean;
}): InventoryCatalogItem | null {
  if (!row.name || !row.section) return null;
  if (!inventorySections.has(row.section as InventorySection)) return null;
  return {
    id: row.productId,
    name: row.name,
    section: row.section as InventorySection,
    lowStockThreshold: row.lowStockThreshold,
    tracksStock: row.tracksStock,
  };
}

export async function listHiddenInventoryIds(): Promise<Set<string>> {
  if (!isDatabaseConfigured()) return new Set();
  try {
    const db = getDb();
    const rows = await db
      .select({ productId: inventory.productId })
      .from(inventory)
      .where(eq(inventory.hidden, true));
    return new Set(rows.map((row) => row.productId));
  } catch (err) {
    console.error("[nestpaw][inventory] listHiddenInventoryIds failed", err);
    return new Set();
  }
}

export async function listCustomCatalogItems(): Promise<InventoryCatalogItem[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(inventory)
      .where(isNotNull(inventory.name));
    return rows
      .filter((row) => !isBuiltinCatalogItem(row.productId) && !row.hidden)
      .map(customRowToCatalogItem)
      .filter((item): item is InventoryCatalogItem => item != null);
  } catch (err) {
    console.error("[nestpaw][inventory] listCustomCatalogItems failed", err);
    return [];
  }
}

export async function getMergedInventoryCatalog(): Promise<
  InventoryCatalogItem[]
> {
  const [custom, hiddenIds] = await Promise.all([
    listCustomCatalogItems(),
    listHiddenInventoryIds(),
  ]);
  return [
    ...inventoryCatalog.filter((item) => !hiddenIds.has(item.id)),
    ...custom,
  ];
}

export async function resolveInventoryCatalogItem(id: string) {
  const builtin = inventoryCatalog.find((item) => item.id === id);
  if (builtin) return builtin;
  const custom = await listCustomCatalogItems();
  return custom.find((item) => item.id === id) ?? null;
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
        tracksStock: true,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  for (const product of products) {
    if (!isKitStorefrontProduct(product.id)) continue;
    await db
      .insert(inventory)
      .values({
        productId: product.id,
        stock: 0,
        storefrontStock: 0,
        lowStockThreshold: 3,
        tracksStock: true,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
}

export async function createCustomInventoryItem(input: {
  name: string;
  section: InventorySection;
  stock?: number;
  lowStockThreshold?: number;
  tracksStock?: boolean;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  if (!inventorySections.has(input.section)) {
    throw new Error("Invalid section");
  }

  const db = getDb();
  const baseId = slugifyInventoryId(name);
  let productId = baseId;
  let attempt = 0;
  while (true) {
    const builtin = isBuiltinCatalogItem(productId);
    const [existing] = await db
      .select({ productId: inventory.productId })
      .from(inventory)
      .where(eq(inventory.productId, productId))
      .limit(1);
    if (!builtin && !existing) break;
    attempt += 1;
    productId = `${baseId}-${attempt + 1}`;
    if (attempt > 20) {
      productId = `${baseId}-${randomUUID().slice(0, 8)}`;
      break;
    }
  }

  const stock = input.stock ?? 0;
  const lowStockThreshold = input.lowStockThreshold ?? 3;
  const tracksStock =
    sectionTracksStock(input.section) && input.tracksStock !== false;
  const now = new Date();

  await db.insert(inventory).values({
    productId,
    name,
    section: input.section,
    stock,
    storefrontStock: 0,
    lowStockThreshold,
    tracksStock,
    updatedAt: now,
  });

  return productId;
}

export function canRemoveInventoryItem(productId: string) {
  // The assembled kit is not a warehouse SKU — hide its virtual row only.
  if (isKitStorefrontProduct(productId)) return false;
  return true;
}

export async function removeInventoryItem(productId: string) {
  if (!canRemoveInventoryItem(productId)) {
    throw new Error("This inventory item cannot be removed");
  }

  const db = getDb();
  const now = new Date();

  // Custom admin-created items are deleted outright.
  if (!isBuiltinCatalogItem(productId)) {
    const [row] = await db
      .select()
      .from(inventory)
      .where(eq(inventory.productId, productId))
      .limit(1);
    if (!row || !row.name) {
      throw new Error("Inventory item not found");
    }
    await db.delete(inventory).where(eq(inventory.productId, productId));
    return;
  }

  // Built-in catalog items are soft-hidden so they leave admin lists.
  await db
    .insert(inventory)
    .values({
      productId,
      stock: 0,
      storefrontStock: 0,
      lowStockThreshold: 3,
      tracksStock: true,
      hidden: true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: inventory.productId,
      set: {
        hidden: true,
        updatedAt: now,
      },
    });
}

export async function deleteCustomInventoryItem(productId: string) {
  await removeInventoryItem(productId);
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
      tracksStock: true,
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
  const catalog = await getMergedInventoryCatalog();

  const storeItems = catalog.filter(
    (item) => item.section === "store-products" && item.tracksStock !== false,
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
        tracksStock: true,
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
  await applyAdminStockDeltas(
    items.map((item) => ({
      inventoryItemId: item.inventoryItemId,
      delta: item.quantity,
    })),
  );
}

/** Apply positive or negative admin stock deltas for purchase create/edit. */
export async function applyAdminStockDeltas(
  items: { inventoryItemId: string; delta: number }[],
) {
  const db = getDb();
  const now = new Date();
  const catalog = await getMergedInventoryCatalog();
  const byId = new Map(catalog.map((item) => [item.id, item]));

  for (const item of items) {
    const catalogItem = byId.get(item.inventoryItemId);
    if (!catalogItem || item.delta === 0) continue;
    if (catalogItem.tracksStock === false) continue;

    if (item.delta > 0) {
      await db
        .insert(inventory)
        .values({
          productId: item.inventoryItemId,
          name: isBuiltinCatalogItem(item.inventoryItemId)
            ? null
            : catalogItem.name,
          section: isBuiltinCatalogItem(item.inventoryItemId)
            ? null
            : catalogItem.section,
          stock: item.delta,
          storefrontStock: 0,
          lowStockThreshold: catalogItem.lowStockThreshold,
          tracksStock: catalogItem.tracksStock ?? true,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: inventory.productId,
          set: {
            stock: sql`${inventory.stock} + ${item.delta}`,
            updatedAt: now,
          },
        });
      continue;
    }

    await db
      .update(inventory)
      .set({
        stock: sql`GREATEST(0, ${inventory.stock} + ${item.delta})`,
        updatedAt: now,
      })
      .where(eq(inventory.productId, item.inventoryItemId));
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

/** Restore admin + storefront stock when a paid order is deleted. */
export async function restoreStockForItems(
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
          stock: sql`${inventory.stock} + ${item.quantity}`,
          storefrontStock: sql`${inventory.storefrontStock} + ${item.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.productId, inventoryItemId));
    }

    if (isKitStorefrontProduct(item.productId)) {
      await db
        .update(inventory)
        .set({
          stock: sql`${inventory.stock} + ${item.quantity}`,
          storefrontStock: sql`${inventory.storefrontStock} + ${item.quantity}`,
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
