"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Helpers seguros para localStorage (solo en cliente) ---
  const canUseLocal = typeof window !== "undefined" && !!window.localStorage;

  const saveLocal = (items) => {
    if (!canUseLocal) return;
    try {
      window.localStorage.setItem("mi_tienda_cart", JSON.stringify(items));
    } catch (e) {
      console.warn("No se pudo guardar carrito en localStorage", e);
    }
  };

  const loadLocal = () => {
    if (!canUseLocal) return [];
    try {
      const raw = window.localStorage.getItem("mi_tienda_cart");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((it) => ({
        ...it,
        productId: it.productId ?? it.id ?? null,
        quantity: Number(it.quantity || 0),
      }));
    } catch (e) {
      console.warn("Error leyendo carrito local", e);
      return [];
    }
  };

  // --- API calls ---
  const fetchCart = useCallback(async () => {
    if (isSyncing) return { cart: null, skipped: true };

    setLoading(true);
    try {
      const res = await fetch("/api/cart", { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      if (!res.ok) {
        // fallback to local
        const local = loadLocal();
        setCartItems(local);
        return { cart: null, fallback: true };
      }
      const data = await res.json().catch(() => null);

      // merge with local for missing names/images
      const local = loadLocal();

      const items = (data?.cart?.items || []).map((it) => {
        const image =
          it.image ||
          it.product?.image ||
          (Array.isArray(it.product?.images) && it.product.images[0]) ||
          (Array.isArray(it.images) && it.images[0]) ||
          null;

        const localMatch = local.find((l) => String(l.productId ?? l.id) === String(it.productId ?? it.id));
        const nameFromLocal = localMatch ? (localMatch.name || localMatch.title || null) : null;
        const imageFromLocal = localMatch ? (localMatch.image || null) : null;

        return {
          id: it.id,
          productId: it.productId ?? it.id ?? null,
          storeId: it.storeId,
          name: it.product?.title || it.title || it.name || nameFromLocal || "",
          price: it.price,
          quantity: Number(it.quantity || 0),
          image: image || imageFromLocal || null,
        };
      });

      // If server returned empty but local has items, prefer local (offline-first)
      if ((items.length === 0 || items.every((i) => !i.productId)) && local.length > 0) {
        setCartItems(local);
        saveLocal(local);
        return { cart: null, fallback: true };
      }

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
  }, [isSyncing]);

  // Persistir carrito en servidor (y fallback a local)
  const persistCart = useCallback(
    async (items) => {
      setPersisting(true);
      setIsSyncing(true);
      try {
        if (!Array.isArray(items)) throw new Error("Items inválidos");

        const normalized = items
          .map((it) => ({
            productId: it.productId ?? it.id ?? null,
            quantity: Number(it.quantity || 0),
          }))
          .filter((it) => it.productId != null && it.productId !== "" && Number.isFinite(it.quantity) && it.quantity > 0);

        if (normalized.length === 0) {
          try {
            const delRes = await fetch("/api/cart", {
              method: "DELETE",
              credentials: "include",
            });
            if (!delRes.ok) {
              const text = await delRes.text().catch(() => null);
              throw new Error(text || "Error al vaciar carrito en servidor");
            }
            setCartItems([]);
            saveLocal([]);
            return { success: true, cart: null };
          } catch (err) {
            console.error("No se pudo vaciar carrito en servidor:", err?.message || err);
            toast.error(err?.message || "No se pudo vaciar carrito en servidor");
            saveLocal(items);
            setCartItems(items);
            return { success: false, error: err?.message || String(err) };
          } finally {
            setPersisting(false);
            setIsSyncing(false);
          }
        }

        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({ items: normalized }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(text || "Error persistiendo carrito");
        }

        const data = await res.json().catch(() => null);
        const serverItems = (data?.cart?.items || []).map((it) => {
          const image =
            it.image ||
            it.product?.image ||
            (Array.isArray(it.product?.images) && it.product.images[0]) ||
            (Array.isArray(it.images) && it.images[0]) ||
            null;
          return {
            id: it.id,
            productId: it.productId ?? it.id ?? null,
            storeId: it.storeId,
            name: it.product?.title || it.title || it.name || "",
            price: it.price,
            quantity: Number(it.quantity || 0),
            image: image || null,
          };
        });

        setCartItems(serverItems);
        saveLocal(serverItems);
        return { success: true, cart: data?.cart || null };
      } catch (err) {
        console.error("No se pudo persistir en DB:", err?.message || err);
        toast.error(err?.message || "No se pudo persistir carrito");
        const fallback = (items || []).map((it) => ({
          ...it,
          quantity: Number(it.quantity || 0),
          productId: it.productId ?? it.id ?? null,
        }));
        saveLocal(fallback);
        setCartItems(fallback);
        return { success: false, error: err?.message || String(err) };
      } finally {
        setPersisting(false);
        setTimeout(() => setIsSyncing(false), 250);
      }
    },
    []
  );

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      setCartItems([]);
      saveLocal([]);
      const res = await fetch("/api/cart", { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
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
      try {
        const productId = product.productId ?? product.id;
        const storeId = product.storeId ?? product.store?.id ?? product.storeId;
        if (!productId) throw new Error("Producto inválido (falta productId)");

        const existingIndex = cartItems.findIndex(
          (it) =>
            (String(it.productId) === String(productId) || String(it.id) === String(productId)) &&
            (storeId == null ? true : String(it.storeId) === String(storeId))
        );

        let next;
        if (existingIndex >= 0) {
          next = cartItems.map((it, idx) =>
            idx === existingIndex ? { ...it, quantity: Number(it.quantity || 0) + Number(qty) } : it
          );
        } else {
          const image = product.image || (Array.isArray(product.images) && product.images[0]) || null;
          next = [
            ...cartItems,
            {
              id: product.id ?? undefined,
              productId,
              storeId,
              name: product.name || product.title || "",
              price: Number(product.price) || 0,
              quantity: Number(qty) || 1,
              image,
            },
          ];
        }

        setCartItems(next);
        saveLocal(next);
        // persist in background
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
    async (idOrProductId, storeId) => {
      const prev = cartItems.slice();

      const next = cartItems.filter((it) => {
        const matchesId =
          String(it.id ?? it.productId) === String(idOrProductId) || String(it.productId) === String(idOrProductId);
        if (!matchesId) return true;
        if (storeId == null || storeId === undefined) return false;
        return String(it.storeId) !== String(storeId);
      });

      const normalizedNext = next.map((it) => ({
        ...it,
        quantity: Number(it.quantity || 0),
        productId: it.productId ?? it.id ?? null,
      }));

      setCartItems(normalizedNext);
      saveLocal(normalizedNext);

      try {
        const res = await persistCart(normalizedNext);
        if (!res || res.success === false) {
          setCartItems(prev);
          saveLocal(prev);
          toast.error(res?.error || "No se pudo eliminar en el servidor. Se revirtió el cambio.");
          return { success: false, cart: prev };
        }
        return { success: true, cart: normalizedNext };
      } catch (err) {
        setCartItems(prev);
        saveLocal(prev);
        toast.error(err?.message || "Error al eliminar en servidor");
        return { success: false, error: err?.message || String(err), cart: prev };
      }
    },
    [cartItems, persistCart]
  );

  const updateQuantity = useCallback(
    async (idOrProductId, storeId, quantity) => {
      const qtyNum = Number(quantity);
      if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
        return removeFromCart(idOrProductId, storeId);
      }
      const next = cartItems.map((it) => {
        const matchesId =
          String(it.id ?? it.productId) === String(idOrProductId) || String(it.productId) === String(idOrProductId);
        const storeMatches = storeId == null ? true : String(it.storeId) === String(storeId);
        if (matchesId && storeMatches) {
          return { ...it, quantity: qtyNum };
        }
        return it;
      });

      const normalizedNext = next.map((it) => ({ ...it, quantity: Number(it.quantity || 0), productId: it.productId ?? it.id ?? null }));

      setCartItems(normalizedNext);
      saveLocal(normalizedNext);
      persistCart(normalizedNext).catch(() => {});
      return { success: true, cart: normalizedNext };
    },
    [cartItems, persistCart, removeFromCart]
  );

  // Hydrate from local first (fast UX), then fetch server copy
  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;
    const local = loadLocal();
    if (local && local.length > 0) {
      setCartItems(local);
    }
    // Then try to sync with server
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    // debug
    // eslint-disable-next-line no-console
    console.log("CartContext updated - items:", cartItems);
  }, [cartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  // Return null instead of throwing to make consumer code more tolerant.
  // Components can guard: const cart = useCart(); if (!cart) return null;
  return ctx ?? null;
}
