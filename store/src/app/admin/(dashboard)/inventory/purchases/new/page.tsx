import Link from "next/link";
import { PurchaseLogForm } from "@/components/purchase-log-form";

export default function NewInventoryPurchasePage() {
  return (
    <div>
      <Link
        href="/admin/inventory"
        className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
      >
        ← Inventory
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em]">
        Log purchase
      </h1>
      <p className="mt-2 max-w-2xl text-[color:var(--admin-muted)]">
        Record product stock, packing supplies, and business buys (Amazon label
        printer, ads, software, and similar). Stocked items increase admin
        inventory; expense-only items are tracked for spend without changing
        warehouse counts.
      </p>

      <PurchaseLogForm />
    </div>
  );
}
