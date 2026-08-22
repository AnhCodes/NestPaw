"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ShipOrderButton({
  orderId,
  trackingNumber,
}: {
  orderId: string;
  trackingNumber: string;
}) {
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
            aria-labelledby="ship-order-title"
          >
            <button
              type="button"
              aria-label="Close ship order"
              className="absolute inset-0 bg-black/45"
              onClick={() => setOpen(false)}
            />
            <form
              action={`/api/admin/orders/${orderId}`}
              method="post"
              className="relative w-full max-w-md rounded-2xl border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl"
            >
              <input type="hidden" name="intent" value="fulfillment" />
              <input type="hidden" name="fulfillmentStatus" value="shipped" />
              <input type="hidden" name="redirectTo" value="/admin/orders" />
              <h2
                id="ship-order-title"
                className="text-lg font-semibold text-[color:var(--admin-fg)]"
              >
                Ship order
              </h2>
              <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
                Matching tracking numbers email the customer a USPS link.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Tracking number
                  <input
                    name="trackingNumber"
                    required
                    autoFocus
                    defaultValue={trackingNumber}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="USPS tracking"
                    className="admin-input"
                  />
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Confirm tracking
                  <input
                    name="trackingNumberConfirm"
                    required
                    defaultValue={trackingNumber}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Re-type to confirm"
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
                  Mark shipped
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
        className="relative z-10 btn-primary"
        onClick={() => setOpen(true)}
      >
        Mark shipped
      </button>
      {modal}
    </>
  );
}
