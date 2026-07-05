"use client";

import { useState, useEffect } from "react";
import MascotAvatar from "@/components/MascotAvatar";

const PROMO_ITEMS = [
  {
    mascot: "box",
    title: "Cajita",
    desc: "Tu compañero fiel desde el inicio",
    badge: "Gratis",
    badgeColor: "bg-green-500",
  },
  {
    mascot: "rocket_b",
    title: "Cohetín",
    desc: "Vende 10 productos para desbloquearlo",
    badge: "Premium",
    badgeColor: "bg-red-500",
  },
  {
    mascot: "cat_b",
    title: "Gatito Gris",
    desc: "Gasta S/ 500 y es tuyo",
    badge: "Premium",
    badgeColor: "bg-purple-500",
  },
  {
    mascot: "dog_c",
    title: "Perrito Dorado",
    desc: "El compañero más fiel",
    badge: "Premium",
    badgeColor: "bg-amber-500",
  },
  {
    mascot: "cart",
    title: "Carrito",
    desc: "Listo para cargar tus compras",
    badge: "Gratis",
    badgeColor: "bg-green-500",
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
      className="relative w-full h-full rounded-xl overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Content: horizontal layout */}
      <div className="relative z-10 flex h-full">
        {/* Left: Mascot (50%) */}
        <div className="w-1/2 flex items-center justify-center p-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl bg-white/20 scale-150" />
            <div key={currentIdx} className="relative animate-[fadeInScale_0.5s_ease-out]">
              <MascotAvatar type={item.mascot} size={90} animate={true} view="front" />
            </div>
          </div>
        </div>

        {/* Right: Info (50%) */}
        <div className="w-1/2 flex flex-col justify-center p-3 pr-4 gap-1.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 w-fit">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-[9px] font-bold uppercase tracking-wide">Mascotas</span>
          </div>

          {/* Title + badge */}
          <div key={`info-${currentIdx}`} className="animate-[fadeInUp_0.4s_ease-out]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-white font-bold text-sm sm:text-base text-left">{item.title}</h3>
              <span className={`${item.badgeColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0`}>
                {item.badge}
              </span>
            </div>
            <p className="text-white/80 text-[11px] leading-snug text-left">{item.desc}</p>
          </div>

          {/* Dots */}
          <div className="flex gap-1 mt-1">
            {PROMO_ITEMS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIdx ? "bg-white w-3" : "bg-white/40 w-1"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
