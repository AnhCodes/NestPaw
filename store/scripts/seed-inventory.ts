import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const { seedInventory } = await import("../src/lib/inventory");
  await seedInventory();
  console.log("Inventory seeded for products and operational supplies.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
