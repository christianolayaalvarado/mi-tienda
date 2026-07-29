"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const FREE_FEATURES = [
  "Comprar de cualquier tienda",
  "Historial de pedidos",
  "Resenas y calificaciones",
  "Chat con asistente IA",
  "1 giro diario en la ruleta",
  "Pago seguro con Yape",
];

const FULL_FEATURES = [
  "Todo de Free",
  "Crear tienda online",
  "Gestionar productos y stock",
  "Email marketing a clientes",
  "Analiticas de ventas detalladas",
  "Cupones y descuentos",
  "Mascota animada premium",
  "Multi-carrier de envios",
  "Multi-gateway de pagos",
  "Dark Mode y PWA",
  "Zoom de imagen",
  "Sellers verificados",
];

export default function UpgradePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Cargando...</p></div>}>
      <UpgradePage />
    </Suspense>
  );
}

function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRegister = searchParams.get("from") === "register";
  const [user, setUser] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ amount: "199", phone: "", transactionId: "" });

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleRequestFull = () => {
    setShowPayment(true);
  };

  const handleSubmitPayment = async () => {
    if (!form.phone.trim()) {
      setMessage("Ingresa tu numero de telefono");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/upgrade-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: form.phone,
          transactionId: form.transactionId,
          amount: form.amount,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Solicitud enviada. El administrador revisara tu pago y activara tu plan Full.");
        setShowPayment(false);
      } else {
        setMessage(data.message || data.error || "Error al enviar solicitud");
      }
    } catch {
      setMessage("Error de conexion");
    }
    setLoading(false);
  };

  const isFull = user?.plan === "full";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header — pegado al navbar */}
      <div className="pt-6 pb-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-left">
            {isFull ? "Tu plan actual" : "Elige tu plan"}
          </h1>
          <p className="text-gray-500 mt-1 text-left text-sm sm:text-base">
            {isFull
              ? "Ya tienes acceso a todas las funciones de vendedor"
              : fromRegister
                ? "Desbloquea todas las funciones para vender"
                : "Comienza gratis, upgrade cuando quieras"}
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="px-4 sm:px-8 pb-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 items-start">

          {/* ============ FREE CARD ============ */}
          <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${!isFull ? "ring-2 ring-green-500" : ""}`}>
            <div className="bg-green-500 text-white text-xs font-bold text-center py-1.5 tracking-wide">
              {isFull ? "TU PLAN" : "FREE"}
            </div>
            <div className="flex">
              {/* Faded image — left side */}
              <div className="hidden lg:flex w-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-green-50 to-white border-r border-green-100">
                <svg viewBox="0 0 100 160" className="w-16 h-24 opacity-[0.15]">
                  <rect x="15" y="10" width="70" height="140" rx="10" fill="#7B2D8E" />
                  <text x="50" y="40" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Yape</text>
                  <rect x="25" y="50" width="50" height="50" rx="6" fill="white" />
                  <text x="50" y="80" textAnchor="middle" fontSize="18">📱</text>
                  <text x="50" y="120" textAnchor="middle" fontSize="7" fill="white">S/ 49.90</text>
                  <text x="50" y="135" textAnchor="middle" fontSize="5" fill="white">Enviado ✓</text>
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 sm:p-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">Free</h3>
                  <span className="text-2xl font-extrabold text-green-600">Gratis</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">Para comprar en cualquier tienda</p>

                {/* Features + Price side by side */}
                <div className="flex gap-4">
                  <ul className="flex-1 space-y-1.5">
                    {FREE_FEATURES.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5 text-xs">✅</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden sm:flex flex-col items-end justify-start pt-1 border-l border-gray-100 pl-4 shrink-0">
                    <span className="text-2xl font-extrabold text-green-600">S/ 0</span>
                    <span className="text-[10px] text-gray-400">/ siempre</span>
                  </div>
                </div>

                <div className="mt-5">
                  {isFull ? (
                    <div className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm text-center">
                      Plan actual
                    </div>
                  ) : (
                    <Link href="/" className="block w-full py-2.5 text-center border border-green-300 text-green-700 rounded-lg font-medium text-sm hover:bg-green-50 transition">
                      Empezar a comprar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============ FULL CARD ============ */}
          <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${isFull ? "ring-2 ring-blue-500" : ""}`}>
            <div className="bg-blue-600 text-white text-xs font-bold text-center py-1.5 tracking-wide">
              {isFull ? "TU PLAN" : "POPULAR"}
            </div>
            <div className="flex">
              {/* Content */}
              <div className="flex-1 p-5 sm:p-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">Full</h3>
                  <div>
                    <span className="text-2xl font-extrabold text-blue-600">S/ 199</span>
                    <span className="text-gray-400 text-xs"> / año</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-4">Para vender y gestionar tu tienda</p>

                {/* Features + Price side by side */}
                <div className="flex gap-4">
                  <ul className="flex-1 space-y-1.5">
                    {FULL_FEATURES.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5 text-xs">✅</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden sm:flex flex-col items-end justify-start pt-1 border-l border-gray-100 pl-4 shrink-0">
                    <span className="text-2xl font-extrabold text-blue-600">S/ 199</span>
                    <span className="text-[10px] text-gray-400">/ año</span>
                    <span className="text-[10px] text-gray-400 mt-1">S/ 16.58/mes</span>
                  </div>
                </div>

                <div className="mt-5">
                  {isFull ? (
                    <div className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm text-center">
                      Plan activo
                    </div>
                  ) : (
                    <button
                      onClick={handleRequestFull}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition shadow-md shadow-blue-200"
                    >
                      Activar Full →
                    </button>
                  )}
                </div>
              </div>

              {/* Faded images — right side */}
              <div className="hidden lg:flex w-[120px] shrink-0 items-center justify-center bg-gradient-to-b from-blue-50 to-white border-l border-blue-100">
                <div className="flex flex-col items-center gap-4 opacity-[0.12]">
                  {/* Store */}
                  <svg viewBox="0 0 80 70" className="w-14 h-12">
                    <rect x="10" y="20" width="60" height="45" rx="6" fill="#1e40af" />
                    <polygon points="40,5 10,20 70,20" fill="#3b82f6" />
                    <text x="40" y="16" textAnchor="middle" fontSize="6" fill="white">Tienda</text>
                    <rect x="22" y="30" width="36" height="8" rx="2" fill="#93c5fd" />
                    <rect x="22" y="42" width="24" height="6" rx="2" fill="#93c5fd" />
                  </svg>
                  {/* Email */}
                  <svg viewBox="0 0 80 60" className="w-14 h-10">
                    <rect x="5" y="5" width="70" height="50" rx="6" fill="#1e40af" />
                    <rect x="10" y="10" width="60" height="30" rx="3" fill="white" />
                    <text x="40" y="30" textAnchor="middle" fontSize="14">📧</text>
                    <text x="40" y="52" textAnchor="middle" fontSize="5" fill="white">Email Marketing</text>
                  </svg>
                  {/* Mascot */}
                  <svg viewBox="0 0 80 80" className="w-14 h-14">
                    <circle cx="40" cy="35" r="22" fill="#fbbf24" />
                    <circle cx="33" cy="30" r="3" fill="#1f2937" />
                    <circle cx="47" cy="30" r="3" fill="#1f2937" />
                    <path d="M 33 40 Q 40 48 47 40" stroke="#1f2937" strokeWidth="2" fill="none" />
                    <text x="40" y="70" textAnchor="middle" fontSize="6" fill="#1e40af">Premium</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pago para activar Full</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-blue-800 mb-2">Monto a pagar:</p>
              <p className="text-2xl font-bold text-blue-700">S/ 199</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Yape</p>
                <p className="text-sm text-gray-800">Numero: <strong>519 595 02168</strong></p>
                <p className="text-xs text-gray-500 mt-1">Abre tu app Yape y envia el monto</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Transferencia bancaria</p>
                <p className="text-sm text-gray-800">Cuenta: <strong>19198605848064</strong></p>
                <p className="text-sm text-gray-800">CCI: <strong>00219119860584806450</strong></p>
                <p className="text-xs text-gray-500 mt-1">Banco de Credito del Peru (BCP)</p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tu numero de telefono (Yape)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9XX XXX XXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID de transaccion (opcional)</label>
                <input
                  type="text"
                  value={form.transactionId}
                  onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                  placeholder="Codigo de operacion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${message.includes("enviada") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={loading || !form.phone.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && !showPayment && (
        <div className="px-4 sm:px-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <div className={`p-4 rounded-xl text-sm text-center ${message.includes("enviada") || message.includes("activado") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message}
            </div>
          </div>
        </div>
      )}

      <div className="text-center pb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
