// src/app/(shop)/cart/page.jsx
"use client";

/**
 * Cart page corregida
 *
 * Cambios clave:
 * - No leer localStorage en el render; usar safeParseLocalCart en useEffect.
 * - Comprobar sesión con fetchSession antes de llamar a endpoints que requieran auth.
 * - Mantener fallback local mientras se resuelve la sesión/servidor.
 * - Manejo de errores y UX más robusto.
 */

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { fetchSession } from "@/lib/useSessionCheck";
import { safeParseLocalCart } from "@/components/navbar/utils";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart, fetchCart } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Local UI state: items mostrados (puede venir de localStorage o del contexto)
  const [displayItems, setDisplayItems] = useState([]);
  const [loadingServer, setLoadingServer] = useState(false);

  // Total calculado sobre displayItems (no sobre cartItems directamente para evitar flashes)
  const total = (displayItems || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  // Cargar localStorage de forma segura y luego intentar sincronizar con servidor si hay sesión
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Cargar fallback local inmediatamente
    const local = safeParseLocalCart("mi_tienda_cart");
    setDisplayItems(local);

    // 2) Si useSession está cargando, esperar; si ya hay sesión, refrescar desde servidor
    (async () => {
      try {
        // Esperar a que next-auth determine el estado; si está en loading, no forzamos fetch aquí
        if (status === "loading") return;

        // Comprobar sesión con util central (evita llamadas innecesarias a /api/cart)
        const user = await fetchSession();
        if (!user) {
          // No hay sesión: mantener local
          return;
        }

        // Hay sesión: intentar obtener carrito del servidor (si tu contexto ya lo hace, puedes omitir)
        setLoadingServer(true);
        // Intentamos usar fetchCart del contexto si está disponible (mejor para mantener estado global)
        if (typeof fetchCart === "function") {
          const res = await fetchCart();
          // fetchCart ya actualiza el contexto y localStorage; sincronizamos displayItems con cartItems del contexto
          // Esperamos un pequeño tick para que cartItems del contexto se actualice; si no, fallback a res.cart
          if (res?.cart?.items && Array.isArray(res.cart.items)) {
            setDisplayItems(
              res.cart.items.map((it) => ({
                id: it.id,
                productId: it.productId ?? it.id ?? null,
                storeId: it.storeId,
                title: it.title || it.product?.title || it.name || "",
                price: it.price,
                quantity: Number(it.quantity || 0),
                image:
                  it.image ||
                  it.product?.image ||
                  (Array.isArray(it.product?.images) && it.product.images[0]) ||
                  null,
              }))
            );
          } else {
            // Si fetchCart no devolvió items, sincronizar con cartItems del contexto (si existen)
            // (cartItems puede estar vacío si fetchCart falló; en ese caso mantenemos local)
          }
        } else {
          // Fallback: llamada directa (defensiva)
          const res = await fetch("/api/cart", { credentials: "include", headers: { Accept: "application/json" } });
          if (!res.ok) {
            // No reemplazar local si servidor falla
            setLoadingServer(false);
            return;
          }
          const data = await res.json().catch(() => null);
          const serverItems = (data?.cart?.items || []).map((it) => ({
            id: it.id,
            productId: it.productId ?? it.id ?? null,
            storeId: it.storeId,
            title: it.title || it.product?.title || it.name || "",
            price: it.price,
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
        // No bloquear la UI por errores de red
        // eslint-disable-next-line no-console
        console.warn("Error sincronizando carrito:", err);
      } finally {
        setLoadingServer(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Si el contexto cartItems cambia (por acciones en otras partes de la app), sincronizamos la vista
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;
    // Mapear cartItems del contexto a la forma de displayItems
    const mapped = cartItems.map((it) => ({
      id: it.id,
      productId: it.productId ?? it.id ?? null,
      storeId: it.storeId,
      title: it.title || it.product?.title || it.name || "",
      price: it.price,
      quantity: Number(it.quantity || 0),
      image:
        it.image ||
        it.product?.image ||
        (Array.isArray(it.product?.images) && it.product.images[0]) ||
        null,
    }));
    setDisplayItems(mapped);
  }, [cartItems]);

  // 🔥 Finalizar compra directo (sin checkout)
  const handleDirectCheckout = async () => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login?callbackUrl=/cart");
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
        alert(data?.error || "Error al crear orden");
        return;
      }

      // Limpiar carrito (contexto y local)
      await clearCart();
      // Refrescar vista
      setDisplayItems([]);
      router.push(`/order-success?orderId=${data.orderId}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error en checkout:", error);
      alert("Error procesando la compra");
    }
  };

  // Handler para eliminar: usar removeFromCart del contexto y sincronizar vista
  const handleRemove = async (item) => {
    try {
      // removeFromCart espera id o productId; usamos productId si id no existe
      const idOrProductId = item.id ?? item.productId;
      const res = await removeFromCart(idOrProductId, item.storeId);
      // Si la operación fue exitosa, actualizar displayItems
      if (res && res.success) {
        setDisplayItems((prev) => prev.filter((x) => String(x.id ?? x.productId) !== String(idOrProductId)));
      } else {
        // Si falló, mostrar mensaje (res puede contener status 401)
        if (res?.status === 401) {
          // Redirigir a login si es necesario
          router.push(`/login?callbackUrl=/cart`);
          return;
        }
        alert(res?.error || "No se pudo eliminar el producto del carrito");
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error eliminando item:", err);
      alert("Error eliminando el producto");
    }
  };

  if (!displayItems || displayItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <button onClick={() => router.push("/")} className="bg-green-600 text-white px-4 py-2 rounded">
          Ir a comprar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Carrito</h1>

      <div className="space-y-4">
        {displayItems.map((item) => {
          const imgSrc =
            item.product?.image ||
            item.image ||
            item.productImage ||
            item.thumbnail ||
            "/images/placeholder.png";

          // Mostrar nombre: preferir title/name del item; si no existe, usar fallback con productId
          const displayName = item.title || item.product?.title || item.name || `Producto #${item.productId ?? item.id}`;

          return (
            <div
              key={item.id || `${item.productId}-${item.variantId || 0}`}
              className="flex items-center justify-between border p-4 rounded"
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
                    className="text-red-600 text-sm"
                    aria-label={`Eliminar ${displayName}`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 Total y acciones */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">Total: S/ {total.toFixed(2)}</h2>

        <div className="flex gap-4">
          {/* Proceder al pago → Checkout */}
          <button onClick={() => router.push("/checkout")} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Proceder al pago
          </button>

          {/* Finalizar compra directo */}
          <button onClick={handleDirectCheckout} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Finalizar compra
          </button>
        </div>
      </div>
    </div>
  );
}
