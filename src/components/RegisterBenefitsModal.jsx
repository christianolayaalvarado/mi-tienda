"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthProvider";

const BENEFITS = [
  {
    icon: "🚀",
    title: "Compra rápida",
    desc: "No vuelvas a llenar tus datos. Compra en un clic.",
  },
  {
    icon: "📦",
    title: "Seguimiento de pedidos",
    desc: "Rastrea todos tus pedidos en tiempo real.",
  },
  {
    icon: "🐾",
    title: "Mascota personalizada",
    desc: "Elige tu mascota, ponle nombre y gana monedas.",
  },
  {
    icon: "💰",
    title: "Ofertas exclusivas",
    desc: "Descuentos y promociones solo para miembros.",
  },
  {
    icon: "❤️",
    title: "Favoritos",
    desc: "Guarda productos y recibe alertas de precio.",
  },
  {
    icon: "🎁",
    title: "Invita y gana",
    desc: "Comparte tu código y gana monedas por cada amigo.",
  },
];

const DISMISS_KEY = "register-benefits-dismissed";

export default function RegisterBenefitsModal() {
  const { user, loading } = useAuthContext();
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (loading || user) return;

    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [user, loading]);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BENEFITS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [show]);

  if (loading || user || !show) return null;

  function dismiss() {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeInScale_0.3s_ease-out]">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white relative">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold">¡Únete a Mi Tienda!</h2>
          <p className="text-sm text-green-100 mt-1">Regístrate gratis y descubre todos los beneficios</p>
        </div>

        {/* Beneficios */}
        <div className="px-6 py-5 space-y-3">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                i === currentSlide
                  ? "bg-green-50 border border-green-200 shadow-sm scale-[1.02]"
                  : "bg-gray-50 border border-transparent"
              }`}
            >
              <span className="text-2xl flex-shrink-0">{b.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{b.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-5 space-y-2">
          <Link
            href="/register"
            onClick={dismiss}
            className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white text-center font-bold rounded-xl transition shadow-lg shadow-green-200"
          >
            Crear cuenta gratis
          </Link>
          <button
            onClick={dismiss}
            className="block w-full py-2 text-gray-400 hover:text-gray-600 text-sm text-center transition"
          >
            Ya tengo cuenta, continuar comprando
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 pb-4">
          {BENEFITS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? "bg-green-500 w-4" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
