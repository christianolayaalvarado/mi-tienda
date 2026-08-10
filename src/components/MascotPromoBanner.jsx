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
    colors: ["from-violet-600", "via-fuchsia-500", "to-cyan-400"],
    blob1: "bg-yellow-400/40",
    blob2: "bg-cyan-400/30",
    blob3: "bg-pink-400/25",
  },
  {
    mascot: "rocket_b",
    title: "Cohetín",
    desc: "Vende 10 productos para desbloquearlo",
    badge: "Premium",
    badgeColor: "bg-red-500",
    colors: ["from-red-500", "via-orange-500", "to-yellow-400"],
    blob1: "bg-pink-400/40",
    blob2: "bg-orange-300/30",
    blob3: "bg-yellow-300/25",
  },
  {
    mascot: "cat_b",
    title: "Gatito Gris",
    desc: "Gasta S/ 500 y es tuyo",
    badge: "Premium",
    badgeColor: "bg-purple-500",
    colors: ["from-purple-600", "via-indigo-500", "to-blue-400"],
    blob1: "bg-indigo-300/40",
    blob2: "bg-purple-300/30",
    blob3: "bg-blue-300/25",
  },
  {
    mascot: "dog_c",
    title: "Perrito Dorado",
    desc: "El compañero más fiel",
    badge: "Premium",
    badgeColor: "bg-amber-500",
    colors: ["from-amber-500", "via-orange-400", "to-yellow-300"],
    blob1: "bg-yellow-300/40",
    blob2: "bg-orange-300/30",
    blob3: "bg-red-300/25",
  },
  {
    mascot: "cart",
    title: "Carrito",
    desc: "Listo para cargar tus compras",
    badge: "Gratis",
    badgeColor: "bg-green-500",
    colors: ["from-emerald-500", "via-teal-400", "to-cyan-300"],
    blob1: "bg-teal-300/40",
    blob2: "bg-cyan-300/30",
    blob3: "bg-green-300/25",
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
      data-banner="mascot"
      className="relative w-full h-full rounded-xl overflow-hidden shadow-lg shadow-purple-500/20"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${item.colors[0]} ${item.colors[1]} ${item.colors[2]}`} />

      {/* Decorative blobs */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${item.blob1} blur-2xl`} />
      <div className={`absolute -bottom-6 -left-6 w-28 h-28 rounded-full ${item.blob2} blur-2xl`} />
      <div className={`absolute top-1/2 right-1/4 w-24 h-24 rounded-full ${item.blob3} blur-xl`} />

      {/* Geometric shapes */}
      <div className="absolute top-2 right-12 w-16 h-16 border-2 border-white/20 rounded-full" />
      <div className="absolute bottom-4 left-8 w-10 h-10 border border-white/15 rounded-lg rotate-45" />
      <div className="absolute top-6 left-1/3 w-3 h-3 bg-white/30 rounded-full" />
      <div className="absolute bottom-8 right-1/3 w-2 h-2 bg-white/40 rounded-full" />

      {/* Content */}
      <div className="relative z-10 flex h-full">
        {/* Left: Mascot */}
        <div className="w-2/5 flex items-center justify-center p-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl bg-white/25 scale-150" />
            <div key={currentIdx} className="relative animate-[fadeInScale_0.5s_ease-out]">
              <MascotAvatar type={item.mascot} size={80} animate={true} view="front" />
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="w-3/5 flex flex-col justify-center p-2 pr-3 gap-1">
          <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-full px-2 py-0.5 w-fit">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-[8px] font-bold uppercase tracking-wide">Mascotas</span>
          </div>

          <div key={`info-${currentIdx}`} className="animate-[fadeInUp_0.4s_ease-out]">
            <div className="flex items-center gap-1 mb-0.5">
              <h3 className="text-white font-bold text-sm sm:text-lg text-left leading-tight drop-shadow-md">{item.title}</h3>
              <span className={`${item.badgeColor} text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 shadow`}>
                {item.badge}
              </span>
            </div>
            <p className="text-white/90 text-[11px] sm:text-xs leading-snug text-left drop-shadow-sm">{item.desc}</p>
          </div>

          <div className="flex gap-1 mt-0.5">
            {PROMO_ITEMS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIdx ? "bg-white w-3 shadow" : "bg-white/40 w-1"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
