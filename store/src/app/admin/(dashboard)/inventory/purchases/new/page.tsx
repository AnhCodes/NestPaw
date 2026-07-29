import Link from "next/link";
import { inventoryCatalog, inventorySectionLabels } from "@/lib/inventory-catalog";

export default function NewInventoryPurchasePage() {
  const sections = [
    "store-products",
    "treats",
    "printed-materials",
    "shipping-supplies",
  ] as const;

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
        Record an Alibaba order with total spend and quantities by item.
      </p>

      <form
        action="/api/admin/inventory/purchases"
        method="post"
        className="mt-8 space-y-8"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            Vendor
            <input
              name="vendor"
              defaultValue="Alibaba"
              className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
            />
          </label>
          <label className="block text-sm">
            Total cost (USD)
            <input
              type="number"
              name="totalCost"
              min="0"
              step="0.01"
              required
              className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
            />
          </label>
        </div>

        <label className="block text-sm">
          Notes
          <textarea
            name="notes"
            rows={4}
            placeholder="Optional order notes, MOQ details, shipping notes, etc."
            className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-[color:var(--admin-fg)] outline-none placeholder:text-[color:var(--admin-subtle)] focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
          />
        </label>

        <div className="space-y-8">
          {sections.map((section) => {
            const items = inventoryCatalog.filter((item) => item.section === section);

            return (
              <section key={section}>
                <h2 className="font-display text-2xl font-semibold">
                  {inventorySectionLabels[section]}
                </h2>
                <div className="mt-4 space-y-3">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center justify-between gap-4 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-[color:var(--admin-subtle)]">{item.id}</p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        name={`qty:${item.id}`}
                        defaultValue="0"
                        className="w-28 border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-right text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                      />
                    </label>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            Save purchase log
          </button>
          <Link href="/admin/inventory" className="btn-dark-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
