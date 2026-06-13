// src/components/navbar/CartPreview.jsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { safeParseLocalCart } from "./utils";

export default function CartPreview(props) {
  const {
    open,
    items = null,
    subtotal = null,
    onIncrease = () => {},
    onDecrease = () => {},
    onRemove = () => {},
    onClose = () => {},
    readLocalCart = null,
  } = props;

  const router = useRouter();
  const { cartItems: ctxCartItems } = useCart() ?? {};
  const [localRaw, setLocalRaw] = useState([]);
  const mountedRef = useRef(false);

  // Leer localStorage solo en cliente y solo actualizar si cambia
  useEffect(() => {
    mountedRef.current = true;
    if (typeof window === "undefined") return () => (mountedRef.current = false);

    let parsed = [];
    try {
      const val = typeof readLocalCart === "function" ? readLocalCart() : null;
      parsed = Array.isArray(val) ? val : safeParseLocalCart("mi_tienda_cart");
    } catch {
      parsed = safeParseLocalCart("mi_tienda_cart");
    }

    // comparar superficialmente para evitar setState innecesario
    const same =
      Array.isArray(parsed) &&
      parsed.length === (localRaw?.length || 0) &&
      parsed.every((p, i) => {
        const q = localRaw?.[i];
        return q && String(q.productId ?? q.id) === String(p.productId ?? p.id) && q.quantity === p.quantity;
      });

    if (!same && mountedRef.current) {
      setLocalRaw(parsed);
    }

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readLocalCart]); // no dependemos de localRaw aquí para evitar loop

  // resolvedItems derivado (no state) para evitar efectos que llamen a setState
  const resolvedItems = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) return items;
    if (Array.isArray(ctxCartItems) && ctxCartItems.length > 0) return ctxCartItems;
    return localRaw || [];
  }, [items, ctxCartItems, localRaw]);

  const computedSubtotal = useMemo(() => {
    if (typeof subtotal === "number") return subtotal;
    return (resolvedItems || []).reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
  }, [resolvedItems, subtotal]);

  const findLocalName = useMemo(() => {
    return (pid) => {
      if (!localRaw || !Array.isArray(localRaw)) return null;
      const found = localRaw.find(
        (x) => String(x.productId ?? x.id) === String(pid)
      );
      return found ? found.name || found.title || null : null;
    };
  }, [localRaw]);

  const safeOnIncrease = (id) => {
    try {
      console.log("[CartPreview] increase requested:", id);
      onIncrease(id);
    } catch (e) {
      console.warn("onIncrease error", e);
    }
  };
  const safeOnDecrease = (id) => {
    try {
      console.log("[CartPreview] decrease requested:", id);
      onDecrease(id);
    } catch (e) {
      console.warn("onDecrease error", e);
    }
  };
  const safeOnRemove = (id, storeId) => {
    try {
      console.log("[CartPreview] remove requested:", { id, storeId });
      onRemove(id, storeId);
    } catch (e) {
      console.warn("onRemove error", e);
    }
  };

  if (!open) return null;

  const content = (
    <div
      role="dialog"
      aria-label="Mini carrito"
      className="fixed right-4 top-16 w-80 bg-white shadow-xl border rounded-lg p-4 z-[9999]"
      style={{ pointerEvents: "auto" }}
    >
      <h3 className="font-semibold mb-3">Carrito</h3>

      {(!resolvedItems || resolvedItems.length === 0) && (
        <p className="text-sm text-gray-500">El carrito está vacío</p>
      )}

      {(resolvedItems || []).map((item) => {
        const imgSrc =
          item.image ||
          (Array.isArray(item.images) && item.images[0]) ||
          (item.product &&
            Array.isArray(item.product.images) &&
            item.product.images[0]) ||
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
        // usar stock del item o del producto si existe
        const maxStock = Number(item.stock ?? item.product?.stock ?? Infinity);
        const idForActions = item.id ?? item.productId;
        const disabledInc = quantity >= maxStock;

        return (
          <div
            key={key}
            className="flex items-center gap-3 py-2 border-b last:border-none hover:bg-gray-50 rounded-lg px-2 transition"
          >
            <Link
              href={`/product/${item.productId ?? item.id}`}
              onClick={onClose}
              className="w-16 h-16 block"
            >
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
              <Link
                href={`/product/${item.productId ?? item.id}`}
                onClick={onClose}
              >
                <p
                  className="truncate font-medium hover:text-green-600 cursor-pointer"
                  title={displayName}
                >
                  {displayName}
                </p>
              </Link>

              <p className="text-gray-500 text-xs">
                S/ {Number(item.price || 0).toFixed(2)} × {quantity}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => safeOnDecrease(idForActions)}
                  className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                  disabled={quantity <= 1}
                  aria-label={`Disminuir cantidad de ${displayName}`}
                >
                  −
                </button>

                <span
                  className="text-xs w-6 text-center"
                  aria-live="polite"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => safeOnIncrease(idForActions)}
                  disabled={disabledInc}
                  aria-disabled={disabledInc}
                  title={disabledInc ? "Stock máximo alcanzado" : "Aumentar cantidad"}
                  className="px-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40"
                  aria-label={`Aumentar cantidad de ${displayName}`}
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                safeOnRemove(idForActions, item.storeId ?? undefined)
              }
              className="p-1 rounded hover:bg-red-100 transition"
              aria-label={`Eliminar ${item.title || item.name || "producto"}`}
              title="Eliminar"
            >
              <Trash2
                size={20}
                className="text-gray-500 hover:text-red-600"
              />
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
              type="button"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={() => {
                console.log("[CartPreview] navigate to /cart");
                onClose?.();
                setTimeout(() => router.push("/cart"), 50);
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

  if (typeof window !== "undefined" && document.body) {
    return ReactDOM.createPortal(content, document.body);
  }
  return null;
}
