import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine } from '@/types';

/**
 * Estado del carrito (CLIENT STATE -> Zustand).
 * TanStack Query NUNCA administra este estado (ADR A.1).
 * Se persiste en localStorage para conservarse entre sesiones (ADR B.4).
 * Ver 02_PROJECT_ARCHITECTURE.md §8.9.
 */

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  addLine: (productId: string, quantity?: number) => void;
  removeLine: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      addLine: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find((l) => l.productId === productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l,
              ),
            };
          }
          return { lines: [...state.lines, { productId, quantity }] };
        }),

      removeLine: (productId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.productId !== productId)
              : state.lines.map((l) =>
                  l.productId === productId ? { ...l, quantity } : l,
                ),
        })),

      clear: () => set({ lines: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    { name: 'kiva-cart' },
  ),
);

export const selectCartCount = (state: CartState) =>
  state.lines.reduce((acc, l) => acc + l.quantity, 0);
