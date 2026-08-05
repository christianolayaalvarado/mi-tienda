"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
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
    src: "https://6h9f7lxba9.ufs.sh/f/LCsO4fTJNgmrdVagVsXbSXgrbYTL0Iniw2fUtjDHRBy7u6dm",
    alt: "Alfombra Tapete Catania",
    price: "S/. 89.90",
  },
  {
    src: "https://6h9f7lxba9.ufs.sh/f/LCsO4fTJNgmrRZpuCfI06AtEdSJZRUbqacIz1XG8YhpQPeF2",
    alt: "Fundas Zara",
    price: "S/. 45.00",
  },
  {
    src: "https://6h9f7lxba9.ufs.sh/f/LCsO4fTJNgmr0QzT6rSqSQ2rcmFdw5a48gEeOMJuWV9IslTx",
    alt: "Macetero colgante",
    price: "S/. 30.00",
  },
  {
    src: "https://6h9f7lxba9.ufs.sh/f/LCsO4fTJNgmr8zkUsHd5OnHZMI7fqRyuXgWDaGKNB5lrhjsi",
    alt: "Waflera",
    price: "S/. 65.00",
  },
];

const DISMISS_KEY = "register-benefits-dismissed";
const REAPPEAR_MS = 10000;

export default function RegisterBenefitsModal() {
  const { user, loading } = useAuthContext();
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);

  const isLoggedIn = user || session?.user;

  useEffect(() => {
    if (loading || sessionStatus === "loading" || isLoggedIn || pathname === "/register" || pathname === "/login") return;

    const dismissedAt = Number(sessionStorage.getItem(DISMISS_KEY) || 0);
    const elapsed = Date.now() - dismissedAt;
    if (dismissedAt && elapsed < REAPPEAR_MS) {
      const wait = REAPPEAR_MS - elapsed;
      const timer = setTimeout(() => setShow(true), wait);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setShow(true), 10000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, loading, sessionStatus, pathname]);

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

  if (loading || sessionStatus === "loading" || isLoggedIn || !show) return null;

  function dismiss() {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[900px] overflow-hidden animate-[fadeInScale_0.3s_ease-out] flex flex-col md:flex-row max-h-[90vh]">
        {/* MOBILE: Product carousel - full width, attached to top of modal */}
        <div className="md:hidden flex-shrink-0 relative h-40 bg-gray-100 overflow-hidden rounded-t-2xl">
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
              <div className="absolute bottom-3 left-3 flex gap-2 z-20">
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
              <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md text-white px-2.5 py-1 rounded-md border border-white/10 z-10 max-w-[55%]">
                <span className="text-[10px] font-semibold line-clamp-1 block">{img.alt}</span>
              </div>
            </div>
          ))}
          <button
            onClick={() => setCurrentImage((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white flex items-center justify-center text-xs border border-white/30 z-10 transition font-bold"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white flex items-center justify-center text-xs border border-white/30 z-10 transition font-bold"
          >
            ›
          </button>
          {/* Mobile close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white text-sm border border-white/30 z-20 transition font-bold"
          >
            ✕
          </button>
        </div>

        {/* LEFT: Benefits column */}
        <div className="flex-1 flex flex-col min-w-0 md:w-[55%]">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 md:px-5 md:py-4 text-white relative flex-shrink-0">
            <h2 className="text-base md:text-lg font-bold">¡Únete a Mi Tienda!</h2>
            <p className="text-xs md:text-sm text-green-100 mt-0.5">Regístrate gratis y descubre todos los beneficios</p>
          </div>

          {/* Benefits list - scrollable on mobile */}
          <div className="px-4 py-3 md:px-5 md:py-4 space-y-1.5 md:space-y-2 flex-1 overflow-y-auto md:overflow-hidden">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 md:gap-3 p-2 md:p-2.5 rounded-xl transition-all duration-300 ${
                  i === currentSlide
                    ? "bg-green-50 border border-green-200 shadow-sm scale-[1.02]"
                    : "bg-gray-50 border border-transparent"
                }`}
              >
                {b.isImage ? (
                  <img src={b.icon} alt={b.title} className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0 object-contain" />
                ) : (
                  <span className="text-lg md:text-xl flex-shrink-0">{b.icon}</span>
                )}
                <div>
                  <h3 className="text-xs md:text-sm font-bold text-gray-900">{b.title}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA + Dots */}
          <div className="px-4 pb-3 md:px-5 md:pb-4 flex-shrink-0">
            <Link
              href="/register"
              onClick={dismiss}
              className="block w-full py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white text-center font-bold rounded-xl transition shadow-lg shadow-gray-400 text-sm md:text-base"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              onClick={dismiss}
              className="block w-full py-1.5 md:py-2 text-gray-400 hover:text-gray-600 text-xs md:text-sm text-center transition"
            >
              Ya tengo cuenta, continuar al Login
            </Link>
            <div className="flex justify-center gap-1.5 mt-2 md:mt-3">
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
              <div className="absolute bottom-4 left-4 flex gap-3 z-20">
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
              <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-lg border border-white/10 max-w-[60%]">
                <span className="text-xs font-semibold line-clamp-1 block">{img.alt}</span>
              </div>
            </div>
          ))}

          {/* Desktop close button - top right corner of carousel */}
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 flex items-center justify-center text-white text-sm border border-white/30 z-20 transition font-bold"
          >
            ✕
          </button>

          <button
            onClick={() => setCurrentImage((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white flex items-center justify-center text-sm border border-white/30 z-10 transition font-bold"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white flex items-center justify-center text-sm border border-white/30 z-10 transition font-bold"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
