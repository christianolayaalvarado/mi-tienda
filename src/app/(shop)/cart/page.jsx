// src/app/(shop)/cart/page.jsx
"use client";

/**
 * Cart page con:
 * - Modal reutilizable de confirmación (componente interno).
 * - Confirmación por item antes de eliminar.
 * - Contador de items en el encabezado.
 * - Indicadores de carga/estimación que deshabilitan acciones.
 * - Animación de colapso al eliminar un item.
 * - Sincronización con CartContext, toasts y safeParseLocalCart.
 */

import React, { useEffect, useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchSession } from "@/lib/useSessionCheck";
import { safeParseLocalCart } from "@/components/navbar/utils";
import toast from "react-hot-toast";

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
  const { cartItems, removeFromCart, clearCart, fetchCart } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [displayItems, setDisplayItems] = useState([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [showClearModal, setShowClearModal] = useState(false);
  const [itemToConfirm, setItemToConfirm] = useState(null); // item pending delete confirmation
  const confirmButtonRef = useRef(null);

  // Refs para medir y animar cada item
  const itemRefs = useRef({});
  const [collapsing, setCollapsing] = useState({}); // { [id]: currentHeightOrZero }

  const ANIMATION_DURATION = 300; // ms

  // Estimaciones del servidor
  const [estimating, setEstimating] = useState(false);
  const [serverEstimates, setServerEstimates] = useState(null);

  // TAX_RATE local fallback (solo si backend no responde)
  const TAX_RATE_FALLBACK = 0.18; // 18% ejemplo

  // Mapear displayItems a partir de cartItems o localStorage
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
        }))
      );
    } else {
      setDisplayItems([]);
    }

    (async () => {
      try {
        if (status === "loading") return;
        const user = await fetchSession();
        if (!user) return;

        setLoadingServer(true);
        if (typeof fetchCart === "function") {
          const res = await fetchCart();
          if (res?.cart?.items && Array.isArray(res.cart.items) && res.cart.items.length > 0) {
            const mapped = res.cart.items.map((it) => ({
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
            }));
            setDisplayItems(mapped);
          }
        } else {
          const res = await fetch("/api/cart", { credentials: "include", headers: { Accept: "application/json" } });
          if (!res.ok) {
            setLoadingServer(false);
            return;
          }
          const data = await res.json().catch(() => null);
          const serverItems = (data?.cart?.items || []).map((it) => ({
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
          }));
          if (serverItems.length > 0) setDisplayItems(serverItems);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Error sincronizando carrito:", err);
      } finally {
        setLoadingServer(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
    }));
    setDisplayItems(mapped);
  }, [cartItems]);

  // Construir payload simple para estimaciones
  const buildEstimatePayload = () => {
    return {
      items: (displayItems || []).map((it) => ({
        productId: it.productId ?? it.id,
        quantity: Number(it.quantity || 0),
        price: Number(it.price || 0),
      })),
    };
  };

  // Llamada al backend para obtener estimaciones (shipping + taxes)
  const fetchEstimates = async () => {
    if (!displayItems || displayItems.length === 0) return null;
    setEstimating(true);
    try {
      const payload = buildEstimatePayload();
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        // fallback: no reemplazar estimaciones locales
        // eslint-disable-next-line no-console
        console.warn("Estimate API responded with non-ok:", res.status);
        setEstimating(false);
        return null;
      }
      const data = await res.json().catch(() => null);
      setEstimating(false);
      if (!data) return null;
      setServerEstimates({
        shippingEstimate: typeof data.shippingEstimate === "number" ? data.shippingEstimate : null,
        taxEstimate: typeof data.taxEstimate === "number" ? data.taxEstimate : null,
        currency: data.currency || "PEN",
      });
      return data;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Error fetching estimates:", err);
      setEstimating(false);
      return null;
    }
  };

  // Recalcular estimaciones cada vez que cambian los items
  useEffect(() => {
    setServerEstimates(null);
    if (!displayItems || displayItems.length === 0) return;
    const t = setTimeout(() => {
      fetchEstimates();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayItems]);

  // Cálculos de resumen
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

  // Eliminar item con animación de colapso (ejecuta la eliminación real)
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

      const el = itemRefs.current[String(idOrProductId)];
      if (!el) {
        setDisplayItems((prev) => prev.filter((x) => String(x.id ?? x.productId) !== String(idOrProductId)));
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(String(idOrProductId));
          return next;
        });
        toast.success("Producto eliminado");
        return;
      }

      const measuredHeight = el.scrollHeight;
      setCollapsing((prev) => ({ ...prev, [String(idOrProductId)]: measuredHeight }));

      requestAnimationFrame(() => {
        setTimeout(() => {
          setCollapsing((prev) => ({ ...prev, [String(idOrProductId)]: 0 }));
        }, 10);
      });

      setTimeout(() => {
        setDisplayItems((prev) => prev.filter((x) => String(x.id ?? x.productId) !== String(idOrProductId)));
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
        toast.success("Producto eliminado");
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
  };

  // Handler que abre modal para confirmar eliminación de un solo item
  const confirmRemoveItem = (item) => {
    setItemToConfirm(item);
  };

  // Ejecuta la eliminación confirmada por el modal de item
  const handleConfirmRemove = async () => {
    if (!itemToConfirm) return;
    // cerrar modal antes de ejecutar para mejorar UX
    setItemToConfirm(null);
    // ejecutar la eliminación real (performRemove) con la misma lógica
    await performRemove(itemToConfirm);
  };

  // Modal de vaciado (usa ModalConfirm)
  const openClearModal = () => setShowClearModal(true);
  const closeClearModal = () => setShowClearModal(false);

  const handleClearCartConfirm = async () => {
    try {
      const res = await clearCart();
      if (res && res.success) {
        setDisplayItems([]);
        toast.success("Carrito vaciado");

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

  // Checkout directo
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
      router.push(`/order-success?orderId=${data.orderId}`);
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

  // Item count for header
  const totalItemsCount = (displayItems || []).reduce((acc, it) => acc + Number(it.quantity || 0), 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Carrito</h1>
        <div className="text-sm text-gray-600">
          {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
        </div>
      </div>

      {loadingServer && <p className="text-center text-gray-500 mb-4">Cargando carrito...</p>}
      {estimating && <p className="text-center text-gray-500 mb-4">Obteniendo estimaciones...</p>}

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

                  <p className="text-sm text-gray-500">Cantidad: {Number(item.quantity || 0)}</p>
                  <p className="text-sm text-gray-500">Precio unitario: S/ {Number(item.price || 0).toFixed(2)}</p>
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
