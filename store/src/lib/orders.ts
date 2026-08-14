import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  customers,
  inventory,
  inventoryPurchaseItems,
  inventoryPurchases,
  orderItems,
  orders,
  type FulfillmentStatus,
  type ReturnStatus,
} from "@/lib/db/schema";
import {
  applyAdminStockDeltas,
  decrementStockForItems,
  incrementAdminStock,
  newId,
  restoreStockForItems,
  stableCustomerId,
} from "@/lib/inventory";
import {
  getMergedInventoryCatalog,
} from "@/lib/inventory";
import type { LoggedOrder } from "@/lib/order-logger";

export async function persistOrderFromStripe(order: LoggedOrder) {
  const db = getDb();
  const email = order.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Cannot persist order without customer email");
  }

  const customerId = stableCustomerId(email);
  const now = new Date();

  await db
    .insert(customers)
    .values({
      id: customerId,
      email,
      name: order.shippingName ?? null,
      phone: order.shippingPhone ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: customers.email,
      set: {
        ...(order.shippingName ? { name: order.shippingName } : {}),
        ...(order.shippingPhone ? { phone: order.shippingPhone } : {}),
        updatedAt: now,
      },
    });

  const [existing] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, order.orderId))
    .limit(1);

  if (existing) {
    await db
      .update(orders)
      .set({
        status: order.status ?? existing.status,
        paymentStatus: order.paymentStatus ?? existing.paymentStatus,
        updatedAt: now,
      })
      .where(eq(orders.id, order.orderId));
    return { created: false, orderId: order.orderId };
  }

  await db.insert(orders).values({
    id: order.orderId,
    customerId,
    status: order.status ?? null,
    paymentStatus: order.paymentStatus ?? null,
    currency: order.currency ?? null,
    amountTotal: order.amountTotal ?? null,
    source: order.source ?? null,
    shippingName: order.shippingName ?? null,
    shippingPhone: order.shippingPhone ?? null,
    shippingAddress: order.shippingAddress ?? null,
    fulfillmentStatus: "unfulfilled",
    createdAt: now,
    updatedAt: now,
  });

  const productLines = order.lineItems.filter(
    (item) => item.productId !== "shipping",
  );

  if (productLines.length > 0) {
    await db.insert(orderItems).values(
      productLines.map((item) => ({
        id: newId("oi"),
        orderId: order.orderId,
        productId: item.productId ?? null,
        name: item.name,
        quantity: item.quantity,
        unitAmount: item.unitAmount ?? null,
        lineAmount: item.lineAmount ?? null,
      })),
    );
  }

  if (order.paymentStatus === "paid") {
    await decrementStockForItems(productLines);
  }

  return { created: true, orderId: order.orderId };
}

export async function listOrders() {
  const db = getDb();
  return db
    .select({
      order: orders,
      customer: customers,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt));
}

export async function listOrdersWithItems() {
  const rows = await listOrders();
  if (rows.length === 0) return [];

  const db = getDb();
  const items = await db.select().from(orderItems);
  const byOrder = new Map<string, typeof items>();
  for (const item of items) {
    const list = byOrder.get(item.orderId) ?? [];
    list.push(item);
    byOrder.set(item.orderId, list);
  }

  return rows.map((row) => ({
    ...row,
    items: byOrder.get(row.order.id) ?? [],
  }));
}

export async function getOrderById(orderId: string) {
  const db = getDb();
  const row = await db
    .select({
      order: orders,
      customer: customers,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!row[0]) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...row[0], items };
}

export async function deleteOrder(orderId: string) {
  const existing = await getOrderById(orderId);
  if (!existing) throw new Error("Order not found");

  const db = getDb();
  if (existing.order.paymentStatus === "paid") {
    await restoreStockForItems(existing.items);
  }

  await db.delete(orders).where(eq(orders.id, orderId));

  const remaining = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.customerId, existing.customer.id))
    .limit(1);

  let customerDeleted = false;
  if (remaining.length === 0) {
    await db
      .delete(customers)
      .where(eq(customers.id, existing.customer.id));
    customerDeleted = true;
  }

  return {
    customerDeleted,
    customerId: existing.customer.id,
  };
}

