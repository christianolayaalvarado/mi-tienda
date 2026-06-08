// components/navbar/CartPreview.jsx
"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function CartPreview({
  open,
  items = [],
  subtotal = 0,
  onIncrease = () => {},
  onDecrease = () => {},
  onRemove = () => {},
  onClose = () => {},
  readLocalCart = () => null, // debe ser una función que devuelva el valor ya leído en cliente
}) {
  if (!open) return null;

  // No leer localStorage directamente en render.
  // readLocalCart puede devolver el valor ya leído por el padre (síncrono) o null.
  const [localRaw, setLocalRaw] = useState(null);

  useEffect(() => {
    // Ejecutar solo en cliente
    if (typeof window === "undefined") return;
    try {
      const val = typeof readLocalCart === "function" ? readLocalCart() : null;
      setLocalRaw(val);
    } catch {
      setLocalRaw(null);
    }
  }, [readLocalCart]);

  const findLocalName = useMemo(() => {
    return (pid) => {
      if (!localRaw || !Array.isArray(localRaw)) return null;
      const found = localRaw.find((x) => String(x.productId ?? x.id) === String(pid));
      return found ? (found.name || found.title || null) : null;
    };
  }, [localRaw]);

  return (
    <div
      role="dialog"
      aria-label="Mini carrito"
      className="absolute right-0 top-10 w-80 bg-white shadow-xl border rounded-lg p-4 z-50"
    >
      <h3 className="font-semibold mb-3">Carrito</h3>

      {(!items || items.length === 0) && (
        <p className="text-sm text-gray-500">El carrito está vacío</p>
      )}

      {(items || []).map((item) => {
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

        return (
          <div
            key={key}
            className="flex items-center gap-3 py-2 border-b last:border-none hover:bg-gray-50 rounded-lg px-2 transition"
          >
            <Link href={`/product/${item.productId}`} className="w-16 h-16 block">
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

            <div className="flex-1 text-sm">
              <Link href={`/product/${item.productId}`}>
                <p className="truncate font-medium hover:text-green-600 cursor-pointer" title={displayName}>
                  {displayName}
                </p>
              </Link>

              <p className="text-gray-500 text-xs">
                S/ {Number(item.price || 0).toFixed(2)} × {Number(item.quantity || 0)}
              </p>

              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => onDecrease(item.id ?? item.productId)}
                  className="px-2 bg-gray-200 rounded hover:bg-gray-300"
                  aria-label={`Disminuir cantidad de ${displayName}`}
                >
                  −
                </button>

                <span className="text-xs w-6 text-center" aria-live="polite">
                  {Number(item.quantity || 0)}
                </span>

                <button
                  onClick={() => onIncrease(item.id ?? item.productId)}
                  disabled={Number(item.quantity || 0) >= (item.stock ?? Infinity)}
                  className="px-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40"
                  aria-label={`Aumentar cantidad de ${displayName}`}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={() => onRemove(item.id ?? item.productId, item.storeId ?? undefined)}
              className="p-1 rounded hover:bg-red-100 transition"
              aria-label={`Eliminar ${item.title || item.name || "producto"}`}
            >
              <Trash2 size={20} className="text-gray-500 hover:text-red-600" />
            </button>
          </div>
        );
      })}

      {items && items.length > 0 && (
        <>
          <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm font-semibold">
            <span>Subtotal</span>
            <span>S/ {(subtotal ?? 0).toFixed(2)}</span>
          </div>

          <Link href="/cart">
            <button
              className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={onClose}
            >
              Ver carrito
            </button>
          </Link>
        </>
      )}
    </div>
  );
}
