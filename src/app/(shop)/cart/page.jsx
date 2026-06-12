// src/app/(shop)/cart/page.jsx
"use client";

/**
 * Cart page actualizado: precios ya incluyen impuestos y envío
 *
 * Cambios clave:
 * - Los precios mostrados en el carrito ya incluyen impuestos y envío.
 * - Calculamos y mostramos la porción estimada de impuestos incluida en el subtotal.
 * - El envío se marca como "Incluido" (valor 0 en el cálculo). En el futuro, cuando haya delivery con costo,
 *   reemplazar la lógica para sumar el costo de envío al total.
 * - El total ahora es simplemente el subtotal (porque ya incluye impuestos y envío).
 *
 * Mantiene:
 * - Modal de confirmación para vaciar carrito.
 * - Animación de colapso al eliminar items.
 * - Sincronización con CartContext y safeParseLocalCart.
 * - Toasters y manejo optimista al eliminar.
 */

import React, { useEffect, useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchSession } from "@/lib/useSessionCheck";
import { safeParseLocalCart } from "@/components/navbar/utils";
import toast from "react-hot-toast";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, fetchCart } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [displayItems, setDisplayItems] = useState([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [showClearModal, setShowClearModal] = useState(false);
  const confirmButtonRef = useRef(null);

  // Refs para medir y animar cada item
  const itemRefs = useRef({});
  const [collapsing, setCollapsing] = useState({}); // { [id]: currentHeightOrZero }

  const ANIMATION_DURATION = 300; // ms

  // Configuración de negocio simple (ajusta según tu lógica real)
  // TAX_RATE representa la tasa aplicada dentro del precio (ej. 0.18 = 18%)
  const TAX_RATE = 0.18; // 18% de ejemplo

  // Nota: envío actualmente incluido en el precio; cuando se implemente delivery con costo,
  // reemplazar la lógica para sumar shipping al total.
  const SHIPPING_INCLUDED = true;

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

  // Cálculos de resumen
  // subtotal: suma de precios tal como están (ya incluyen impuestos y envío)
  const subtotal = (displayItems || []).reduce(
    (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
    0
  );

  // Si los precios ya incluyen impuestos, calculamos la porción estimada de impuestos incluida:
  // impuesto_incluido = subtotal * TAX_RATE / (1 + TAX_RATE)
  const includedTaxes = subtotal > 0 ? (subtotal * TAX_RATE) / (1 + TAX_RATE) : 0;

  // Envío actualmente incluido en el precio
  const shipping = SHIPPING_INCLUDED ? 0 : 0; // placeholder si en el futuro se aplica shipping real

  // Total: como los precios ya incluyen impuestos y envío, el total es el subtotal
  const total = subtotal;

  // Eliminar item con animación de colapso
  const handleRemove = async (item) => {
    const idOrProductId = item.id ?? item.productId;
    if (!idOrProductId) {
      toast.error("Identificador de producto inválido");
      return;
    }

    // Marcar como "eliminando" para deshabilitar botones
    setRemovingIds((prev) => new Set(prev).add(String(idOrProductId)));

    try {
      // Llamada al contexto para persistir el cambio
      const res = await removeFromCart(idOrProductId, item.storeId);

      if (!res || res.success === false) {
        // Revertir estado de "eliminando"
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

      // Si la eliminación en backend fue exitosa, animamos la salida en frontend
      const el = itemRefs.current[String(idOrProductId)];
      if (!el) {
        // Si no hay referencia, eliminar inmediatamente
        setDisplayItems((prev) => prev.filter((x) => String(x.id ?? x.productId) !== String(idOrProductId)));
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(String(idOrProductId));
          return next;
        });
        toast.success("Producto eliminado");
        return;
      }

      // Medir altura actual
      const measuredHeight = el.scrollHeight;
      // Establecer altura inicial para animar desde esa altura
      setCollapsing((prev) => ({ ...prev, [String(idOrProductId)]: measuredHeight }));

      // Forzar reflow y luego colapsar a 0
      requestAnimationFrame(() => {
        // pequeño delay para asegurar que el estilo inicial se aplique
        setTimeout(() => {
          setCollapsing((prev) => ({ ...prev, [String(idOrProductId)]: 0 }));
        }, 10);
      });

      // Después de la animación, quitar el item del estado
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

  // Modal de vaciado
  const openClearModal = () => setShowClearModal(true);
  const closeClearModal = () => setShowClearModal(false);

  const handleClearCartConfirm = async () => {
    try {
      const res = await clearCart();
      if (res && res.success) {
        setDisplayItems([]);
        toast.success("Carrito vaciado");
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

  // Manejo de teclado para el modal (Escape cierra)
  useEffect(() => {
    if (!showClearModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeClearModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showClearModal]);

  // Enfocar botón confirmar cuando el modal se abre
  useEffect(() => {
    if (showClearModal && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [showClearModal]);

  // Render empty state
  if (!displayItems || displayItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-4">No tienes productos en tu carrito por ahora.</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Ir a comprar
          </button>
          <button
            onClick={() => {
              if (typeof fetchCart === "function") {
                fetchCart().then(() => toast.success("Sincronizado"));
              } else {
                toast("Sincronización no disponible");
              }
            }}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Sincronizar carrito
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Carrito</h1>

      {loadingServer && <p className="text-center text-gray-500 mb-4">Cargando carrito...</p>}

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
              // Aplicar estilos de colapso si existe una entrada en collapsing
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
                    onClick={() => handleRemove(item)}
                    className="text-red-600 text-sm disabled:opacity-50"
                    aria-label={`Eliminar ${displayName}`}
                    disabled={isRemoving}
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
          <span>Subtotal (incluye impuestos y envío)</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>Envío</span>
          <span className="text-gray-600">Incluido</span>
        </div>

        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span>Impuestos estimados incluidos ({(TAX_RATE * 100).toFixed(0)}%)</span>
          <span>S/ {includedTaxes.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-base font-bold mt-3">
          <span>Total</span>
          <span>S/ {total.toFixed(2)}</span>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Los precios mostrados ya incluyen impuestos y envío. Si en el futuro se aplica un cargo por delivery,
          se mostrará y sumará aquí antes de confirmar el pago.
        </p>
      </div>

      {/* Total y acciones */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">Total: S/ {total.toFixed(2)}</h2>

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/checkout")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            disabled={displayItems.length === 0}
          >
            Proceder al pago
          </button>

          <button
            onClick={handleDirectCheckout}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            disabled={displayItems.length === 0}
          >
            Finalizar compra
          </button>

          <button
            onClick={openClearModal}
            className="bg-gray-200 px-6 py-2 rounded hover:bg-gray-300"
            disabled={displayItems.length === 0}
          >
            Vaciar carrito
          </button>
        </div>
      </div>

      {/* Modal de confirmación para vaciar carrito */}
      {showClearModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-cart-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeClearModal}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-10">
            <h3 id="clear-cart-title" className="text-lg font-semibold mb-2">
              Vaciar carrito
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro que quieres vaciar todo el carrito? Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeClearModal}
                className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                ref={confirmButtonRef}
                onClick={handleClearCartConfirm}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
