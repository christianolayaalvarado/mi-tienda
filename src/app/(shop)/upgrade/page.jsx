"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "Gratis",
    period: "",
    description: "Para comprar en cualquier tienda",
    color: "green",
    features: [
      "Comprar de cualquier tienda",
      "Historial de pedidos",
      "Resenas y calificaciones",
      "Chat con asistente IA",
      "1 giro diario en la ruleta",
      "Pago seguro con Culqi",
    ],
    unavailable: [
      "Crear tienda online",
      "Gestionar productos",
      "Email marketing",
      "Analiticas de ventas",
      "Cupones y descuentos",
      "Mascota premium",
      "Multi-carrier de envios",
    ],
  },
  {
    id: "full",
    name: "Full",
    price: "$9.99",
    period: "/mes",
    priceYearly: "$89.99",
    periodYearly: "/ano",
    description: "Para vender y gestionar tu tienda",
    color: "blue",
    popular: true,
    features: [
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
    ],
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRegister = searchParams.get("from") === "register";
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: "full", billing: selectedPlan }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("¡Plan Full activado! Redirigiendo...");
        setTimeout(() => router.push("/dashboard/seller"), 1500);
      } else {
        setMessage(data.message || data.error || "Error al activar plan");
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
        {/* Header */}
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

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan) => {
            const isActive = plan.id === "free" ? !isFull : isFull;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all ${
                  plan.popular ? "ring-2 ring-blue-500" : ""
                } ${isActive ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-xs font-bold text-center py-1">
                    POPULAR
                  </div>
                )}
                {isActive && (
                  <div className="bg-green-500 text-white text-xs font-bold text-center py-1">
                    TU PLAN
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-500 text-sm">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5">✅</span>
                        {f}
                      </li>
                    ))}
                    {plan.unavailable?.map((f, i) => (
                      <li key={`no-${i}`} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="mt-0.5">—</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.id === "free" && !isFull && (
                    <Link
                      href="/"
                      className="block w-full py-2.5 text-center border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
                    >
                      Empezar a comprar
                    </Link>
                  )}

                  {plan.id === "full" && !isFull && (
                    <button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {loading ? "Procesando..." : "Activar Full →"}
                    </button>
                  )}

                  {isActive && (
                    <div className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm text-center">
                      Plan activo
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message */}
        {message && (
          <div className="mt-6 max-w-3xl mx-auto">
            <div className={`p-4 rounded-xl text-sm text-center ${
              message.includes("activado") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
