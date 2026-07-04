"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

export interface CartItem {
  listingId: string;
  materialName: string;
  supplierName: string;
  supplierId: string;
  unitPrice: number;
  unit: string;
  quantity: number;
  availableStock: number;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (listingId: string) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.listingId === newItem.listingId);
      if (existing) {
        return prev.map(i =>
          i.listingId === newItem.listingId
            ? { ...i, quantity: Math.min(i.quantity + (newItem.quantity || 1), i.availableStock) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: newItem.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((listingId: string) => {
    setItems(prev => prev.filter(i => i.listingId !== listingId));
  }, []);

  const updateQuantity = useCallback((listingId: string, quantity: number) => {
    setItems(prev =>
      prev.map(i =>
        i.listingId === listingId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.availableStock)) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
