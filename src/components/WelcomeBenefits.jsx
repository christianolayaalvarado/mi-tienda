"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export default function WelcomeBenefits({ isOpen, onClose, onUpgrade, userName }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const FREE_FEATURES = [
    "Comprar de cualquier tienda",
    "Historial de pedidos",
    "Resenas y calificaciones",
    "Chat con asistente IA",
    "1 giro diario en la ruleta",
    "Pago seguro con Culqi",
  ];

  const FULL_FEATURES = [
    "Crear tu propia tienda",
    "Gestionar productos y stock",
    "Email marketing",
    "Analiticas de ventas",
    "Cupones y descuentos",
    "Mascota premium",
    "Multi-carrier de envios",
    "Multi-gateway de pagos",
    "Dark Mode y PWA",
  ];

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white p-1" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold text-white">Elige tu plan{userName ? `, ${userName}` : ""}</h2>
          <p className="text-green-100 text-sm mt-1">Comienza gratis, upgrade cuando quieras</p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Free */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">FREE</span>
              <span className="text-sm font-medium text-gray-700">Comprador</span>
            </div>
            <ul className="space-y-1.5">
              {FREE_FEATURES.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-green-500 mt-0.5">✅</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Full */}
          <div className="p-5 bg-blue-50/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">FULL</span>
              <span className="text-sm font-medium text-gray-700">Vendedor</span>
            </div>
            <ul className="space-y-1.5">
              {FULL_FEATURES.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-blue-500 mt-0.5">🔒</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex gap-3 border-t border-gray-200">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition">
            Empezar a comprar
          </button>
          <button onClick={onUpgrade} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition">
            Quiero vender →
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
