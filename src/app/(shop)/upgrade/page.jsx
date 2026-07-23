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
  "Pago seguro con Culqi",
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
  const [form, setForm] = useState({ amount: "89.99", phone: "", transactionId: "" });

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            {isFull ? "Tu plan actual" : "Elige tu plan"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isFull
              ? "Ya tienes acceso a todas las funciones de vendedor"
              : fromRegister
                ? "Desbloquea todas las funciones para vender"
                : "Comienza gratis, upgrade cuando quieras"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${!isFull ? "ring-2 ring-green-500" : ""}`}>
            <div className="bg-green-500 text-white text-xs font-bold text-center py-1">
              {isFull ? "TU PLAN" : "FREE"}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">Gratis</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Para comprar en cualquier tienda</p>
              <ul className="space-y-2 mb-6">
                {FREE_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✅</span>
                    {f}
                  </li>
                ))}
              </ul>
              {isFull ? (
                <div className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm text-center">
                  Plan actual
                </div>
              ) : (
                <Link href="/" className="block w-full py-2.5 text-center border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition">
                  Empezar a comprar
                </Link>
              )}
            </div>
          </div>

          {/* Full Plan */}
          <div className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${isFull ? "ring-2 ring-blue-500" : ""}`}>
            <div className="bg-blue-500 text-white text-xs font-bold text-center py-1">
              {isFull ? "TU PLAN" : "POPULAR"}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Full</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">S/ 89.99</span>
                <span className="text-gray-500 text-sm"> / ano</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Para vender y gestionar tu tienda</p>
              <ul className="space-y-2 mb-6">
                {FULL_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✅</span>
                    {f}
                  </li>
                ))}
              </ul>
              {isFull ? (
                <div className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm text-center">
                  Plan activo
                </div>
              ) : (
                <button
                  onClick={handleRequestFull}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition"
                >
                  Activar Full →
                </button>
              )}
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
                <p className="text-2xl font-bold text-blue-700">S/ 89.99</p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Yape</p>
                  <p className="text-sm text-gray-800">Numero: <strong>966 741 893</strong></p>
                  <p className="text-xs text-gray-500 mt-1">Abre tu app Yape y envia el monto</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Transferencia bancaria</p>
                  <p className="text-sm text-gray-800">Cuenta: <strong>194-37823078-0-18</strong></p>
                  <p className="text-sm text-gray-800">CCI: <strong>00219413782307801818</strong></p>
                  <p className="text-xs text-gray-500 mt-1">Banco de la Nacion</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tu numero de telefono (Yape)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="966 741 893"
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
          <div className="mt-6 max-w-3xl mx-auto">
            <div className={`p-4 rounded-xl text-sm text-center ${message.includes("enviada") || message.includes("activado") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
