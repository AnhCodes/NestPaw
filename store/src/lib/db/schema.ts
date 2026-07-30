import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const fulfillmentStatusEnum = pgEnum("fulfillment_status", [
  "unfulfilled",
  "packed",
  "shipped",
  "delivered",
]);

export const returnStatusEnum = pgEnum("return_status", [
  "none",
  "requested",
  "reviewing",
  "denied",
  "approved",
  "received",
  "closed",
]);

export const customers = pgTable(
  "customers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("customers_email_idx").on(table.email)],
);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // Stripe checkout session id
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  status: text("status"),
  paymentStatus: text("payment_status"),
  currency: text("currency"),
  amountTotal: integer("amount_total"), // cents
  source: text("source"),
  shippingName: text("shipping_name"),
  shippingPhone: text("shipping_phone"),
  shippingAddress: jsonb("shipping_address"),
  fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status")
    .notNull()
    .default("unfulfilled"),
  trackingNumber: text("tracking_number"),
  returnStatus: returnStatusEnum("return_status").notNull().default("none"),
  returnRequestedAt: timestamp("return_requested_at", { withTimezone: true }),
  returnNotes: text("return_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id"),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unitAmount: integer("unit_amount"), // cents
  lineAmount: integer("line_amount"), // cents
});

export const inventory = pgTable("inventory", {
  productId: text("product_id").primaryKey(),
  /** Warehouse / admin on-hand count. Edited in admin; updated by purchase logs. */
  stock: integer("stock").notNull().default(0),
  /** Published availability on the storefront. Only updates via explicit sync. */
  storefrontStock: integer("storefront_stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryPurchases = pgTable("inventory_purchases", {
  id: text("id").primaryKey(),
  vendor: text("vendor").notNull().default("Alibaba"),
  totalCostCents: integer("total_cost_cents").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryPurchaseItems = pgTable("inventory_purchase_items", {
  id: text("id").primaryKey(),
  purchaseId: text("purchase_id")
    .notNull()
    .references(() => inventoryPurchases.id, { onDelete: "cascade" }),
  inventoryItemId: text("inventory_item_id").notNull(),
  quantity: integer("quantity").notNull(),
  lineCostCents: integer("line_cost_cents").notNull().default(0),
});

export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type InventoryRow = typeof inventory.$inferSelect;
export type InventoryPurchase = typeof inventoryPurchases.$inferSelect;
export type InventoryPurchaseItem = typeof inventoryPurchaseItems.$inferSelect;
export type FulfillmentStatus = (typeof fulfillmentStatusEnum.enumValues)[number];
export type ReturnStatus = (typeof returnStatusEnum.enumValues)[number];
