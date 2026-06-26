// src/app/(shop)/cart/page.jsx
"use client";

/**
 * Cart page:
 * - Edición inline de cantidad con debounce y bloqueo por stock.
 * - Animación de colapso al eliminar items.
 * - Sincronización automática con CartContext (cartVersion + eventos + BroadcastChannel).
 * - Fallbacks a localStorage y revalidación segura.
 */

import React, { useEffect, useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchSession } from "@/lib/useSessionCheck";
import { safeParseLocalCart } from "@/components/navbar/utils";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CartItemSkeleton } from "@/components/Skeletons";

/* -------------------------
   ModalConfirm (reutilizable)
   ------------------------- */
function ModalConfirm({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  confirmRef,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (open && confirmRef?.current) confirmRef.current.focus();
  }, [open, confirmRef]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-10">
        <h3 id="modal-title" className="text-lg font-semibold mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            {cancelText}
          </button>

          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   CartPage
   ------------------------- */
export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    clearCart,
    fetchCart,
    updateQuantity,
    cartVersion,
  } = useCart();

  const router = useRouter();
  const { data: session, status } = useSession();

  const [displayItems, setDisplayItems] = useState([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [showClearModal, setShowClearModal] = useState(false);
  const [itemToConfirm, setItemToConfirm] = useState(null);
  const confirmButtonRef = useRef(null);

  // Refs para medir y animar cada item
  const itemRefs = useRef({});
  const [collapsing, setCollapsing] = useState({}); // { [id]: currentHeightOrZero }

  const ANIMATION_DURATION = 300; // ms

  // Estimaciones del servidor
  const [estimating, setEstimating] = useState(false);
  const [serverEstimates, setServerEstimates] = useState(null);

  // Stock map: { [productId]: stockNumber }
  const [stockMap, setStockMap] = useState({});

  // Debounce timers por item para actualizar cantidad
  const qtyTimers = useRef({});

  // Aviso transitorio cuando el carrito queda vacío
  const [showEmptyNotice, setShowEmptyNotice] = useState(false);
  const EMPTY_NOTICE_TIMEOUT = 2500; // ms

  // TAX_RATE local fallback (solo si backend no responde)
  const TAX_RATE_FALLBACK = 0.18; // 18% ejemplo

  // mounted para evitar hydration mismatch en elementos que dependen del cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Evitar doble revalidación inicial (Strict Mode / múltiples efectos)
  const skipInitialRevalidateRef = useRef(true);

  // Helper: mapear items del servidor/context a displayItems
  const mapServerItemsToDisplay = (items) =>
    (items || []).map((it) => ({
      id: it.id,
      productId: it.productId ?? it.id ?? null,
      storeId: it.storeId,
      title: it.title || it.name || it.product?.title || "",
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 0),
      image:
        it.image ||
        it.product?.image ||
        (Array.isArray(it.product?.images) && it.product.images[0]) ||
        null,
      stock: it.stock ?? it.product?.stock ?? undefined,
    }));

  // Inicializar displayItems desde localStorage o cartItems y sincronizar una vez desde el servidor
  useEffect(() => {
    if (typeof window === "undefined") return;

    const local = safeParseLocalCart("mi_tienda_cart");
    if (Array.isArray(local) && local.length > 0) {
      setDisplayItems(
        local.map((it) => ({
          id: it.id ?? undefined,
          productId: it.productId ?? it.id ?? null,
          storeId: it.storeId ?? it.store?.id ?? undefined,
          title: it.title || it.name || it.product?.title || "",
          price: Number(it.price || 0),
          quantity: Number(it.quantity || 0),
          image: it.image || (Array.isArray(it.images) && it.images[0]) || null,
          stock: it.stock ?? undefined,
        }))
      );
    } else if (Array.isArray(cartItems) && cartItems.length > 0) {
      setDisplayItems(mapServerItemsToDisplay(cartItems));
    } else {
      setDisplayItems([]);
    }

    if (status === "loading") return;

    let active = true;
    const syncFromServer = async () => {
      try {
        setLoadingServer(true);
        const res = await fetchCart();
        if (!active) return;
        if (res?.cart?.items && Array.isArray(res.cart.items)) {
          setDisplayItems(mapServerItemsToDisplay(res.cart.items));
          if ((res.cart.items || []).length === 0) {
            setShowEmptyNotice(true);
            setTimeout(() => setShowEmptyNotice(false), EMPTY_NOTICE_TIMEOUT);
          }
        } else {
          setDisplayItems([]);
        }
      } catch (err) {
        console.warn("Initial cart sync failed:", err);
      } finally {
        if (active) setLoadingServer(false);
      }
    };

    syncFromServer();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fetchCart]);

  // Sincronizar displayItems cuando cartItems del contexto cambian
  useEffect(() => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;
    const mapped = cartItems.map((it) => ({
      id: it.id,
      productId: it.productId ?? it.id ?? null,
      storeId: it.storeId,
      title: it.title || it.product?.title || it.name || "",
      price: Number(it.price || 0),
      quantity: Number(it.quantity || 0),
      image:
        it.image ||
        it.product?.image ||
        (Array.isArray(it.product?.images) && it.product.images[0]) ||
        null,
      stock: it.stock ?? it.product?.stock ?? undefined,
    }));
    setDisplayItems(mapped);
  }, [cartItems]);

  // Si faltan stocks, intentar obtenerlos del backend por productId
  useEffect(() => {
    const missing = displayItems
      .filter((it) => it.productId && (it.stock === undefined || it.stock === null))
      .map((it) => it.productId);

    if (missing.length === 0) return;

    const unique = Array.from(new Set(missing));
    unique.forEach(async (pid) => {
      try {
        const res = await fetch(`/api/products/${pid}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data) return;
        const stock = typeof data.stock === "number" ? data.stock : data.available ?? null;
        if (stock === null || stock === undefined) return;
        setStockMap((prev) => ({ ...prev, [pid]: stock }));
        setDisplayItems((prev) => prev.map((it) => (String(it.productId) === String(pid) ? { ...it, stock } : it)));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Error fetching product stock", pid, err);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayItems]);

  // Sincronizar desde el servidor solo al cargar y al recibir eventos externos
  useEffect(() => {
    if (typeof window === "undefined") return;

    let debounceTimer = null;

    const revalidate = async () => {
      try {
        if (typeof fetchCart !== "function") return;
        if (loadingServer) return;
        setLoadingServer(true);
        const res = await fetchCart();
        if (res?.cart?.items && Array.isArray(res.cart.items)) {
          setDisplayItems(mapServerItemsToDisplay(res.cart.items));
          if ((res.cart.items || []).length === 0) {
            setShowEmptyNotice(true);
            setTimeout(() => setShowEmptyNotice(false), EMPTY_NOTICE_TIMEOUT);
          }
        }
      } catch (err) {
        console.warn("Error sincronizando carrito:", err);
      } finally {
        setLoadingServer(false);
      }
    };

    const onCartUpdated = (ev) => {
      try {
        const origin = ev?.detail?.origin;
        if (origin && origin === window.__MI_TIENDA_TAB_ID__) return;
      } catch (e) {}
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        revalidate();
      }, 120);
    };

    const onStorage = (e) => {
      if (e.key === "mi_tienda_cart_last_update") {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          revalidate();
        }, 120);
      }
    };

    window.addEventListener("cart:updated", onCartUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("cart:updated", onCartUpdated);
      window.removeEventListener("storage", onStorage);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCart, loadingServer]);

  // Escuchar BroadcastChannel (opcional) para sincronizar entre pestañas
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel("mi_tienda_cart_channel");
    const handler = (ev) => {
      try {
        const msg = ev?.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.type !== "cart:updated") return;
        if (msg.origin === window.__MI_TIENDA_TAB_ID__) return;
        if (loadingServer) return;
        // revalidate via fetchCart
        if (typeof fetchCart === "function") {
          fetchCart().then((res) => {
            if (res?.cart?.items) setDisplayItems(mapServerItemsToDisplay(res.cart.items));
          }).catch(() => {});
        }
      } catch (e) {}
    };
    bc.addEventListener("message", handler);
    return () => bc.removeEventListener("message", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCart, loadingServer]);

  /* -------------------------
     Cálculos de resumen
     ------------------------- */
  const subtotal = (displayItems || []).reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
    0
  );

  const includedTaxesLocalFallback = subtotal > 0 ? (subtotal * TAX_RATE_FALLBACK) / (1 + TAX_RATE_FALLBACK) : 0;
  const taxEstimate = serverEstimates?.taxEstimate ?? includedTaxesLocalFallback;
  const shippingEstimate = serverEstimates?.shippingEstimate ?? 0;
  const shippingText = serverEstimates?.shippingEstimate !== undefined ? `S/ ${shippingEstimate.toFixed(2)}` : "Incluido";
  const totalDisplayed = subtotal;
  const serverTotal = serverEstimates ? subtotal + (serverEstimates.shippingEstimate || 0) : null;

  /* -------------------------
     Cantidad inline: handlers
     ------------------------- */
  const canIncrease = (item) => {
    const pid = item.productId ?? item.id;
    const knownStock = item.stock ?? stockMap[pid];
    if (knownStock === undefined || knownStock === null) {
      return true;
    }
    return Number(item.quantity || 0) < Number(knownStock);
  };

  const handleChangeQuantity = (item, newQty) => {
    const idKey = String(item.id ?? item.productId);
    if (newQty < 1) newQty = 1;

    const pid = item.productId ?? item.id;
    const knownStock = item.stock ?? stockMap[pid];
    if (knownStock !== undefined && newQty > knownStock) {
      toast.error("No hay suficiente stock disponible");
      return;
    }

    setDisplayItems((prev) => prev.map((it) => (String(it.id ?? it.productId) === idKey ? { ...it, quantity: newQty } : it)));

    if (qtyTimers.current[idKey]) {
      clearTimeout(qtyTimers.current[idKey]);
    }

    qtyTimers.current[idKey] = setTimeout(async () => {
      try {
        if (typeof updateQuantity === "function") {
          const res = await updateQuantity(idKey, newQty);
          if (!res || res.success === false) {
            setDisplayItems((prev) => prev.map((it) => (String(it.id ?? it.productId) === idKey ? { ...it, quantity: item.quantity } : it)));
            toast.error(res?.error || "No se pudo actualizar la cantidad");
            return;
          }
        } else {
          const res = await fetch("/api/cart/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ productId: pid, quantity: newQty }),
          });
          if (!res.ok) {
            setDisplayItems((prev) => prev.map((it) => (String(it.id ?? it.productId) === idKey ? { ...it, quantity: item.quantity } : it)));
            toast.error("No se pudo actualizar la cantidad");
            return;
          }
        }
        if (typeof fetchCart === "function") {
          try {
            await fetchCart();
          } catch (e) {}
        }
      } catch (err) {
        setDisplayItems((prev) => prev.map((it) => (String(it.id ?? it.productId) === idKey ? { ...it, quantity: item.quantity } : it)));
        // eslint-disable-next-line no-console
        console.error("Error actualizando cantidad:", err);
        toast.error("Error actualizando la cantidad");
      } finally {
        delete qtyTimers.current[idKey];
      }
    }, 350);
  };

  /* -------------------------
     Eliminación: performRemove y confirm flow
     ------------------------- */
  const triggerEmptyNotice = () => {
    setShowEmptyNotice(true);
    // cerrar cualquier modal abierto
    setShowClearModal(false);
    setItemToConfirm(null);
    // auto-dismiss
    setTimeout(() => setShowEmptyNotice(false), EMPTY_NOTICE_TIMEOUT);
  };

  const performRemove = async (item) => {
    const idOrProductId = item.id ?? item.productId;
    if (!idOrProductId) {
      toast.error("Identificador de producto inválido");
      return;
    }

    setRemovingIds((prev) => new Set(prev).add(String(idOrProductId)));

    try {
      const res = await removeFromCart(idOrProductId, item.storeId);

      if (!res || res.success === false) {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(String(idOrProductId));
          return next;
        });

        if (res?.status === 401) {
          toast.error("Necesitas iniciar sesión para eliminar este producto");
          router.push(`/login?callbackUrl=/cart`);
          return;
        }

        toast.error(res?.error || "No se pudo eliminar el producto del carrito");
        return;
      }

      // Asegurar que displayItems refleje el cambio localmente si no fue así.
      const existsInDisplay = displayItems.some((x) => String(x.id ?? x.productId) === String(idOrProductId));
      if (existsInDisplay) {
        setDisplayItems((prev) => prev.filter((x) => String(x.id ?? x.productId) !== String(idOrProductId)));
      }

      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(String(idOrProductId));
        return next;
      });

      toast.success("Producto eliminado");

      // si quedó vacío, mostrar aviso transitorio
      setTimeout(() => {
        if ((displayItems.length - 1) <= 0) {
          triggerEmptyNotice();
        }
      }, 50);
    } catch (err) {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(String(idOrProductId));
        return next;
      });
      // eslint-disable-next-line no-console
      console.error("Error en performRemove:", err);
      toast.error("Error eliminando producto");
    }
  };

  const handleRemove = async (idOrProductId, storeId) => {
    const idKey = idOrProductId;
    const el = itemRefs.current[idKey];
    if (el && el.getBoundingClientRect) {
      try {
        const measuredHeight = el.scrollHeight;
        setCollapsing((prev) => ({ ...prev, [String(idOrProductId)]: measuredHeight }));

        requestAnimationFrame(() => {
          setTimeout(() => {
            setCollapsing((prev) => ({ ...prev, [String(idOrProductId)]: 0 }));
          }, 10);
        });

        setTimeout(async () => {
          setDisplayItems((prev) => {
            const next = prev.filter((x) => String(x.id ?? x.productId) !== String(idOrProductId));
            if (next.length === 0) {
              triggerEmptyNotice();
            }
            return next;
          });
          setCollapsing((prev) => {
            const next = { ...prev };
            delete next[String(idOrProductId)];
            return next;
          });
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(String(idOrProductId));
            return next;
          });

          await performRemove({ id: idOrProductId, productId: idOrProductId, storeId });
        }, ANIMATION_DURATION + 20);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error eliminando item:", err);
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(String(idOrProductId));
          return next;
        });
        toast.error("Error eliminando el producto");
      }
    } else {
      await performRemove({ id: idOrProductId, productId: idOrProductId, storeId });
    }
  };

  const confirmRemoveItem = (item) => {
    setItemToConfirm(item);
  };

  const handleConfirmRemove = async () => {
    if (!itemToConfirm) return;
    setItemToConfirm(null);
    await performRemove(itemToConfirm);
  };

  /* -------------------------
     Vaciar carrito: auto-sync + redirect + aviso transitorio
     ------------------------- */
  const openClearModal = () => setShowClearModal(true);
  const closeClearModal = () => setShowClearModal(false);

  const handleClearCartConfirm = async () => {
    try {
      const res = await clearCart();
      if (res && res.success) {
        setDisplayItems([]);
        toast.success("Carrito vaciado");
        triggerEmptyNotice();

        if (typeof fetchCart === "function") {
          try {
            setLoadingServer(true);
            const serverRes = await fetchCart();
            if (serverRes?.cart?.items && Array.isArray(serverRes.cart.items) && serverRes.cart.items.length > 0) {
              const mapped = serverRes.cart.items.map((it) => ({
                id: it.id,
                productId: it.productId ?? it.id ?? null,
                storeId: it.storeId,
                title: it.title || it.product?.title || it.name || "",
                price: Number(it.price || 0),
                quantity: Number(it.quantity || 0),
                image:
                  it.image ||
                  it.product?.image ||
                  (Array.isArray(it.product?.images) && it.product.images[0]) ||
                  null,
                stock: it.stock ?? it.product?.stock ?? undefined,
              }));
              setDisplayItems(mapped);
              toast.success("Se restauraron items desde el servidor");
              return;
            }
            router.push("/");
            return;
          } catch (syncErr) {
            // eslint-disable-next-line no-console
            console.warn("Error sincronizando después de vaciar:", syncErr);
            router.push("/");
            return;
          } finally {
            setLoadingServer(false);
          }
        } else {
          router.push("/");
          return;
        }
      } else {
        toast.error("No se pudo vaciar el carrito");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error vaciando carrito:", err);
      toast.error("Error vaciando carrito");
    } finally {
      closeClearModal();
    }
  };

  /* -------------------------
     Checkout directo
     ------------------------- */
  const handleDirectCheckout = async () => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login?callbackUrl=/cart");
      return;
    }

    if (!displayItems || displayItems.length === 0) {
      toast.error("No hay productos en el carrito");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items: displayItems }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || "Error al crear orden");
        return;
      }

      await clearCart();
      setDisplayItems([]);
      const orderId = data?.order?.id || data?.orderId;
      if (orderId) {
        router.push(`/order-success?orderId=${orderId}`);
      } else {
        router.push("/order-success");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error en checkout:", error);
      toast.error("Error procesando la compra");
    }
  };

  // Render empty state
  if (!displayItems || displayItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-4">No tienes productos en tu carrito por ahora.</p>

        {/* Aviso transitorio que se cierra solo */}
        {showEmptyNotice && (
          <div className="mb-4 inline-block bg-white border px-4 py-2 rounded shadow">
            <strong>El carrito está vacío</strong>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ir a comprar
          </button>

          {typeof fetchCart === "function" && (
            <button
              onClick={async () => {
                try {
                  setLoadingServer(true);
                  const serverRes = await fetchCart();
                  if (serverRes?.cart?.items && Array.isArray(serverRes.cart.items) && serverRes.cart.items.length > 0) {
                    const mapped = serverRes.cart.items.map((it) => ({
                      id: it.id,
                      productId: it.productId ?? it.id ?? null,
                      storeId: it.storeId,
                      title: it.title || it.product?.title || it.name || "",
                      price: Number(it.price || 0),
                      quantity: Number(it.quantity || 0),
                      image:
                        it.image ||
                        it.product?.image ||
                        (Array.isArray(it.product?.images) && it.product.images[0]) ||
                        null,
                      stock: it.stock ?? it.product?.stock ?? undefined,
                    }));
                    setDisplayItems(mapped);
                    toast.success("Se restauraron items desde el servidor");
                  } else {
                    toast("No hay items en el servidor");
                  }
                } catch (err) {
                  // eslint-disable-next-line no-console
                  console.warn("Error sincronizando:", err);
                  toast.error("Error sincronizando carrito");
                } finally {
                  setLoadingServer(false);
                }
              }}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Sincronizar carrito
            </button>
          )}
        </div>
      </div>
    );
  }

  /* -------------------------
     Render principal (cuando hay items)
     ------------------------- */
  const subtotalDisplay = subtotal;
  const taxes = taxEstimate;
  const total = totalDisplayed;

  // Item count for header
  const totalItemsCount = (displayItems || []).reduce((acc, it) => acc + Number(it.quantity || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between mb-6 mt-4">
        <h1 className="text-2xl font-bold">Carrito</h1>
        <div className="text-sm text-gray-600">
          {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
        </div>
      </div>

      {loadingServer && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
        </div>
      )}
      {estimating && <p className="text-center text-gray-500 mb-4 text-sm">Obteniendo estimaciones de envío...</p>}

      <div className="space-y-4">
        {displayItems.map((item) => {
          const idKey = String(item.id ?? item.productId);
          const imgSrc =
            item.product?.image ||
            item.image ||
            item.productImage ||
            item.thumbnail ||
            "/images/placeholder.png";

          const displayName = item.title || item.product?.title || item.name || `Producto #${item.productId ?? item.id}`;

          const isRemoving = removingIds.has(idKey);
          const currentHeight = collapsing[idKey];

          const knownStock = item.stock ?? stockMap[item.productId ?? item.id];

          return (
            <div
              key={item.id ?? `${item.productId}-${item.variantId || 0}`}
              ref={(el) => {
                if (!el) return;
                itemRefs.current[idKey] = el;
              }}
              style={
                currentHeight !== undefined
                  ? {
                      height: `${currentHeight}px`,
                      overflow: "hidden",
                      transition: `height ${ANIMATION_DURATION}ms ease, opacity ${ANIMATION_DURATION}ms ease, margin ${ANIMATION_DURATION}ms ease, padding ${ANIMATION_DURATION}ms ease`,
                      opacity: currentHeight === 0 ? 0 : 1,
                    }
                  : undefined
              }
              className={`flex items-center justify-between border p-4 rounded ${currentHeight === 0 ? "pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={imgSrc}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
                  />
                </div>

                <div>
                  <h2 className="font-semibold">{displayName}</h2>

                  <p className="text-sm text-gray-500">Precio unitario: S/ {Number(item.price || 0).toFixed(2)}</p>

                  {/* Controles de cantidad inline */}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleChangeQuantity(item, Number(item.quantity || 1) - 1)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded text-lg disabled:opacity-50"
                      aria-label={`Disminuir cantidad de ${displayName}`}
                      disabled={Number(item.quantity || 0) <= 1 || isRemoving || estimating || loadingServer}
                    >
                      −
                    </button>

                    <div className="px-3 py-1 border rounded text-sm min-w-[40px] text-center">{Number(item.quantity || 0)}</div>

                    <button
                      onClick={() => handleChangeQuantity(item, Number(item.quantity || 0) + 1)}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded text-lg disabled:opacity-50"
                      aria-label={`Aumentar cantidad de ${displayName}`}
                      disabled={!canIncrease(item) || isRemoving || estimating || loadingServer}
                    >
                      +
                    </button>

                    {/* Mostrar stock si está disponible */}
                    {knownStock !== undefined && (
                      <div className="text-xs text-gray-500 ml-3">Stock: {knownStock}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-gray-700 font-semibold">
                  S/ {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => confirmRemoveItem(item)}
                    className="text-red-600 text-sm disabled:opacity-50"
                    aria-label={`Eliminar ${displayName}`}
                    disabled={isRemoving || estimating || loadingServer}
                  >
                    {isRemoving ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de precios */}
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Resumen del pedido</h3>

        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>Subtotal</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>Envío</span>
          <span className="text-gray-600">{shippingEstimate === 0 && !serverEstimates ? "Incluido" : shippingText}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>
            Impuestos {serverEstimates ? "(estimado por servidor)" : "(estimado incluido)"}
          </span>
          <span>S/ {taxEstimate.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-base font-bold mt-3">
          <span>Total</span>
          <span>
            S/ {totalDisplayed.toFixed(2)}
            {serverTotal !== null && serverTotal !== undefined && (
              <span className="text-sm text-gray-500 block">Total servidor: S/ {serverTotal.toFixed(2)}</span>
            )}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {estimating ? "Obteniendo estimaciones de envío e impuestos..." : "Los valores mostrados pueden ser estimados. El costo final se calculará en el checkout."}
        </p>
      </div>

      {/* Total y acciones */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">Total: S/ {totalDisplayed.toFixed(2)}</h2>

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/checkout")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={displayItems.length === 0 || estimating || loadingServer}
          >
            {estimating || loadingServer ? "Procesando..." : "Proceder al pago"}
          </button>

          <button
            onClick={handleDirectCheckout}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={displayItems.length === 0 || estimating || loadingServer}
          >
            Finalizar compra
          </button>

          <button
            onClick={openClearModal}
            className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
            disabled={displayItems.length === 0 || estimating || loadingServer}
          >
            Vaciar carrito
          </button>
        </div>
      </div>

      {/* ModalConfirm reutilizable para vaciar carrito */}
      <ModalConfirm
        open={showClearModal}
        title="Vaciar carrito"
        description="¿Estás seguro que quieres vaciar todo el carrito? Esta acción no se puede deshacer."
        confirmText="Vaciar carrito"
        cancelText="Cancelar"
        onConfirm={handleClearCartConfirm}
        onCancel={closeClearModal}
        confirmRef={confirmButtonRef}
      />

      {/* ModalConfirm reutilizable para eliminar un solo item */}
      <ModalConfirm
        open={!!itemToConfirm}
        title="Eliminar producto"
        description={itemToConfirm ? `¿Eliminar "${itemToConfirm.title || itemToConfirm.name || "este producto"}"? Esta acción quitará el producto del carrito.` : ""}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmRemove}
        onCancel={() => setItemToConfirm(null)}
        confirmRef={confirmButtonRef}
      />
    </div>
  );
}