export async function updateOrderFulfillment(
  orderId: string,
  fulfillmentStatus: FulfillmentStatus,
  trackingNumber?: string | null,
) {
  const db = getDb();
  await db
    .update(orders)
    .set({
      fulfillmentStatus,
      trackingNumber: trackingNumber === undefined ? undefined : trackingNumber,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

export async function updateOrderShippingDetails(
  orderId: string,
  input: {
    email: string;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  },
) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Email is required");
  }

  const [existing] = await db
    .select({
      customerId: orders.customerId,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!existing) {
    throw new Error("Order not found");
  }

  const now = new Date();
  const shippingName = input.shippingName.trim() || null;
  const shippingPhone = input.shippingPhone.trim() || null;
  const shippingAddress = {
    line1: input.shippingAddress.line1.trim(),
    line2: input.shippingAddress.line2.trim(),
    city: input.shippingAddress.city.trim(),
    state: input.shippingAddress.state.trim(),
    postal_code: input.shippingAddress.postal_code.trim(),
    country: input.shippingAddress.country.trim() || "US",
  };

  const [emailOwner] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  if (emailOwner && emailOwner.id !== existing.customerId) {
    throw new Error("Another customer already uses that email");
  }

  await db
    .update(customers)
    .set({
      email,
      name: shippingName,
      phone: shippingPhone,
      updatedAt: now,
    })
    .where(eq(customers.id, existing.customerId));

  await db
    .update(orders)
    .set({
      shippingName,
      shippingPhone,
      shippingAddress,
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));
}

export async function updateOrderReturn(
  orderId: string,
  returnStatus: ReturnStatus,
  returnNotes?: string | null,
) {
  const db = getDb();
  const normalizedNotes = returnNotes?.trim() || null;
  const [existing] = await db
    .select({
      returnRequestedAt: orders.returnRequestedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  await db
    .update(orders)
    .set({
      returnStatus,
      returnRequestedAt:
        returnStatus === "none"
          ? null
          : existing?.returnRequestedAt ?? new Date(),
      returnNotes: normalizedNotes,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));
}

export async function submitStorefrontReturnRequest(input: {
  orderId: string;
  name: string;
  email: string;
  message: string;
}) {
  const db = getDb();
  const normalizedEmail = input.email.trim().toLowerCase();
  const [row] = await db
    .select({
      order: orders,
      customer: customers,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, input.orderId))
    .limit(1);

  // Same client message for missing order vs email mismatch to avoid
  // order/email enumeration when an order id is known.
  const unverifiedError =
    "We couldn't verify that order number and email combination.";

  if (!row) {
    console.info("[returns] order not found");
    return {
      ok: false as const,
      error: unverifiedError,
    };
  }

  if (row.customer.email.trim().toLowerCase() !== normalizedEmail) {
    console.info("[returns] email mismatch for order");
    return {
      ok: false as const,
      error: unverifiedError,
    };
  }

  const entry = [
    `Storefront return request (${new Date().toISOString()})`,
    `Name: ${input.name.trim()}`,
    `Email: ${normalizedEmail}`,
    "",
    input.message.trim(),
  ].join("\n");

  await db
    .update(orders)
    .set({
      returnStatus: "requested",
      returnRequestedAt: row.order.returnRequestedAt ?? new Date(),
      returnNotes: row.order.returnNotes
        ? `${row.order.returnNotes}\n\n---\n${entry}`
        : entry,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, input.orderId));

  return { ok: true as const };
}

export async function listCustomers() {
  const db = getDb();
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function getCustomerById(customerId: string) {
  const db = getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer) return null;

  const customerOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt));

  return { customer, orders: customerOrders };
}

export async function updateCustomer(
  customerId: string,
  input: {
    email: string;
    name: string;
    phone: string;
  },
) {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!existing) throw new Error("Customer not found");

  const [emailOwner] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);
  if (emailOwner && emailOwner.id !== customerId) {
    throw new Error("Another customer already uses that email");
  }

  const [row] = await db
    .update(customers)
    .set({
      email,
      name: input.name.trim() || null,
      phone: input.phone.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, customerId))
    .returning();
  return row;
}

export async function getRevenueSummary() {
  const db = getDb();
  const [row] = await db
    .select({
      orderCount: sql<number>`count(*)::int`,
      revenueCents: sql<number>`coalesce(sum(${orders.amountTotal}), 0)::int`,
    })
    .from(orders)
    .where(eq(orders.paymentStatus, "paid"));

  const orderCount = row?.orderCount ?? 0;
  const revenueCents = row?.revenueCents ?? 0;
  const averageOrderValueCents =
    orderCount > 0 ? Math.round(revenueCents / orderCount) : 0;

  return { orderCount, revenueCents, averageOrderValueCents };
}

