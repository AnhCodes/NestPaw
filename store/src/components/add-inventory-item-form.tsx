"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  inventorySectionLabels,
  inventorySectionOrder,
  sectionTracksStock,
  type InventorySection,
} from "@/lib/inventory-catalog";

export function InventoryPageActions() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<InventorySection>("store-products");
  const expenseOnly = !sectionTracksStock(section);

  function close() {
    setOpen(false);
    setSection("store-products");
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-item-title"
          >
            <button
              type="button"
              aria-label="Close add item"
              className="absolute inset-0 bg-black/45"
              onClick={close}
            />
            <form
              action="/api/admin/inventory"
              method="post"
              className="relative w-full max-w-md rounded-2xl border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl"
            >
              <input
                type="hidden"
                name="tracksStock"
                value={expenseOnly ? "false" : "true"}
              />
              <h2
                id="add-item-title"
                className="text-lg font-semibold text-[color:var(--admin-fg)]"
              >
                Add item
              </h2>
              <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
                Choose a section, then add it to inventory.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Name
                  <input
                    name="name"
                    required
                    autoFocus
                    placeholder="Name"
                    className="admin-input"
                  />
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Section
                  <select
                    name="section"
                    required
                    value={section}
                    onChange={(event) =>
                      setSection(event.target.value as InventorySection)
                    }
                    className="admin-input"
                  >
                    {inventorySectionOrder.map((option) => (
                      <option key={option} value={option}>
                        {inventorySectionLabels[option]}
                      </option>
                    ))}
                  </select>
                </label>
                {expenseOnly ? (
                  <p className="text-sm text-[color:var(--admin-muted)]">
                    Tools and services are logged as spend only. Use Log
                    purchase after adding.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm text-[color:var(--admin-fg)]">
                      Stock
                      <input
                        type="number"
                        name="stock"
                        min={0}
                        defaultValue={0}
                        required
                        className="admin-input"
                      />
                    </label>
                    <label className="block text-sm text-[color:var(--admin-fg)]">
                      Alert at
                      <input
                        type="number"
                        name="lowStockThreshold"
                        min={0}
                        defaultValue={3}
                        required
                        className="admin-input"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-dark-ghost"
                  onClick={close}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add
                </button>
              </div>
            </form>
          </div>,
          document.querySelector(".admin-app") ?? document.body,
        )
      : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-dark-ghost"
          onClick={() => setOpen(true)}
        >
          Add item
        </button>
        <Link href="/admin/inventory/purchases/new" className="btn-dark-ghost">
          Log purchase
        </Link>
        <form action="/api/admin/inventory/sync" method="post">
          <button type="submit" className="btn-primary">
            Sync to storefront
          </button>
        </form>
      </div>
      {modal}
    </div>
  );
}
