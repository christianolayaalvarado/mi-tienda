"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function PendingOrdersModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await fetch("/api/seller/pending-count", { credentials: "include" });
        const data = await res.json();
        const count = data?.pendingCount || 0;
        setPendingCount(count);

        if (count > 0) {
          const alreadyShown = sessionStorage.getItem("pending-orders-modal-shown");
          if (!alreadyShown) {
            setTimeout(() => {
              setIsOpen(true);
              sessionStorage.setItem("pending-orders-modal-shown", "1");
            }, 2000);
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    checkPending();
  }, []);

  if (!isOpen || loading) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ transition: "opacity 0.3s ease", opacity: isOpen ? 1 : 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🔔</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          ¡Tienes pedidos pendientes!
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Hay <span className="font-bold text-red-600">{pendingCount}</span> {pendingCount === 1 ? "orden" : "órdenes"} esperando tu revisión. 
          Revisa los comprobantes de pago y confirma las ventas.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard/seller/orders"
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Ver órdenes pendientes
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            Ver después
          </button>
        </div>
      </div>
    </div>
  );
}
