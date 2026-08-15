import Link from "next/link";
import { PurchaseLogForm } from "@/components/purchase-log-form";
import { getMergedInventoryCatalog } from "@/lib/inventory";

export default async function NewInventoryPurchasePage() {
  const catalog = await getMergedInventoryCatalog();

  return (
    <div>
      <Link
        href="/admin/inventory"
        className="text-sm font-medium text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
      >
        ← Inventory
      </Link>
      <h1 className="mt-3 text-[1.65rem] font-semibold tracking-tight">
        Log purchase
      </h1>
      <p className="mt-2 max-w-2xl text-[color:var(--admin-muted)]">
        Record product stock, packing supplies, Higgsfield, and other
        business buys. Stocked items increase admin inventory; expense-only
        items are tracked for spend without changing warehouse counts.
      </p>

      <PurchaseLogForm catalog={catalog} />
    </div>
  );
}
