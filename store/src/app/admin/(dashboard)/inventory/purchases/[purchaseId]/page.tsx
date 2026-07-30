import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseLogForm } from "@/components/purchase-log-form";
import { getInventoryPurchaseById } from "@/lib/orders";

export default async function EditInventoryPurchasePage({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) {
  const { purchaseId } = await params;
  const purchase = await getInventoryPurchaseById(purchaseId);
  if (!purchase) notFound();

  return (
    <div>
      <Link
        href="/admin/inventory"
        className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] hover:text-[color:var(--admin-fg)]"
      >
        ← Inventory
      </Link>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em]">
        Edit purchase
      </h1>
      <p className="mt-2 max-w-2xl text-[color:var(--admin-muted)]">
        Correct vendor, notes, quantities, or prices. Stocked items will adjust
        admin inventory to match the updated log.
      </p>

      <PurchaseLogForm
        initial={{
          purchaseId: purchase.id,
          vendor: purchase.vendor,
          notes: purchase.notes ?? "",
          items: purchase.items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            lineCostCents: item.lineCostCents,
          })),
        }}
      />
    </div>
  );
}
