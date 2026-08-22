"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/cart-provider";
import {
  FLAT_SHIPPING,
  FREE_SHIPPING_THRESHOLD,
  formatPrice,
} from "@/lib/products";
import { startStripeCheckout } from "@/lib/start-checkout";

export default function CheckoutPage() {
  const { lines, subtotal, hydrated, items } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : FLAT_SHIPPING;
  const total = subtotal + shipping;
  const allInStock = lines.every(({ product }) => product.stock > 0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { url, error: checkoutError } = await startStripeCheckout(
      items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    );
    if (!url) {
      setError(checkoutError || "Checkout failed. Please try again.");
      setLoading(false);
      return;
    }
    window.location.assign(url);
  }

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-12 md:px-8 md:pt-16">
        <p className="text-ink/60">Loading checkout…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-12 md:px-8 md:pt-16">
        <h1 className="font-display text-4xl font-semibold text-ink">
          Checkout
        </h1>
        <p className="mt-4 text-ink-soft">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-16">
      <h1 className="font-display text-4xl font-semibold text-ink md:text-6xl">
        Checkout
      </h1>
      {!allInStock ? (
        <p className="mt-6 rounded-xl border border-line bg-stone px-4 py-3 text-sm text-ink/70">
          One or more items are out of stock. Remove them from your cart before
          paying. Inventory updates when wholesale stock arrives.
        </p>
      ) : null}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="space-y-6">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !allInStock}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            {loading
              ? "Redirecting to Stripe…"
              : `Pay with Stripe · ${formatPrice(total)}`}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Order
          </h2>
          <ul className="mt-6 space-y-3 text-sm">
            {lines.map(({ product, quantity, lineTotal }) => (
              <li key={product.id} className="flex justify-between gap-4">
                <span className="text-ink/75">
                  {product.name} × {quantity}
                  {product.stock <= 0 ? " (out of stock)" : ""}
                </span>
                <span>{formatPrice(lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-base text-ink">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
