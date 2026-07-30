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
      <p className="mt-2 text-[color:var(--admin-muted)]">
        Add each item you bought with quantity and price. Admin stock increases
        automatically; storefront stock stays unchanged until you sync.
      </p>

      <PurchaseLogForm />
    </div>
  );
}
