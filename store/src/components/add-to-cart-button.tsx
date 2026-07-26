"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { isInStock, products } from "@/lib/products";

export function AddToCartButton({
  productId,
  label = "Add to cart",
}: {
  productId: string;
  label?: string;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const product = products.find((p) => p.id === productId);
  const available = product ? isInStock(product) : false;

  if (!available) {
    return (
      <button
        type="button"
        disabled
        className="btn-primary min-w-[11rem] cursor-not-allowed opacity-45"
      >
        Out of stock
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn-primary min-w-[11rem]"
      onClick={() => {
        addItem(productId);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
    >
      {added ? "Added ✓" : label}
    </button>
  );
}
