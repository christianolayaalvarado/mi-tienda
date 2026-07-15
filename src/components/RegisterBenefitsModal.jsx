"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    desc: "Consulta el estado de tus pedidos en tu panel de compras.",
  },
  {
    icon: "/mascots/rooster_b/Gallo_front.png",
    title: "Mascota personalizada",
    desc: "Elige tu mascota, ponle nombre y gana monedas.",
    isImage: true,
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

const CAROUSEL_IMAGES = [
  {
    src: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783892235/mi_tienda/a1a1f3oj3lfpzrmv1jsb.jpg",
    alt: "Alfombra Tapete Catania",
    price: "S/. 89.90",
  },
  {
    src: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1784062298/mi_tienda/lcii6cewvnq8f4fanipo.jpg",
    alt: "Funda de almohada",
    price: "S/. 45.00",
  },
  {
    src: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783983627/mi_tienda/cd40o43e8ndxoqihqf89.jpg",
    alt: "Macetero colgante",
    price: "S/. 30.00",
  },
  {
    src: "https://res.cloudinary.com/dqx8wx5fj/image/upload/v1783896868/mi_tienda/lnb86rx7hkqnonbfd7gz.jpg",
    alt: "Farol mediano",
    price: "S/. 65.00",
  },
];

const DISMISS_KEY = "register-benefits-dismissed";
const REAPPEAR_MS = 10000;

export default function RegisterBenefitsModal() {
  const { user, loading } = useAuthContext();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (loading || user || pathname === "/register" || pathname === "/login") return;

    const dismissedAt = Number(sessionStorage.getItem(DISMISS_KEY) || 0);
    const elapsed = Date.now() - dismissedAt;
    if (dismissedAt && elapsed < REAPPEAR_MS) {
      const wait = REAPPEAR_MS - elapsed;
      const timer = setTimeout(() => setShow(true), wait);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, [user, loading, pathname]);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BENEFITS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [show]);

  if (loading || user || !show) return null;

  function dismiss() {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] overflow-hidden animate-[fadeInScale_0.3s_ease-out] flex flex-col md:flex-row max-h-[90vh]">
        {/* MOBILE: Product carousel - full width, attached to top of modal */}
        <div className="md:hidden flex-shrink-0 relative h-52 bg-gray-100 overflow-hidden rounded-t-2xl">
          {CAROUSEL_IMAGES.map((img, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === currentImage ? 1 : 0 }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-md border border-white/10">
                <span className="text-xs font-bold">{img.price}</span>
              </div>
              <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-md border border-white/10">
                <span className="text-[10px] font-semibold">{img.alt}</span>
              </div>
            </div>
          ))}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {CAROUSEL_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentImage
                    ? "bg-white scale-125 shadow-md"
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentImage((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 text-white flex items-center justify-center text-xs border border-white/10 z-10 transition"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 text-white flex items-center justify-center text-xs border border-white/10 z-10 transition"
          >
            ›
          </button>
          {/* Mobile close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white text-sm border border-white/10 z-20 transition"
          >
            ✕
          </button>
        </div>

        {/* LEFT: Benefits column */}
        <div className="flex-1 flex flex-col min-w-0 md:w-[55%]">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4 text-white relative flex-shrink-0">
            <h2 className="text-lg font-bold">¡Únete a Mi Tienda!</h2>
            <p className="text-sm text-green-100 mt-0.5">Regístrate gratis y descubre todos los beneficios</p>
          </div>

          {/* Benefits list - no scrollbar */}
          <div className="px-5 py-4 space-y-2 flex-1 overflow-hidden">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                  i === currentSlide
                    ? "bg-green-50 border border-green-200 shadow-sm scale-[1.02]"
                    : "bg-gray-50 border border-transparent"
                }`}
              >
                {b.isImage ? (
                  <img src={b.icon} alt={b.title} className="w-8 h-8 flex-shrink-0 object-contain" />
                ) : (
                  <span className="text-xl flex-shrink-0">{b.icon}</span>
                )}
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{b.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA + Dots */}
          <div className="px-5 pb-4 flex-shrink-0">
            <Link
              href="/register"
              onClick={dismiss}
              className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white text-center font-bold rounded-xl transition shadow-lg shadow-gray-400"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              onClick={dismiss}
              className="block w-full py-2 text-gray-400 hover:text-gray-600 text-sm text-center transition"
            >
              Ya tengo cuenta, continuar al Login
            </Link>
            <div className="flex justify-center gap-1.5 mt-3">
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

        {/* DESKTOP: Product Carousel - right side, full height */}
        <div className="hidden md:flex md:w-[45%] relative bg-gray-100 overflow-hidden flex-shrink-0">
          {CAROUSEL_IMAGES.map((img, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === currentImage ? 1 : 0 }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-sm font-bold">{img.price}</span>
              </div>
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-xs font-semibold">{img.alt}</span>
              </div>
            </div>
          ))}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {CAROUSEL_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentImage
                    ? "bg-white scale-125 shadow-md"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* Desktop close button - top right corner of carousel */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white text-sm border border-white/10 z-20 transition"
          >
            ✕
          </button>

          <button
            onClick={() => setCurrentImage((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 text-white flex items-center justify-center text-sm border border-white/10 z-10 transition"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 text-white flex items-center justify-center text-sm border border-white/10 z-10 transition"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
