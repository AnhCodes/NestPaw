"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type EditCustomerValues = {
  email: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function EditCustomerButton({
  orderId,
  customer,
}: {
  orderId: string;
  customer: EditCustomerValues;
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
            aria-labelledby="edit-customer-title"
          >
            <button
              type="button"
              aria-label="Close edit customer"
              className="absolute inset-0 bg-black/45"
              onClick={() => setOpen(false)}
            />
            <form
              action={`/api/admin/orders/${orderId}`}
              method="post"
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[color:var(--admin-border)] bg-[var(--admin-surface)] p-6 shadow-2xl"
            >
              <input type="hidden" name="intent" value="customer" />
              <input type="hidden" name="redirectTo" value="/admin/orders" />
              <h2
                id="edit-customer-title"
                className="text-lg font-semibold text-[color:var(--admin-fg)]"
              >
                Edit customer
              </h2>
              <p className="mt-1 text-sm text-[color:var(--admin-muted)]">
                Updates contact details and this order’s ship-to address.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    autoFocus
                    defaultValue={customer.email}
                    className="admin-input"
                  />
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Name
                  <input
                    name="shippingName"
                    defaultValue={customer.name}
                    className="admin-input"
                  />
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Phone
                  <input
                    name="shippingPhone"
                    defaultValue={customer.phone}
                    className="admin-input"
                  />
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Address line 1
                  <input
                    name="line1"
                    defaultValue={customer.line1}
                    className="admin-input"
                  />
                </label>
                <label className="block text-sm text-[color:var(--admin-fg)]">
                  Address line 2
                  <input
                    name="line2"
                    defaultValue={customer.line2}
                    className="admin-input"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    City
                    <input
                      name="city"
                      defaultValue={customer.city}
                      className="admin-input"
                    />
                  </label>
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    State
                    <input
                      name="state"
                      defaultValue={customer.state}
                      className="admin-input"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    Postal code
                    <input
                      name="postal_code"
                      defaultValue={customer.postalCode}
                      className="admin-input"
                    />
                  </label>
                  <label className="block text-sm text-[color:var(--admin-fg)]">
                    Country
                    <input
                      name="country"
                      defaultValue={customer.country || "US"}
                      className="admin-input"
                    />
                  </label>
                </div>
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
                  Save
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
        className="relative z-10 btn-dark-ghost"
        onClick={() => setOpen(true)}
      >
        Edit
      </button>
      {modal}
    </>
  );
}
