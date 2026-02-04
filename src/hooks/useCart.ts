"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, color: string, size: string) => void;
  updateQuantity: (
    id: string,
    color: string,
    size: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (newItem) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.id === newItem.id &&
              item.color === newItem.color &&
              item.size === newItem.size
          );

          if (existingIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += newItem.quantity;
            return { items: updatedItems, isOpen: true };
          }

          return { items: [...state.items, newItem], isOpen: true };
        }),

      removeItem: (id, color, size) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.id === id && item.color === color && item.size === size)
          ),
        })),

      updateQuantity: (id, color, size, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.color === color && item.size === size
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "bella-forma-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCart;
