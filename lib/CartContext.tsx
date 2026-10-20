"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { CartItem } from "@/types";

export const CART_STORAGE_KEY = "happycamera_cart";
const CART_VERSION = 2;

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  lastAddedId: number;
  hydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      (parsed as { v?: unknown }).v === CART_VERSION &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: CartItem[] }).items;
    }
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ v: CART_VERSION, items })
    );
  } catch { }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
  (i) =>
    i.productId === item.productId &&
    i.variantId === item.variantId
);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId &&
i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setLastAddedId((n) => n + 1);
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
  setItems((prev) =>
    prev.filter(
      (i) =>
        !(i.productId === productId && i.variantId === variantId)
    )
  );
}, []);

  const updateQuantity = useCallback(
  (productId: string, quantity: number, variantId?: string) => {
    setItems((prev) => {
      if (quantity < 1) {
        return prev.filter(
          (i) =>
            !(i.productId === productId && i.variantId === variantId)
        );
      }

      return prev.map((i) => {
        if (i.productId !== productId || i.variantId !== variantId) {
          return i;
        }

        const clamped =
          i.stockQuantity !== undefined
            ? Math.min(i.stockQuantity, quantity)
            : quantity;

        return { ...i, quantity: clamped };
      });
    });
  },
  []
);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isOpen,
      lastAddedId,
      hydrated,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [items, isOpen, lastAddedId, hydrated, openCart, closeCart, addToCart, removeFromCart, updateQuantity, clearCart]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
