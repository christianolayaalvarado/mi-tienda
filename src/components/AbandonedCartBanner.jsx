"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const ONE_HOUR = 60 * 60 * 1000;
const DISMISS_KEY = "abandoned-cart-dismissed";

export default function AbandonedCartBanner() {
  const { cartItems } = useCart();
  const [show, setShow] = useState(false);
  const [abandonedItems, setAbandonedItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;

    const dismissedAt = Number(sessionStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < 30 * 60 * 1000) return;

    const now = Date.now();
    const oldItems = cartItems.filter((item) => {
      const addedAt = item.addedAt || 0;
      return addedAt > 0 && now - addedAt > ONE_HOUR;
    });

    if (oldItems.length > 0) {
      setAbandonedItems(oldItems);
      const sum = oldItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
      setTotal(sum);
      setShow(true);
    }
  }, [cartItems]);

  if (!show || abandonedItems.length === 0) return null;

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mx-4 mb-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">🛒</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">
            ¡Tienes productos en tu carrito!
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {abandonedItems.length} {abandonedItems.length === 1 ? "producto esperando" : "productos esperando"} — Total:{" "}
            <span className="font-semibold text-green-600">S/ {total.toFixed(2)}</span>
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              href="/cart"
              onClick={dismiss}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Ver carrito
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <button
              onClick={dismiss}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-xs font-medium transition"
            >
              Ver después
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
