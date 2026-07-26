"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart-provider";

export function ClearCartOnSuccess() {
  const { clearCart, hydrated } = useCart();

  useEffect(() => {
    if (hydrated) clearCart();
  }, [hydrated, clearCart]);

  return null;
}
