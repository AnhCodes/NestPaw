"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  inventoryCatalog,
  inventorySectionLabels,
  type InventorySection,
} from "@/lib/inventory-catalog";
import { formatPrice } from "@/lib/products";

type PurchaseLine = {
  key: string;
  inventoryItemId: string;
  quantity: string;
  price: string;
};

const sections: InventorySection[] = [
  "store-products",
  "treats",
  "printed-materials",
  "shipping-supplies",
];

const vendors = ["Alibaba", "Amazon", "Print shop"] as const;
type Vendor = (typeof vendors)[number];

function newLine(): PurchaseLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    inventoryItemId: inventoryCatalog[0]?.id ?? "",
    quantity: "1",
    price: "",
  };
}

export function PurchaseLogForm() {
  const [vendor, setVendor] = useState<Vendor>("Alibaba");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const price = Number(line.price);
      return sum + (Number.isFinite(price) && price > 0 ? price : 0);
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
      const res = await fetch("/api/admin/inventory/purchases", {
        method: "POST",
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
            className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
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
          <p className="mt-2 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 font-semibold">
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
          placeholder="Optional order notes, MOQ details, shipping notes, etc."
          className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-3 text-[color:var(--admin-fg)] outline-none placeholder:text-[color:var(--admin-subtle)] focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
        />
      </label>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Items</h2>
            <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
              Add only what you bought on this order.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, newLine()])}
            className="btn-dark-ghost"
          >
            Add item
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line) => (
            <div
              key={line.key}
              className="grid gap-3 border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-4 md:grid-cols-[minmax(0,1.6fr)_120px_140px_auto] md:items-end"
            >
              <label className="block text-sm">
                Item
                <select
                  value={line.inventoryItemId}
                  onChange={(e) =>
                    updateLine(line.key, { inventoryItemId: e.target.value })
                  }
                  className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                >
                  {sections.map((section) => {
                    const items = inventoryCatalog.filter(
                      (item) => item.section === section,
                    );
                    return (
                      <optgroup key={section} label={inventorySectionLabels[section]}>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
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
                  className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
                />
              </label>

              <label className="block text-sm">
                Price (USD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.price}
                  onChange={(e) => updateLine(line.key, { price: e.target.value })}
                  required
                  placeholder="0.00"
                  className="mt-2 w-full border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[color:var(--admin-fg)] outline-none placeholder:text-[color:var(--admin-subtle)] focus:ring-2 focus:ring-[color:var(--admin-accent)]/30"
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
                className="h-fit border border-[color:var(--admin-border)] px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--admin-muted)] transition hover:text-[color:var(--admin-fg)]"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <p className="border border-[color:var(--admin-danger-border)] bg-[var(--admin-danger-bg)] px-4 py-3 text-sm text-[color:var(--admin-danger-fg)]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving..." : "Save purchase log"}
        </button>
        <Link
          href="/admin/inventory"
          className="inline-flex items-center justify-center border border-[color:var(--admin-border)] bg-[var(--admin-surface)] px-[1.4rem] py-[0.9rem] text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-[color:var(--admin-fg)] transition hover:bg-[var(--admin-hover)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
