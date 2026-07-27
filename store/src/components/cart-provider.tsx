"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { products, type Product } from "@/lib/products";

export type CartItem = {
  productId: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  lines: { product: Product; quantity: number; lineTotal: number }[];
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nestpaw-cart-v1";
const EMPTY_CART: CartItem[] = [];

let memoryCart: CartItem[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readCart(): CartItem[] {
  if (memoryCart) return memoryCart;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    memoryCart = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY_CART;
  } catch {
    memoryCart = EMPTY_CART;
  }
  return memoryCart;
}

function writeCart(items: CartItem[]) {
  memoryCart = items.length === 0 ? EMPTY_CART : items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / private mode */
  }
  emit();
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function subscribeHydration() {
  return () => {};
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readCart, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );

  const addItem = useCallback((productId: string, quantity = 1) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.stock <= 0) return;

    const prev = readCart();
    const existing = prev.find((i) => i.productId === productId);
    if (existing) {
      const nextQty = Math.min(product.stock, existing.quantity + quantity);
      writeCart(
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity: nextQty } : i,
        ),
      );
      return;
    }
    writeCart([
      ...prev,
      { productId, quantity: Math.min(product.stock, quantity) },
    ]);
  }, []);

  const removeItem = useCallback((productId: string) => {
    writeCart(readCart().filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    const max = product?.stock ?? 0;
    const prev = readCart();
    if (quantity <= 0 || max <= 0) {
      writeCart(prev.filter((i) => i.productId !== productId));
      return;
    }
    writeCart(
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(max, quantity) }
          : i,
      ),
    );
  }, []);

  const clearCart = useCallback(() => writeCart([]), []);

  const lines = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          product,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        };
      })
      .filter(Boolean) as {
      product: Product;
      quantity: number;
      lineTotal: number;
    }[];
  }, [items]);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotal, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      items,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      itemCount,
      subtotal,
      lines,
    }),
    [
      items,
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
      itemCount,
      subtotal,
      lines,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
