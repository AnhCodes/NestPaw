import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
import { eq } from "drizzle-orm";

config({ path: resolve(process.cwd(), ".env.local") });

/** Stable id so re-running this script is idempotent. */
const SAMPLE_ORDER_ID = "cs_test_sample_local_order";

async function main() {
  const { getDb } = await import("../src/lib/db");
  const { customers, orderItems, orders } = await import("../src/lib/db/schema");
  const { newId, stableCustomerId } = await import("../src/lib/inventory");
  const { products } = await import("../src/lib/products");

  const db = getDb();
  const email = "local-test@shopnestpaw.com";
  const customerId = stableCustomerId(email);
  const now = new Date();

  const brush = products.find((p) => p.id === "shed-brush")!;
  const snuffle = products.find((p) => p.id === "snuffle-mat")!;
  const lineItems = [
    {
      productId: brush.id,
      name: brush.name,
      quantity: 1,
      unitAmount: Math.round(brush.price * 100),
    },
    {
      productId: snuffle.id,
      name: snuffle.name,
      quantity: 1,
      unitAmount: Math.round(snuffle.price * 100),
    },
  ];
  const amountTotal = lineItems.reduce(
    (sum, item) => sum + item.unitAmount * item.quantity,
    0,
  );

  await db
    .insert(customers)
    .values({
      id: customerId,
      email,
      name: "Local Test Customer",
      phone: "555-0100",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: customers.email,
      set: {
        name: "Local Test Customer",
        phone: "555-0100",
        updatedAt: now,
      },
    });

  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.id, SAMPLE_ORDER_ID))
    .limit(1);

  if (existing) {
    // Reset fulfillment fields so you can re-test the admin flow from scratch.
    await db
      .update(orders)
      .set({
        fulfillmentStatus: "unfulfilled",
        trackingNumber: null,
        returnStatus: "none",
        returnRequestedAt: null,
        returnNotes: null,
        updatedAt: now,
      })
      .where(eq(orders.id, SAMPLE_ORDER_ID));

    console.log(`Sample order already existed — reset to unfulfilled.`);
    console.log(`  Order ID: ${SAMPLE_ORDER_ID}`);
    console.log(`  Admin:    /admin/orders/${SAMPLE_ORDER_ID}`);
    return;
  }

  await db.insert(orders).values({
    id: SAMPLE_ORDER_ID,
    customerId,
    status: "complete",
    paymentStatus: "paid",
    currency: "usd",
    amountTotal,
    source: "seed",
    shippingName: "Local Test Customer",
    shippingPhone: "555-0100",
    shippingAddress: {
      line1: "123 Nest Lane",
      line2: "Apt 4",
      city: "Austin",
      state: "TX",
      postal_code: "78701",
      country: "US",
    },
    fulfillmentStatus: "unfulfilled",
    trackingNumber: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(orderItems).values(
    lineItems.map((item) => ({
      id: newId("oi"),
      orderId: SAMPLE_ORDER_ID,
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitAmount: item.unitAmount,
      lineAmount: item.unitAmount * item.quantity,
    })),
  );

  console.log("Sample order created for local fulfillment testing.");
  console.log(`  Order ID: ${SAMPLE_ORDER_ID}`);
  console.log(`  Customer: ${email}`);
  console.log(`  Total:    $${(amountTotal / 100).toFixed(2)}`);
  console.log(`  Admin:    /admin/orders/${SAMPLE_ORDER_ID}`);
  console.log(
    "  Tip: change fulfillment status / tracking in admin; re-run this script to reset.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
