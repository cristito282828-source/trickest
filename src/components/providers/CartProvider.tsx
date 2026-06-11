'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * CartProvider para los productos de Tory Skateshop
 *
 * Maneja el carrito en memoria del cliente (no persiste en DB hasta
 * que se confirma la orden). Sigue el mismo patrón que el
 * CartProvider de los proyectos mania-store y forza-sport-cali.
 *
 * Estructura de un item del carrito:
 * {
 *   productId: string
 *   productName: string
 *   productPrice: string  // "145.000" con el símbolo incluido
 *   productImage: string | null
 *   productSlug: string
 *   quantity: number
 * }
 */

export interface CartItem {
  productId: string;
  productName: string;
  productPrice: string;
  productImage: string | null;
  productSlug: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number; // Total de items (sumando cantidades)
  hasItems: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'trickest_orbital_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (error) {
      console.error('[CartProvider] Error reading from localStorage:', error);
    }
    setHydrated(true);
  }, []);

  // Persistir en localStorage cuando cambie
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('[CartProvider] Error writing to localStorage:', error);
    }
  }, [items, hydrated]);

  // Agregar item (o incrementar cantidad si ya existe)
  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        }
        return [...prev, { ...item, quantity }];
      });
    },
    []
  );

  // Eliminar item completamente
  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  // Actualizar cantidad (si es 0, eliminar)
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
  }, []);

  // Vaciar carrito
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Helpers
  const isInCart = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const getQuantity = useCallback(
    (productId: string) =>
      items.find((i) => i.productId === productId)?.quantity ?? 0,
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const hasItems = itemCount > 0;

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      hasItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getQuantity,
    }),
    [items, itemCount, hasItems, addItem, removeItem, updateQuantity, clearCart, isInCart, getQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
