"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MascotAvatar from "@/components/MascotAvatar";

const PROMO_ITEMS = [
  {
    mascot: "box",
    title: "Cajita",
    desc: "Tu compañero fiel desde el inicio",
    badge: "Gratis",
    badgeColor: "bg-green-500",
    link: "/dashboard/mascotas",
  },
  {
    mascot: "rocket_b",
    title: "Cohetín",
    desc: "Vende 10 productos para desbloquearlo",
    badge: "Premium",
    badgeColor: "bg-red-500",
    link: "/dashboard/mascotas",
  },
  {
    mascot: "cat_b",
    title: "Gatito Gris",
    desc: "Gasta S/ 500 y es tuyo",
    badge: "Premium",
    badgeColor: "bg-purple-500",
    link: "/dashboard/mascotas",
  },
  {
    mascot: "dog_c",
    title: "Perrito Dorado",
    desc: "El compañero más fiel",
    badge: "Premium",
    badgeColor: "bg-amber-500",
    link: "/dashboard/mascotas",
  },
  {
    mascot: "cart",
    title: "Carrito",
    desc: "Listo para cargar tus compras",
    badge: "Gratis",
    badgeColor: "bg-green-500",
    link: "/dashboard/mascotas",
  },
];

export default function MascotPromoBanner() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % PROMO_ITEMS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovered]);

  const item = PROMO_ITEMS[currentIdx];

  return (
    <div
      className="relative w-full h-full min-h-[180px] lg:min-h-[220px] rounded-xl overflow-hidden flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full p-4 sm:p-5 text-center">
        {/* Header */}
        <div className="w-full">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-[11px] font-bold uppercase tracking-wide">Mascotas</span>
          </div>
        </div>

        {/* Mascot with glow */}
        <div className="flex-1 flex items-center justify-center py-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl bg-white/20 scale-150" />
            <div
              key={currentIdx}
              className="relative animate-[fadeInScale_0.5s_ease-out]"
            >
              <MascotAvatar type={item.mascot} size={80} animate={true} view="front" />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="w-full space-y-2">
          <div
            key={`info-${currentIdx}`}
            className="animate-[fadeInUp_0.4s_ease-out]"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <h3 className="text-white font-bold text-sm sm:text-base">{item.title}</h3>
              <span className={`${item.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                {item.badge}
              </span>
            </div>
            <p className="text-white/80 text-xs leading-relaxed">{item.desc}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 py-1">
            {PROMO_ITEMS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIdx ? "bg-white w-4" : "bg-white/40 w-1.5"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <Link
            href={item.link}
            className="block w-full py-2 bg-white hover:bg-white/90 text-purple-700 font-bold text-xs sm:text-sm rounded-lg transition-all hover:scale-[1.02] shadow-lg"
          >
            Ver Galería →
          </Link>
        </div>
      </div>
    </div>
  );
}
