// src/context/CartContext.jsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { fetchSession } from "@/lib/useSessionCheck";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { status } = useSession();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // contador que cambia solo cuando hacemos broadcast (mutaciones)
  const [cartVersion, setCartVersion] = useState(0);

  const canUseLocal = typeof window !== "undefined" && !!window.localStorage;
  const triedOnceRef = useRef(false);
  const mutationInFlightRef = useRef(false);
  const cartItemsRef = useRef([]);

  // BroadcastChannel y tabId para evitar procesar mensajes propios
  const bcRef = useRef(null);
  const tabIdRef = useRef(null);

  // Guard para evitar reentradas simultáneas en fetchCart
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      tabIdRef.current = (Math.random().toString(36).slice(2) + Date.now().toString(36));
      // Exponer para que otras partes de la app puedan comparar (opcional)
      window.__MI_TIENDA_TAB_ID__ = tabIdRef.current;
    } catch (e) {
      tabIdRef.current = String(Date.now());
      window.__MI_TIENDA_TAB_ID__ = tabIdRef.current;
    }

    if ("BroadcastChannel" in window) {
      bcRef.current = new BroadcastChannel("mi_tienda_cart_channel");
      bcRef.current.onmessage = (ev) => {
        try {
          const msg = ev?.data;
          if (!msg || typeof msg !== "object") return;
          if (msg.type !== "cart:updated") return;
          if (msg.origin === tabIdRef.current) return; // ignorar mensajes propios
          // revalidar desde servidor cuando otra pestaña actualiza
          fetchCart();
        } catch (e) {
          // ignore
        }
      };
    }

    return () => {
      try {
        bcRef.current?.close();
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeCartItems = useCallback((items) => {
    if (!Array.isArray(items)) return [];

    const deduped = [];
    items.forEach((it) => {
      const productId = it?.productId ?? it?.id ?? null;
      if (productId == null || productId === "") return;

      const storeId = it?.storeId ?? null;
      const key = `${String(productId)}::${String(storeId ?? "")}`;
      const existingIndex = deduped.findIndex((entry) => `${String(entry.productId ?? entry.id ?? "")}::${String(entry.storeId ?? "")}` === key);

      if (existingIndex >= 0) {
        deduped[existingIndex] = {
          ...deduped[existingIndex],
          ...it,
          productId,
          quantity: Number(deduped[existingIndex].quantity || 0) + Number(it?.quantity || 0),
          storeId: storeId ?? deduped[existingIndex].storeId ?? null,
        };
      } else {
        deduped.push({
          ...it,
          productId,
          quantity: Number(it?.quantity || 0),
          storeId: storeId ?? null,
        });
      }
    });

    return deduped;
  }, []);

  const saveLocal = (items) => {
    if (!canUseLocal) return;
    try {
      const normalized = normalizeCartItems(items);
      window.localStorage.setItem("mi_tienda_cart", JSON.stringify(normalized));
      try {
        window.localStorage.setItem("mi_tienda_cart_last_update", String(Date.now()));
      } catch (e) {}
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
      return normalizeCartItems(parsed);
    } catch (e) {
      console.warn("Error leyendo carrito local", e);
      return [];
    }
  };

  // setAndSave acepta opts.broadcast (default true).
  // Cuando broadcast = false no dispara eventos para evitar loops de revalidación.
  // Además: solo incrementa cartVersion cuando broadcast === true.
  const setAndSave = useCallback((items, opts = {}) => {
    const { broadcast = true } = opts;
    const normalized = normalizeCartItems(items);
    setCartItems(normalized);
    cartItemsRef.current = normalized;
    saveLocal(normalized);

    if (broadcast) {
      setCartVersion((v) => v + 1);
    }

    if (broadcast && typeof window !== "undefined") {
      try {
        // evento en la misma pestaña (incluye origin en detail)
        window.dispatchEvent(new CustomEvent("cart:updated", { detail: { origin: tabIdRef.current } }));
      } catch (e) {}
    }

    if (broadcast) {
      try {
        bcRef.current?.postMessage({ type: "cart:updated", origin: tabIdRef.current });
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  const fetchCart = useCallback(async () => {
    // evitar reentradas simultáneas
    if (isFetchingRef.current) return { cart: null, skipped: true };
    if (isSyncing) return { cart: null, skipped: true };

    isFetchingRef.current = true;
    setLoading(true);
    try {
      const user = await fetchSession();
      if (!user) {
        const local = loadLocal();
        // lectura local: no broadcast
        setAndSave(local, { broadcast: false });
        setLoading(false);
        return { cart: null, fallback: true, skipped: true };
      }

      if (triedOnceRef.current) {
        const local = loadLocal();
        setAndSave(local, { broadcast: false });
        setLoading(false);
        return { cart: null, fallback: true };
      }

      const res = await fetch("/api/cart", { method: "GET", credentials: "same-origin", headers: { Accept: "application/json" } });

      if (!res.ok) {
        if (res.status === 401) {
          triedOnceRef.current = true;
          setAndSave(loadLocal(), { broadcast: false });
          setLoading(false);
          return { cart: null, fallback: true, status: 401 };
        }
        setAndSave(loadLocal(), { broadcast: false });
        setLoading(false);
        return { cart: null, fallback: true, status: res.status };
      }

      const data = await res.json().catch(() => null);
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
          price: typeof it.price !== "undefined" ? Number(it.price) : (it.product?.price ? Number(it.product.price) : 0),
          quantity: Number(it.quantity || 0),
          image: image || imageFromLocal || null,
          stock: typeof it.stock !== "undefined" ? Number(it.stock) : Number(it.product?.stock ?? Infinity),
          product: it.product ?? null,
        };
      });

      if ((items.length === 0 || items.every((i) => !i.productId)) && local.length > 0) {
        // fallback a local, no broadcast
        setAndSave(local, { broadcast: false });
        setLoading(false);
        return { cart: null, fallback: true };
      }

      // lectura desde servidor: NO broadcast para evitar loop
      setAndSave(items, { broadcast: false });
      setLoading(false);
      return { cart: data?.cart || null, fallback: false };
    } catch (err) {
      console.warn("fetchCart error:", err);
      const local = loadLocal();
      setAndSave(local, { broadcast: false });
      setLoading(false);
      return { cart: null, fallback: true, error: err?.message || String(err) };
    } finally {
      isFetchingRef.current = false;
    }
  }, [isSyncing, setAndSave]);

  const persistCart = useCallback(async (items) => {
    if (mutationInFlightRef.current) {
      return { success: false, status: 409, error: "operation_in_progress" };
    }

    mutationInFlightRef.current = true;
    setPersisting(true);
    setIsSyncing(true);
    try {
      if (!Array.isArray(items)) throw new Error("Items inválidos");

      const payloadItems = items
        .map((it) => ({
          productId: it.productId ?? it.id ?? null,
          quantity: Number(it.quantity || 0),
          storeId: it.storeId ?? null,
          price: Number(it.price || 0),
          title: it.name || it.title || it.product?.title || "",
          image: it.image || it.product?.image || null,
        }))
        .filter((it) => it.productId != null && it.productId !== "" && Number.isFinite(it.quantity) && it.quantity > 0);

      const normalized = [];
      payloadItems.forEach((it) => {
        const key = `${String(it.productId)}::${String(it.storeId ?? "")}`;
        const existingIndex = normalized.findIndex((entry) => `${String(entry.productId)}::${String(entry.storeId ?? "")}` === key);
        if (existingIndex >= 0) {
          normalized[existingIndex] = {
            ...normalized[existingIndex],
            quantity: Number(normalized[existingIndex].quantity || 0) + Number(it.quantity || 0),
            price: Number(normalized[existingIndex].price || 0) + Number(it.price || 0),
            title: normalized[existingIndex].title || it.title || "",
            image: normalized[existingIndex].image || it.image || null,
          };
        } else {
          normalized.push(it);
        }
      });

      if (normalized.length === 0) {
        try {
          const user = await fetchSession();
          if (!user) {
            // mutación local: broadcast true por defecto
            setAndSave([]);
            return { success: true, status: 200, cart: null, note: "no_session_local_cleared" };
          }

          const delRes = await fetch("/api/cart", { method: "DELETE", credentials: "same-origin" });
          if (!delRes.ok) {
            const text = await delRes.text().catch(() => null);
            if (delRes.status === 401) {
              triedOnceRef.current = true;
              return { success: false, status: 401, error: "auth_required" };
            }
            throw new Error(text || "Error al vaciar carrito en servidor");
          }

          const delData = await delRes.json().catch(() => null);
          const serverItems = (delData?.cart?.items || []).map((it) => ({
            id: it.id,
            productId: it.productId ?? it.id ?? null,
            storeId: it.storeId,
            name: it.title ?? it.product?.title ?? "",
            price: typeof it.price !== "undefined" ? Number(it.price) : (it.product?.price ? Number(it.product.price) : 0),
            quantity: Number(it.quantity || 0),
            image: it.image ?? it.product?.image ?? null,
            product: it.product ?? null,
          }));

          // mutación desde servidor: broadcast (notificar otras pestañas)
          setAndSave(serverItems);
          return { success: true, status: 200, cart: delData?.cart || null };
        } catch (err) {
          toast.error(err?.message || "No se pudo vaciar carrito en servidor");
          saveLocal(items);
          setCartItems(items);
          return { success: false, error: err?.message || String(err) };
        } finally {
          setPersisting(false);
          setIsSyncing(false);
        }
      }

      // Try server sync even if fetchSession fails — server checks cookies directly
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ items: normalized }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        if (res.status === 401) {
          saveLocal(items);
          setCartItems(items);
          setPersisting(false);
          setIsSyncing(false);
          return { success: false, status: 401, error: "auth_required" };
        }
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
          price: typeof it.price !== "undefined" ? Number(it.price) : (it.product?.price ? Number(it.product.price) : 0),
          quantity: Number(it.quantity || 0),
          image: image || null,
          stock: typeof it.stock !== "undefined" ? Number(it.stock) : Number(it.product?.stock ?? Infinity),
          product: it.product ?? null,
        };
      });

      // mutación desde servidor: broadcast true (notificar)
      setAndSave(serverItems);
      return { success: true, status: res.status, cart: data?.cart || null };
    } catch (err) {
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
      mutationInFlightRef.current = false;
    }
  }, [setAndSave, normalizeCartItems]);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      // mutación local: broadcast true
      setAndSave([]);
      const user = await fetchSession();
      if (!user) {
        setLoading(false);
        return { success: true, note: "local_cleared_no_session" };
      }
      const res = await fetch("/api/cart", { method: "DELETE", credentials: "same-origin" });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        toast.error("No se pudo limpiar carrito en backend");
        setLoading(false);
        return { success: false, status: res.status, text };
      }
      const data = await res.json().catch(() => null);
      const serverItems = (data?.cart?.items || []).map((it) => ({
        id: it.id,
        productId: it.productId ?? it.id ?? null,
        storeId: it.storeId,
        name: it.title ?? it.product?.title ?? "",
        price: typeof it.price !== "undefined" ? Number(it.price) : (it.product?.price ? Number(it.product.price) : 0),
        quantity: Number(it.quantity || 0),
        image: it.image ?? it.product?.image ?? null,
        product: it.product ?? null,
      }));
      // mutación desde servidor: broadcast true
      setAndSave(serverItems);
      setLoading(false);
      return { success: true, cart: data?.cart || null };
    } catch (err) {
      toast.error("Error limpiando carrito");
      setLoading(false);
      return { success: false, error: err?.message || String(err) };
    }
  }, [setAndSave]);

  const addToCart = useCallback(async (product, qty = 1) => {
    try {
      if (mutationInFlightRef.current) {
        return { success: false, status: 409, error: "operation_in_progress", cart: cartItems };
      }

      const productId = product.productId ?? product.id;
      const storeId = product.storeId ?? product.store?.id ?? product.storeId;
      if (!productId) throw new Error("Producto inválido (falta productId)");

      const productStock = typeof product.stock !== "undefined" ? Number(product.stock) : Number(product.product?.stock ?? Infinity);
      const currentItems = cartItemsRef.current;

      const existingIndex = currentItems.findIndex(
        (it) =>
          (String(it.productId) === String(productId) || String(it.id) === String(productId)) &&
          (storeId == null ? true : String(it.storeId) === String(storeId))
      );

      let next;
      if (existingIndex >= 0) {
        const existing = currentItems[existingIndex];
        const newQty = Number(existing.quantity || 0) + Number(qty);
        if (newQty > productStock) {
          toast.error("Stock insuficiente");
          return { success: false, error: "stock_insufficient", available: productStock, cart: currentItems };
        }
        next = currentItems.map((it, idx) =>
          idx === existingIndex ? { ...it, quantity: newQty } : it
        );
      } else {
        if (Number(qty) > productStock) {
          toast.error("Stock insuficiente");
          return { success: false, error: "stock_insufficient", available: productStock, cart: currentItems };
        }
        const image = product.image || (Array.isArray(product.images) && product.images[0]) || null;
        next = [
          ...currentItems,
          {
            id: product.id ?? undefined,
            productId,
            storeId,
            name: product.name || product.title || "",
            price: Number(product.price) || 0,
            quantity: Number(qty) || 1,
            image,
            stock: productStock,
            product: product.product ?? null,
            addedAt: Date.now(),
          },
        ];
      }

      // Optimistic update (local)
      setAndSave(next);

      const res = await persistCart(next);

      if (res && res.success) {
        // persistCart ya llamó a setAndSave(serverItems) con broadcast true
        return { success: true, status: res.status || 200, cart: res.cart || next };
      }

      if (!res || res.success === false) {
        if (res?.status === 401) {
          try {
            if (typeof window !== "undefined") {
              sessionStorage.setItem(
                "pendingAdd",
                JSON.stringify({
                  items: next.map((it) => ({ productId: it.productId, quantity: it.quantity, storeId: it.storeId })),
                  ts: Date.now(),
                })
              );
            }
          } catch (e) {}
          return { success: false, status: 401, error: "auth_required", cart: next };
        }

        toast.error(res?.error || "No se pudo sincronizar con el servidor. Se guardó localmente.");
        return { success: false, error: res?.error || "persist_failed", cart: next };
      }

      return { success: true, status: res.status || 200, cart: res.cart || next };
    } catch (err) {
      toast.error(err?.message || "No se pudo agregar al carrito");
      return { success: false, error: err?.message || String(err) };
    }
  }, [persistCart, setAndSave]);

  const removeFromCart = useCallback(async (idOrProductId, storeId) => {
    if (mutationInFlightRef.current) {
      return { success: false, status: 409, error: "operation_in_progress", cart: cartItems };
    }

    const prev = cartItemsRef.current.slice();

    const next = cartItemsRef.current.filter((it) => {
      const sameId = String(it.id) === String(idOrProductId);
      const sameProductId = String(it.productId) === String(idOrProductId);

      if (!(sameId || sameProductId)) return true;

      if (storeId == null || storeId === "") return false;

      return String(it.storeId ?? "") !== String(storeId);
    });

    const normalizedNext = next.map((it) => ({
      ...it,
      quantity: Number(it.quantity || 0),
      productId: it.productId ?? it.id ?? null,
    }));

    // Optimistic update (local)
    setAndSave(normalizedNext);

    try {
      const res = await persistCart(normalizedNext);

      if (res && res.success) {
        // persistCart already setAndSave(serverItems) with broadcast true
        return { success: true, cart: res.cart || normalizedNext };
      }

      // fallback: revalidate from server if persist didn't return cart
      const get = await fetch("/api/cart", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (get.ok) {
        const data = await get.json().catch(() => null);
        const items = (data?.cart?.items || []).map((it) => ({
          id: it.id,
          productId: it.productId ?? it.id ?? null,
          storeId: it.storeId,
          name: it.title ?? it.product?.title ?? "",
          price: Number(it.price ?? it.product?.price ?? 0),
          quantity: Number(it.quantity || 0),
          image: it.image ?? it.product?.image ?? null,
          product: it.product ?? null,
        }));
        // lectura desde servidor: no broadcast
        setAndSave(items, { broadcast: false });
        return { success: true, cart: items };
      }

      // revertir en fallo
      setAndSave(prev);
      toast.error(res?.error || "No se pudo eliminar en el servidor. Se revirtió el cambio.");
      return { success: false, cart: prev };
    } catch (err) {
      setAndSave(prev);
      toast.error(err?.message || "Error al eliminar en servidor");
      return { success: false, error: err?.message || String(err), cart: prev };
    }
  }, [persistCart, setAndSave]);

  const updateQuantity = useCallback(async (idOrProductId, storeId, quantity) => {
    const qtyNum = Number(quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      return removeFromCart(idOrProductId, storeId);
    }

    const item = cartItemsRef.current.find((it) => {
      const matchesId = String(it.id ?? it.productId) === String(idOrProductId) || String(it.productId) === String(idOrProductId);
      const storeMatches = storeId == null ? true : String(it.storeId) === String(storeId);
      return matchesId && storeMatches;
    });

    if (!item) {
      return { success: false, error: "item_not_found" };
    }

    const maxStock = Number(item.stock ?? item.product?.stock ?? Infinity);
    if (qtyNum > maxStock) {
      toast.error("Stock insuficiente");
      return { success: false, error: "stock_insufficient", available: maxStock };
    }

    const next = cartItemsRef.current.map((it) => {
      const matchesId =
        String(it.id ?? it.productId) === String(idOrProductId) || String(it.productId) === String(idOrProductId);
      const storeMatches = storeId == null ? true : String(it.storeId) === String(storeId);
      if (matchesId && storeMatches) {
        return { ...it, quantity: qtyNum };
      }
      return it;
    });

    const normalizedNext = next.map((it) => ({ ...it, quantity: Number(it.quantity || 0), productId: it.productId ?? it.id ?? null }));

    // Optimistic update
    setAndSave(normalizedNext);

    try {
      const res = await persistCart(normalizedNext);
      if (res && res.success) {
        return { success: true, cart: res.cart || normalizedNext };
      }

      // fallback: revalidate server state
      const get = await fetch("/api/cart", { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (get.ok) {
        const data = await get.json().catch(() => null);
        const items = (data?.cart?.items || []).map((it) => ({
          id: it.id,
          productId: it.productId ?? it.id ?? null,
          storeId: it.storeId,
          name: it.title ?? it.product?.title ?? "",
          price: Number(it.price ?? it.product?.price ?? 0),
          quantity: Number(it.quantity || 0),
          image: it.image ?? it.product?.image ?? null,
          product: it.product ?? null,
        }));
        // lectura desde servidor: no broadcast
        setAndSave(items, { broadcast: false });
        return { success: true, cart: items };
      }

      // revertir
      setAndSave(cartItemsRef.current);
      toast.error(res?.error || "No se pudo actualizar en el servidor. Se revirtió el cambio.");
      return { success: false, cart: cartItemsRef.current };
    } catch (err) {
      setAndSave(cartItemsRef.current);
      toast.error(err?.message || "Error actualizando cantidad en servidor");
      return { success: false, error: err?.message || String(err), cart: cartItemsRef.current };
    }
  }, [persistCart, removeFromCart, setAndSave]);

  // Process pendingAdd after login (if any)
  useEffect(() => {
    async function processPending() {
      if (typeof window === "undefined") return;
      try {
        const raw = sessionStorage.getItem("pendingAdd");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!parsed?.items) return;
        const res = await persistCart(parsed.items);
        if (res && res.success) {
          sessionStorage.removeItem("pendingAdd");
        }
      } catch (e) {}
    }

    if (status === "authenticated") {
      processPending();
    }
  }, [status, persistCart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const local = loadLocal();
    if (local && local.length > 0) {
      setCartItems(local);
    }
    if (status === "loading") return;
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const value = {
    cartItems,
    loading,
    persisting,
    cartVersion,
    fetchCart,
    persistCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal: () => cartItems.reduce((s, it) => {
      const price = Number(it.price ?? it.product?.price ?? 0);
      const qty = Number(it.quantity ?? 0);
      return s + price * qty;
    }, 0),
    getCount: () => cartItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  return ctx ?? null;
}