export async function getPurchaseSpendSummary() {
  const db = getDb();
  const [purchaseCountRow] = await db
    .select({
      purchaseCount: sql<number>`count(*)::int`,
    })
    .from(inventoryPurchases);

  const lines = await db
    .select({
      inventoryItemId: inventoryPurchaseItems.inventoryItemId,
      lineCostCents: inventoryPurchaseItems.lineCostCents,
      vendor: inventoryPurchases.vendor,
    })
    .from(inventoryPurchaseItems)
    .innerJoin(
      inventoryPurchases,
      eq(inventoryPurchaseItems.purchaseId, inventoryPurchases.id),
    );

  let inventorySpendCents = 0;
  let alibabaInventorySpendCents = 0;
  let operationsSpendCents = 0;
  let inventoryLineCount = 0;
  let operationsLineCount = 0;
  const catalogById = new Map(
    (await getMergedInventoryCatalog()).map((item) => [item.id, item]),
  );

  for (const line of lines) {
    const catalogItem = catalogById.get(line.inventoryItemId);
    const section = catalogItem?.section;
    const isOperations =
      section === "shipping-supplies" || section === "business-ops";

    if (isOperations) {
      operationsSpendCents += line.lineCostCents;
      operationsLineCount += 1;
      continue;
    }

    inventorySpendCents += line.lineCostCents;
    inventoryLineCount += 1;
    if (line.vendor === "Alibaba") {
      alibabaInventorySpendCents += line.lineCostCents;
    }
  }

  return {
    purchaseCount: purchaseCountRow?.purchaseCount ?? 0,
    inventorySpendCents,
    alibabaInventorySpendCents,
    inventoryLineCount,
    operationsSpendCents,
    operationsLineCount,
  };
}

export async function listInventoryRows() {
  const db = getDb();
  return db.select().from(inventory).orderBy(asc(inventory.productId));
}

export async function createInventoryPurchase(input: {
  vendor: string;
  totalCostCents: number;
  notes?: string | null;
  items: { inventoryItemId: string; quantity: number; lineCostCents: number }[];
}) {
  const db = getDb();
  const purchaseId = newId("po");
  const now = new Date();

  await db.insert(inventoryPurchases).values({
    id: purchaseId,
    vendor: input.vendor,
    totalCostCents: input.totalCostCents,
    notes: input.notes ?? null,
    createdAt: now,
  });

  if (input.items.length > 0) {
    await db.insert(inventoryPurchaseItems).values(
      input.items.map((item) => ({
        id: newId("poi"),
        purchaseId,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        lineCostCents: item.lineCostCents,
      })),
    );
    await incrementAdminStock(input.items);
  }

  return purchaseId;
}

export async function getInventoryPurchaseById(purchaseId: string) {
  const db = getDb();
  const [purchase] = await db
    .select()
    .from(inventoryPurchases)
    .where(eq(inventoryPurchases.id, purchaseId))
    .limit(1);
  if (!purchase) return null;

  const items = await db
    .select()
    .from(inventoryPurchaseItems)
    .where(eq(inventoryPurchaseItems.purchaseId, purchaseId))
    .orderBy(asc(inventoryPurchaseItems.inventoryItemId));

  return { ...purchase, items };
}

export async function updateInventoryPurchase(
  purchaseId: string,
  input: {
    vendor: string;
    totalCostCents: number;
    notes?: string | null;
    items: { inventoryItemId: string; quantity: number; lineCostCents: number }[];
  },
) {
  const existing = await getInventoryPurchaseById(purchaseId);
  if (!existing) {
    throw new Error("Purchase not found");
  }

  const deltas = new Map<string, number>();
  for (const item of existing.items) {
    deltas.set(
      item.inventoryItemId,
      (deltas.get(item.inventoryItemId) ?? 0) - item.quantity,
    );
  }
  for (const item of input.items) {
    deltas.set(
      item.inventoryItemId,
      (deltas.get(item.inventoryItemId) ?? 0) + item.quantity,
    );
  }

  await applyAdminStockDeltas(
    [...deltas.entries()].map(([inventoryItemId, delta]) => ({
      inventoryItemId,
      delta,
    })),
  );

  const db = getDb();
  await db
    .update(inventoryPurchases)
    .set({
      vendor: input.vendor,
      totalCostCents: input.totalCostCents,
      notes: input.notes ?? null,
    })
    .where(eq(inventoryPurchases.id, purchaseId));

  await db
    .delete(inventoryPurchaseItems)
    .where(eq(inventoryPurchaseItems.purchaseId, purchaseId));

  if (input.items.length > 0) {
    await db.insert(inventoryPurchaseItems).values(
      input.items.map((item) => ({
        id: newId("poi"),
        purchaseId,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity,
        lineCostCents: item.lineCostCents,
      })),
    );
  }

  return purchaseId;
}

export async function listRecentInventoryPurchases(limit = 10) {
  return listInventoryPurchases(limit);
}

export async function listInventoryPurchases(limit?: number) {
  const db = getDb();
  const purchaseQuery = db
    .select()
    .from(inventoryPurchases)
    .orderBy(desc(inventoryPurchases.createdAt));

  const purchases =
    typeof limit === "number"
      ? await purchaseQuery.limit(limit)
      : await purchaseQuery;

  const items = await db
    .select()
    .from(inventoryPurchaseItems)
    .orderBy(asc(inventoryPurchaseItems.inventoryItemId));

  return purchases.map((purchase) => ({
    ...purchase,
    items: items.filter((item) => item.purchaseId === purchase.id),
  }));
}
