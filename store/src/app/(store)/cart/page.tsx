"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import {
  FLAT_SHIPPING,
  FREE_SHIPPING_THRESHOLD,
  formatPrice,
} from "@/lib/products";

export default function CartPage() {
  const { lines, subtotal, setQuantity, removeItem, hydrated } = useCart();
  const shipping =
    subtotal === 0
      ? 0
      : subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : FLAT_SHIPPING;
  const total = subtotal + shipping;

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8 md:pt-32">
        <p className="text-ink/60">Loading cart…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-28 md:px-8 md:pb-28 md:pt-32">
      <h1 className="font-display text-4xl text-ink md:text-6xl">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-10 max-w-lg">
          <p className="text-ink/70">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex bg-moss px-6 py-3.5 text-sm font-medium text-mist transition hover:bg-moss-deep"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            {lines.map(({ product, quantity, lineTotal }) => (
              <div
                key={product.id}
                className="grid grid-cols-[96px_1fr] gap-4 border-b border-moss/10 pb-6 sm:grid-cols-[120px_1fr_auto]"
              >
                <div className="relative aspect-square overflow-hidden bg-sage/15">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-display text-xl text-ink hover:underline"
                  >
                    {product.name}
                  </Link>
                </div>
                <div className="col-span-2 flex flex-col items-end justify-center gap-3 sm:col-span-1 sm:col-start-3">
                  <p className="text-right text-ink">{formatPrice(lineTotal)}</p>
                  <div className="flex items-center gap-3">
                    <label className="text-xs uppercase tracking-wider text-ink/50">
                      Qty
                      <select
                        className="ml-2 border border-moss/20 bg-white/70 px-2 py-1 text-sm text-ink"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(product.id, Number(e.target.value))
                        }
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-ink/50 hover:text-ink"
                      onClick={() => removeItem(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit border border-moss/15 bg-stone/70 p-6">
            <h2 className="font-display text-2xl text-ink">Summary</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-ink/70">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD ? (
                <p className="text-xs text-ink/50">
                  Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for
                  free shipping.
                </p>
              ) : null}
              <div className="flex justify-between border-t border-moss/10 pt-3 text-base text-ink">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 flex w-full items-center justify-center bg-moss py-3.5 text-sm font-medium text-mist transition hover:bg-moss-deep"
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
