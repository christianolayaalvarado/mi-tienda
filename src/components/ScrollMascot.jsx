"use client";

import { useState, useEffect } from "react";

export default function ScrollMascot() {
  const [visible, setVisible] = useState(false);
  const [isWaving, setIsWaving] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Mostrar cuando hay más contenido abajo
      const hasMoreContent = scrollY + viewportHeight < docHeight - 100;
      setVisible(hasMoreContent && scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, [visible]);

  const scrollToProducts = () => {
    window.scrollBy({ top: 400, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToProducts}
      className="fixed bottom-6 right-6 z-50 group cursor-pointer"
      aria-label="Ver más productos"
    >
      <div className="relative flex flex-col items-center">
        {/* Burbuja de texto */}
        <div className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-md mb-2 whitespace-nowrap border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          ¡Hay más productos abajo! 👇
        </div>

        {/* Mascota - Bolsa de compras */}
        <div className={`transition-transform duration-300 ${isWaving ? "animate-bounce" : "group-hover:scale-110"}`}>
          <svg
            width="64"
            height="80"
            viewBox="0 0 64 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-lg"
          >
            {/* Piernas */}
            <rect x="18" y="62" width="6" height="14" rx="3" fill="#D97706" />
            <rect x="40" y="62" width="6" height="14" rx="3" fill="#D97706" />
            {/* Zapatos */}
            <ellipse cx="21" cy="76" rx="5" ry="3" fill="#92400E" />
            <ellipse cx="43" cy="76" rx="5" ry="3" fill="#92400E" />

            {/* Brazos */}
            <rect
              x="4"
              y="30"
              width="6"
              height="20"
              rx="3"
              fill="#D97706"
              className={`origin-top ${isWaving ? "animate-[wave_0.5s_ease-in-out_2]" : ""}`}
              style={{ transformOrigin: "7px 30px" }}
            />
            <rect
              x="54"
              y="30"
              width="6"
              height="20"
              rx="3"
              fill="#D97706"
              className={`origin-top ${isWaving ? "animate-[wave_0.5s_ease-in-out_2]" : ""}`}
              style={{ transformOrigin: "57px 30px", animationDelay: "0.1s" }}
            />
            {/* Manos */}
            <circle cx="7" cy="50" r="4" fill="#FBBF24" />
            <circle cx="57" cy="50" r="4" fill="#FBBF24" />

            {/* Cuerpo - Bolsa de papel */}
            <rect x="12" y="12" width="40" height="50" rx="4" fill="#F59E0B" />
            <rect x="12" y="12" width="40" height="50" rx="4" fill="url(#bagGradient)" />

            {/* Asa de la bolsa */}
            <path
              d="M22 12 C22 4, 42 4, 42 12"
              stroke="#D97706"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />

            {/* Textura de pliegue */}
            <line x1="20" y1="18" x2="20" y2="58" stroke="#D97706" strokeWidth="0.5" opacity="0.3" />
            <line x1="32" y1="18" x2="32" y2="58" stroke="#D97706" strokeWidth="0.5" opacity="0.3" />
            <line x1="44" y1="18" x2="44" y2="58" stroke="#D97706" strokeWidth="0.5" opacity="0.3" />

            {/* Ojos */}
            <ellipse cx="24" cy="32" rx="5" ry="6" fill="white" />
            <ellipse cx="40" cy="32" rx="5" ry="6" fill="white" />
            <circle cx="25" cy="33" r="3" fill="#1F2937" />
            <circle cx="41" cy="33" r="3" fill="#1F2937" />
            <circle cx="26" cy="31.5" r="1" fill="white" />
            <circle cx="42" cy="31.5" r="1" fill="white" />

            {/* Cejas */}
            <line x1="20" y1="25" x2="28" y2="26" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="36" y1="26" x2="44" y2="25" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />

            {/* Boca - sonrisa */}
            <path
              d="M26 42 Q32 48 38 42"
              stroke="#92400E"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />

            {/* Mejillas rosadas */}
            <circle cx="18" cy="40" r="3" fill="#FCD34D" opacity="0.6" />
            <circle cx="46" cy="40" r="3" fill="#FCD34D" opacity="0.6" />

            {/* Estrella en la bolsa */}
            <path
              d="M32 46 L33.5 49 L37 49.5 L34.5 51.5 L35 55 L32 53.5 L29 55 L29.5 51.5 L27 49.5 L30.5 49 Z"
              fill="#FBBF24"
            />

            <defs>
              <linearGradient id="bagGradient" x1="12" y1="12" x2="52" y2="62" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Flecha animada */}
        <div className="mt-1 animate-bounce">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </button>
  );
}
