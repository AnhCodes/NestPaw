"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  catalogItemLogsPurchases,
  catalogItemTracksStock,
  inventorySectionLabels,
  inventorySectionOrder,
  purchaseVendors,
  type InventoryCatalogItem,
  type PurchaseVendor,
} from "@/lib/inventory-catalog";
import { formatPrice } from "@/lib/products";

type PurchaseLine = {
  key: string;
  inventoryItemId: string;
  quantity: string;
  price: string;
};

export type PurchaseLogFormInitial = {
  purchaseId: string;
  vendor: string;
  notes: string;
  items: {
    inventoryItemId: string;
    quantity: number;
    lineCostCents: number;
  }[];
};

const vendors = purchaseVendors;
type Vendor = PurchaseVendor;

function newLine(catalog: InventoryCatalogItem[]): PurchaseLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    inventoryItemId: catalog[0]?.id ?? "",
    quantity: "1",
    price: "",
  };
}

function toVendor(value: string): Vendor {
  return vendors.includes(value as Vendor) ? (value as Vendor) : "Other";
}

function linesFromInitial(
  catalog: InventoryCatalogItem[],
  initial?: PurchaseLogFormInitial,
): PurchaseLine[] {
  if (!initial || initial.items.length === 0) return [newLine(catalog)];
  return initial.items.map((item, index) => ({
    key: `existing-${index}-${item.inventoryItemId}`,
    inventoryItemId: item.inventoryItemId,
    quantity: String(item.quantity),
    price: (item.lineCostCents / 100).toFixed(2),
  }));
}

export function PurchaseLogForm({
  catalog,
  initial,
}: {
  catalog: InventoryCatalogItem[];
  initial?: PurchaseLogFormInitial;
}) {
  const isEdit = Boolean(initial?.purchaseId);
  const [vendor, setVendor] = useState<Vendor>(
    toVendor(initial?.vendor ?? "Amazon"),
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<PurchaseLine[]>(() =>
    linesFromInitial(catalog, initial),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const price = Number(line.price);
      return sum + (Number.isFinite(price) && price >= 0 ? price : 0);
    }, 0);
  }, [lines]);

  function updateLine(key: string, patch: Partial<PurchaseLine>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const items = lines
      .map((line) => ({
        inventoryItemId: line.inventoryItemId,
        quantity: Number(line.quantity),
        price: Number(line.price),
      }))
      .filter(
        (line) =>
          line.inventoryItemId &&
          Number.isInteger(line.quantity) &&
          line.quantity > 0 &&
          Number.isFinite(line.price) &&
          line.price >= 0,
      );

    if (items.length === 0) {
      setError("Add at least one item with quantity and price.");
      setSubmitting(false);
      return;
    }

    try {
      const url = isEdit
        ? `/api/admin/inventory/purchases/${initial!.purchaseId}`
        : "/api/admin/inventory/purchases";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor,
          notes,
          items,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(json?.error || "Unable to save purchase log.");
        setSubmitting(false);
        return;
      }

      window.location.href = "/admin/inventory";
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          Vendor
          <select
            value={vendor}
            onChange={(e) => setVendor(e.target.value as Vendor)}
            className="admin-input"
          >
            {vendors.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="block text-sm">
          Total cost
          <p className="admin-card mt-2 px-4 py-3 font-semibold">
            {formatPrice(total)}
          </p>
        </div>
      </div>

      <label className="block text-sm">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="What you bought, order ID, why you need it, etc. Helpful for Other business purchase."
          className="admin-input"
        />
      </label>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Items</h2>
            <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
              {isEdit
                ? "Fix quantities, prices, or items. Admin stock will adjust to match the corrected log."
                : "Log product stock, shipping supplies, Higgsfield, or other business buys. Expense-only items count toward spend without changing warehouse stock."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, newLine(catalog)])}
            className="btn-dark-ghost"
          >
            Add item
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line) => {
            const selected = catalog.find(
              (item) => item.id === line.inventoryItemId,
            );
            const expenseOnly = selected
              ? !catalogItemTracksStock(selected)
              : false;

            return (
              <div
                key={line.key}
                className="admin-card grid gap-3 p-4 md:grid-cols-[minmax(0,1.6fr)_120px_140px_auto] md:items-end"
              >
                <label className="block text-sm">
                  Item
                  <select
                    value={line.inventoryItemId}
                    onChange={(e) =>
                      updateLine(line.key, { inventoryItemId: e.target.value })
                    }
                    className="admin-input"
                  >
                    {inventorySectionOrder.map((section) => {
                      const items = catalog.filter(
                        (item) =>
                          item.section === section &&
                          catalogItemLogsPurchases(item),
                      );
                      if (items.length === 0) return null;
                      return (
                        <optgroup
                          key={section}
                          label={inventorySectionLabels[section]}
                        >
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                              {catalogItemTracksStock(item)
                                ? ""
                                : " (expense only)"}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  {expenseOnly ? (
                    <span className="mt-2 block text-xs text-[color:var(--admin-subtle)]">
                      Logged for spend tracking only. Does not change admin stock.
                    </span>
                  ) : null}
                </label>

                <label className="block text-sm">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.key, { quantity: e.target.value })
                    }
                    required
                    className="admin-input"
                  />
                </label>

                <label className="block text-sm">
                  Price (USD)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.price}
                    onChange={(e) =>
                      updateLine(line.key, { price: e.target.value })
                    }
                    required
                    placeholder="0.00"
                    className="admin-input"
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setLines((current) =>
                      current.length === 1
                        ? current
                        : current.filter((entry) => entry.key !== line.key),
                    )
                  }
                  className="h-fit rounded-md border border-[color:var(--admin-border)] px-3 py-2 text-xs font-semibold text-[color:var(--admin-muted)] transition hover:text-[color:var(--admin-fg)]"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {error ? (
        <p className="admin-notice admin-notice-danger">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting
            ? "Saving..."
            : isEdit
              ? "Save changes"
              : "Save purchase log"}
        </button>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center justify-center rounded-lg border border-[color:var(--admin-border)] bg-[var(--admin-surface)] px-4 py-2.5 text-sm font-semibold text-[color:var(--admin-fg)] transition hover:bg-[var(--admin-hover)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
