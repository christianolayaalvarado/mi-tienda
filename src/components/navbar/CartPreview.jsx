// src/components/navbar/CartPreview.jsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { safeParseLocalCart } from "./utils";

export default function CartPreview({
  open,
  items = null, // si null -> intentar usar contexto o local
  subtotal = null,
  onIncrease = () => {},
  onDecrease = () => {},
  onRemove = () => {},
  onClose = () => {},
  readLocalCart = null, // función opcional que devuelve el carrito ya leído en cliente
}) {
  const router = useRouter();

  if (!open) return null;

  const { cartItems: ctxCartItems } = useCart() ?? {};
  const [localRaw, setLocalRaw] = useState([]);
  const [resolvedItems, setResolvedItems] = useState([]);

  // Cargar localStorage de forma segura (solo en cliente)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const val = typeof readLocalCart === "function" ? readLocalCart() : null;
      if (Array.isArray(val)) {
        setLocalRaw(val);
      } else {
        // fallback seguro
        setLocalRaw(safeParseLocalCart("mi_tienda_cart"));
      }
    } catch (e) {
      setLocalRaw(safeParseLocalCart("mi_tienda_cart"));
    }
  }, [readLocalCart]);

  // Resolver items a mostrar: prioridad props.items > contexto > localStorage
  useEffect(() => {
    if (Array.isArray(items) && items.length > 0) {
      setResolvedItems(items);
      return;
    }
    if (Array.isArray(ctxCartItems) && ctxCartItems.length > 0) {
      setResolvedItems(ctxCartItems);
      return;
    }
    setResolvedItems(localRaw || []);
  }, [items, ctxCartItems, localRaw]);

  // Calcular subtotal si no fue provisto
  const computedSubtotal = useMemo(() => {
    if (typeof subtotal === "number") return subtotal;
    return (resolvedItems || []).reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
  }, [resolvedItems, subtotal]);

  // Helper para buscar nombre en localRaw
  const findLocalName = useMemo(() => {
    return (pid) => {
      if (!localRaw || !Array.isArray(localRaw)) return null;
      const found = localRaw.find((x) => String(x.productId ?? x.id) === String(pid));
      return found ? (found.name || found.title || null) : null;
    };
  }, [localRaw]);

  // Manejo defensivo de callbacks (asegurar firma) y logs para depuración
  const safeOnIncrease = (id) => {
    try {
      // eslint-disable-next-line no-console
      console.log("[CartPreview] increase requested:", id);
      onIncrease(id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("onIncrease error", e);
    }
  };
  const safeOnDecrease = (id) => {
    try {
      // eslint-disable-next-line no-console
      console.log("[CartPreview] decrease requested:", id);
      onDecrease(id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("onDecrease error", e);
    }
  };
  const safeOnRemove = (id, storeId) => {
    try {
      // eslint-disable-next-line no-console
      console.log("[CartPreview] remove requested:", { id, storeId });
      onRemove(id, storeId);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("onRemove error", e);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Mini carrito"
      className="absolute right-0 top-10 w-80 bg-white shadow-xl border rounded-lg p-4 z-50"
    >
      <h3 className="font-semibold mb-3">Carrito</h3>

      {(!resolvedItems || resolvedItems.length === 0) && (
        <p className="text-sm text-gray-500">El carrito está vacío</p>
      )}

      {(resolvedItems || []).map((item) => {
        const imgSrc =
          item.image ||
          (Array.isArray(item.images) && item.images[0]) ||
          (item.product && Array.isArray(item.product.images) && item.product.images[0]) ||
          item.product?.image ||
          "/images/placeholder.png";

        const displayName =
          item.name ||
          item.title ||
          item.product?.title ||
          item.product?.name ||
          findLocalName(item.productId ?? item.id) ||
          "Producto";

        const key = item.id ?? `${item.productId}-${item.storeId ?? 0}`;

        const quantity = Number(item.quantity || 0);
        const maxStock = Number(item.stock ?? Infinity);

        const idForActions = item.id ?? item.productId;

        return (
          <div
            key={key}
            className="flex items-center gap-3 py-2 border-b last:border-none hover:bg-gray-50 rounded-lg px-2 transition"
          >
            <Link href={`/product/${item.productId ?? item.id}`} onClick={onClose} className="w-16 h-16 block">
              <img
                src={imgSrc}
                alt={displayName}
                width={64}
                height={64}
                className="object-cover rounded w-16 h-16"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/placeholder.png";
                }}
              />
            </Link>

            <div className="flex-1 text-sm min-w-0">
              <Link href={`/product/${item.productId ?? item.id}`} onClick={onClose}>
                <p className="truncate font-medium hover:text-green-600 cursor-pointer" title={displayName}>
                  {displayName}
                </p>
              </Link>

              <p className="text-gray-500 text-xs">
                S/ {Number(item.price || 0).toFixed(2)} × {quantity}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => safeOnDecrease(idForActions)}
                  className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                  aria-label={`Disminuir cantidad de ${displayName}`}
                  disabled={quantity <= 1}
                >
                  −
                </button>

                <span className="text-xs w-6 text-center" aria-live="polite">
                  {quantity}
                </span>

                <button
                  onClick={() => safeOnIncrease(idForActions)}
                  disabled={quantity >= maxStock}
                  className="px-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40"
                  aria-label={`Aumentar cantidad de ${displayName}`}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => safeOnRemove(idForActions, item.storeId ?? undefined)}
              className="p-1 rounded hover:bg-red-100 transition"
              aria-label={`Eliminar ${item.title || item.name || "producto"}`}
              title="Eliminar"
            >
              <Trash2 size={20} className="text-gray-500 hover:text-red-600" />
            </button>
          </div>
        );
      })}

      {resolvedItems && resolvedItems.length > 0 && (
        <>
          <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm font-semibold">
            <span>Subtotal</span>
            <span>S/ {computedSubtotal.toFixed(2)}</span>
          </div>

          <div className="mt-4">
            <button
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={() => {
                try {
                  onClose?.();
                } catch (e) {
                  // ignore
                }
                router.push("/cart");
              }}
              aria-label="Ver carrito"
            >
              Ver carrito
            </button>
          </div>
        </>
      )}
    </div>
  );
}
