"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * CartContext.jsx
 * - Endpoints usados:
 *   GET  /api/cart      -> { cart: null | { id, userId, items: [...] } }
 *   POST /api/cart      -> { cart }
 *   DELETE /api/cart    -> { success: true }
 *
 * Ajusta los nombres de campos si tu esquema difiere.
 */

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]); // { id?, productId, storeId, name, price, quantity, ... }
  const [loading, setLoading] = useState(false);
  const [persisting, setPersisting] = useState(false);

  // --- Helpers ---
  const validateItemShape = (it) => {
    return (
      it &&
      (typeof it.productId === "string" || typeof it.productId === "number") &&
      (typeof it.storeId === "string" || typeof it.storeId === "number") &&
      typeof it.quantity === "number" &&
      it.quantity > 0 &&
      typeof it.price !== "undefined"
    );
  };

  const saveLocal = (items) => {
    try {
      localStorage.setItem("mi_tienda_cart", JSON.stringify(items));
    } catch (e) {
      console.warn("No se pudo guardar carrito en localStorage", e);
    }
  };

  const loadLocal = () => {
    try {
      const raw = localStorage.getItem("mi_tienda_cart");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("Error leyendo carrito local", e);
      return [];
    }
  };

  // --- API calls ---
  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { method: "GET" });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("GET /api/cart failed:", res.status, text);
        // fallback a localStorage
        const local = loadLocal();
        setCartItems(local);
        return { cart: null, fallback: true };
      }
      const data = await res.json();
      const items = (data?.cart?.items || []).map((it) => ({
        id: it.id,
        productId: it.productId,
        storeId: it.storeId,
        name: it.product?.title || it.name || "",
        price: it.price,
        quantity: it.quantity,
      }));
      setCartItems(items);
      saveLocal(items);
      return { cart: data?.cart || null, fallback: false };
    } catch (err) {
      console.error("Error fetching cart:", err);
      const local = loadLocal();
      setCartItems(local);
      return { cart: null, fallback: true };
    } finally {
      setLoading(false);
    }
  }, []);

  const persistCart = useCallback(
    async (items) => {
      // items: array of cart items
      setPersisting(true);
      try {
        if (!Array.isArray(items)) {
          throw new Error("Items inválidos");
        }
        // Validar items antes de enviar
        const invalid = items.find((it) => !validateItemShape(it));
        if (invalid) {
          throw new Error("Algún item tiene campos faltantes (productId, storeId, price, quantity)");
        }

        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          console.error("POST /api/cart failed:", res.status, text);
          throw new Error(text || "Error persistiendo carrito");
        }

        const data = await res.json();
        const serverItems = (data?.cart?.items || []).map((it) => ({
          id: it.id,
          productId: it.productId,
          storeId: it.storeId,
          name: it.product?.title || it.name || "",
          price: it.price,
          quantity: it.quantity,
        }));
        setCartItems(serverItems);
        saveLocal(serverItems);
        return { success: true, cart: data?.cart || null };
      } catch (err) {
        console.error("No se pudo persistir en DB:", err?.message || err);
        toast.error(err?.message || "No se pudo persistir carrito");
        // fallback: guardar localmente
        saveLocal(items);
        setCartItems(items);
        return { success: false, error: err?.message || String(err) };
      } finally {
        setPersisting(false);
      }
    },
    []
  );

  const clearCart = useCallback(async () => {
    // Limpia local y backend; devuelve promesa para que el caller espere
    setLoading(true);
    try {
      // Primero limpiar local
      setCartItems([]);
      saveLocal([]);

      // Intentar limpiar en backend con DELETE
      const res = await fetch("/api/cart", { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("DELETE /api/cart failed:", res.status, text);
        // No lanzar error para no bloquear UX; devolver fallo para logging
        toast.error("No se pudo limpiar carrito en backend");
        return { success: false, status: res.status, text };
      }
      return { success: true };
    } catch (err) {
      console.error("Error clearing cart:", err);
      toast.error("Error limpiando carrito");
      return { success: false, error: err?.message || String(err) };
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Mutators ---
  const addToCart = useCallback(
    async (product, qty = 1) => {
      // product: { productId, storeId, price, name, ... }
      try {
        if (!product || !product.productId || !product.storeId) {
          throw new Error("Producto inválido");
        }
        const existing = cartItems.find((it) => String(it.productId) === String(product.productId) && String(it.storeId) === String(product.storeId));
        let next;
        if (existing) {
          next = cartItems.map((it) =>
            String(it.productId) === String(product.productId) && String(it.storeId) === String(product.storeId)
              ? { ...it, quantity: it.quantity + qty }
              : it
          );
        } else {
          next = [
            ...cartItems,
            {
              productId: product.productId,
              storeId: product.storeId,
              name: product.name || product.title || "",
              price: Number(product.price) || 0,
              quantity: Number(qty) || 1,
            },
          ];
        }
        setCartItems(next);
        saveLocal(next);
        // Persistir en background (no bloquear)
        persistCart(next).catch(() => {});
        return { success: true, cart: next };
      } catch (err) {
        console.error("addToCart error:", err);
        toast.error(err?.message || "No se pudo agregar al carrito");
        return { success: false, error: err?.message || String(err) };
      }
    },
    [cartItems, persistCart]
  );

  const removeFromCart = useCallback(
    async (productId, storeId) => {
      const next = cartItems.filter((it) => !(String(it.productId) === String(productId) && String(it.storeId) === String(storeId)));
      setCartItems(next);
      saveLocal(next);
      persistCart(next).catch(() => {});
      return { success: true, cart: next };
    },
    [cartItems, persistCart]
  );

  const updateQuantity = useCallback(
    async (productId, storeId, quantity) => {
      if (typeof quantity !== "number" || quantity <= 0) {
        return removeFromCart(productId, storeId);
      }
      const next = cartItems.map((it) =>
        String(it.productId) === String(productId) && String(it.storeId) === String(storeId) ? { ...it, quantity } : it
      );
      setCartItems(next);
      saveLocal(next);
      persistCart(next).catch(() => {});
      return { success: true, cart: next };
    },
    [cartItems, persistCart, removeFromCart]
  );

  // --- Init: cargar carrito desde backend o local ---
  useEffect(() => {
    // Al montar, intentar cargar desde backend; si falla, usar localStorage
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Expose context value ---
  const value = {
    cartItems,
    loading,
    persisting,
    fetchCart,
    persistCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal: () => cartItems.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0),
    getCount: () => cartItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
