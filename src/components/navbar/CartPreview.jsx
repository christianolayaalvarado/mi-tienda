// src/components/navbar/CartPreview.jsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import {
  safeParseLocalCart,
  readCartRaw,
  removeProductFromCart,
} from "./utils";
import toast from "react-hot-toast";

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
  const [localRaw, setLocalRaw] = useState(() => {
    try {
      const raw = typeof window !== "undefined" ? readCartRaw("mi_tienda_cart") : null;
      return Array.isArray(raw) ? raw : (typeof window !== "undefined" ? safeParseLocalCart("mi_tienda_cart") : []);
    } catch {
      return [];
    }
  });
  const mountedRef = useRef(false);
  const removingRef = useRef(new Set());

  // marcar mounted de forma diferida para evitar setState sincrónico en efecto
  useEffect(() => {
    let raf = 0;
    if (typeof window !== "undefined") {
      raf = requestAnimationFrame(() => { mountedRef.current = true; });
    } else {
      mountedRef.current = true;
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      mountedRef.current = false;
    };
  }, []);

  const readLocalSnapshot = () => {
    try {
      if (typeof readLocalCart === "function") {
        const val = readLocalCart();
        if (Array.isArray(val)) return val;
        if (val && typeof val === "object") {
          if (Array.isArray(val.items)) return val.items;
          if (val.cart && Array.isArray(val.cart.items)) return val.cart.items;
        }
      }
    } catch {
      // ignore
    }
    try {
      const parsed = readCartRaw("mi_tienda_cart");
      if (Array.isArray(parsed)) return parsed;
      return safeParseLocalCart("mi_tienda_cart");
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e && e.key && e.key !== "mi_tienda_cart" && e.key !== "cart") return;
      const snapshot = readLocalSnapshot();
      const same =
        Array.isArray(snapshot) &&
        snapshot.length === (localRaw?.length || 0) &&
        snapshot.every((p, i) => {
          const q = localRaw?.[i];
          return q && String(q.productId ?? q.id) === String(p.productId ?? p.id) && q.quantity === p.quantity;
        });
      if (!same) setLocalRaw(snapshot);
    };

    const onCartUpdated = () => {
      const snapshot = readLocalSnapshot();
      const same =
        Array.isArray(snapshot) &&
        snapshot.length === (localRaw?.length || 0) &&
        snapshot.every((p, i) => {
          const q = localRaw?.[i];
          return q && String(q.productId ?? q.id) === String(p.productId ?? p.id) && q.quantity === p.quantity;
        });
      if (!same) setLocalRaw(snapshot);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("cart:updated", onCartUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cart:updated", onCartUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRaw, readLocalCart]);

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
      const found = localRaw.find((x) => String(x.productId ?? x.id) === String(pid));
      return found ? found.name || found.title || null : null;
    };
  }, [localRaw]);

  const safeOnIncrease = (id) => {
    try {
      onIncrease(id);
    } catch (e) {
      console.warn("onIncrease error", e);
    }
  };
  const safeOnDecrease = (id) => {
    try {
      onDecrease(id);
    } catch (e) {
      console.warn("onDecrease error", e);
    }
  };

  const safeOnRemove = async (id, storeId) => {
    const idStr = String(id);
    if (removingRef.current.has(idStr)) return;
    removingRef.current.add(idStr);

    const previous = localRaw;
    const optimistic = (previous || []).filter((it) => String(it.productId ?? it.id) !== idStr);
    setLocalRaw(optimistic);

    try {
      if (typeof onRemove === "function" && onRemove !== (() => {})) {
        const result = onRemove(id, storeId);
        if (result && typeof result.then === "function") {
          await result;
        }
        try { window.dispatchEvent(new CustomEvent("cart:updated", { detail: { removedProductId: id, storeId } })); } catch {}
        try { window.dispatchEvent(new Event("storage")); } catch {}
        toast.success("Producto eliminado del carrito");
        removingRef.current.delete(idStr);
        return result;
      }

      const res = removeProductFromCart(id);
      const snapshot = res || [];
      setLocalRaw(Array.isArray(snapshot) ? snapshot : []);
      toast.success("Producto eliminado del carrito");
      removingRef.current.delete(idStr);
      return res;
    } catch (err) {
      console.error("Error en onRemove:", err);
      toast.error("No se pudo eliminar el producto");
      try {
        const snapshot = readLocalSnapshot();
        setLocalRaw(snapshot);
      } catch {
        setLocalRaw(previous);
      }
      removingRef.current.delete(idStr);
      throw err;
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
        const maxStock = Number(item.stock ?? item.product?.stock ?? Infinity);
        const idForActions = item.id ?? item.productId;
        const disabledInc = quantity >= maxStock;
        const removing = removingRef.current.has(String(idForActions));

        return (
          <div
            key={key}
            className={`flex items-center gap-3 py-2 border-b last:border-none hover:bg-gray-50 rounded-lg px-2 transition ${removing ? "opacity-60" : ""}`}
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

              <p className="text-gray-500 text-xs">S/ {Number(item.price || 0).toFixed(2)} × {quantity}</p>

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => safeOnDecrease(idForActions)}
                  className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 text-base"
                  disabled={quantity <= 1 || removing}
                  aria-label={`Disminuir cantidad de ${displayName}`}
                >
                  −
                </button>

                <span className="text-xs w-6 text-center" aria-live="polite">{quantity}</span>

                <button
                  type="button"
                  onClick={() => safeOnIncrease(idForActions)}
                  disabled={disabledInc || removing}
                  aria-disabled={disabledInc || removing}
                  title={disabledInc ? "Stock máximo alcanzado" : "Aumentar cantidad"}
                  className="w-9 h-9 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40 text-base"
                  aria-label={`Aumentar cantidad de ${displayName}`}
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => safeOnRemove(idForActions, item.storeId ?? undefined)}
              className="p-1 rounded hover:bg-red-100 transition"
              aria-label={`Eliminar ${item.title || item.name || "producto"}`}
              title="Eliminar"
              disabled={removing}
            >
              <Trash2 size={20} className={`text-gray-500 ${removing ? "opacity-40" : "hover:text-red-600"}`} />
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
