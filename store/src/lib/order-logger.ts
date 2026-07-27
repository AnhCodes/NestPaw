import { appendFileSync, mkdirSync } from "fs";
import path from "path";

export type LoggedOrderLineItem = {
  productId?: string;
  name: string;
  quantity: number;
  unitAmount?: number | null;
  lineAmount?: number | null;
};

export type LoggedOrder = {
  orderId: string; // checkout session id
  createdAt: string; // ISO timestamp
  eventType: string;

  status?: string | null;
  paymentStatus?: string | null;

  email?: string | null;
  currency?: string | null;
  amountTotal?: number | null;

  source?: string | null;
  fulfillment?: string | null;

  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: unknown;

  lineItems: LoggedOrderLineItem[];
};

const ORDER_LOG_DIR = path.join(process.cwd(), "order-logs");
const ORDER_LOG_PATH = path.join(ORDER_LOG_DIR, "orders.jsonl");

export function logOrder(order: LoggedOrder) {
  mkdirSync(ORDER_LOG_DIR, { recursive: true });
  appendFileSync(ORDER_LOG_PATH, `${JSON.stringify(order)}\n`, "utf8");
  // Useful during local dev + debugging in logs.
  console.log("[nestpaw][orders] logged", order.orderId, order.eventType);
}

