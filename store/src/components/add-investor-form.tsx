"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function todayInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AddInvestorButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
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
            aria-labelledby="add-investor-title"
          >
            <button
              type="button"
              aria-label="Close add investor"
              className="absolute inset-0 bg-black/45"
              onClick={() => setOpen(false)}
            />
            <form
              action="/api/admin/investors"
              method="post"
              className="relative w-full max-w-md rounded-2xl border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl"
            >
              <h2
                id="add-investor-title"
                className="text-lg font-semibold text-[color:var(--admin-fg)]"
              >
                Add investor
              </h2>
              <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
                Name and amount are enough. Notes are optional.
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
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    Amount
                    <input
                      type="number"
                      name="amount"
                      min={0}
                      step="0.01"
                      required
                      placeholder="0.00"
                      className="admin-input"
                    />
                  </label>
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    Date
                    <input
                      type="date"
                      name="investedAt"
                      defaultValue={todayInputValue()}
                      required
                      className="admin-input"
                    />
                  </label>
                </div>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Notes
                  <input
                    name="notes"
                    placeholder="Optional"
                    className="admin-input"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-dark-ghost"
                  onClick={() => setOpen(false)}
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
    <>
      <button
        type="button"
        className="btn-dark-ghost"
        onClick={() => setOpen(true)}
      >
        Add investor
      </button>
      {modal}
    </>
  );
}
