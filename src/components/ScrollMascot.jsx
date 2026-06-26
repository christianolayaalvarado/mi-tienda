"use client";

import { useState, useEffect, useCallback } from "react";

export default function ScrollMascot() {
  const [progress, setProgress] = useState(0);
  const [isWaving, setIsWaving] = useState(true);
  const [showBubble, setShowBubble] = useState(true);

  const updateProgress = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      setProgress(0);
      return;
    }
    const pct = Math.min(Math.max(scrollY / docHeight, 0), 1);
    setProgress(pct);
  }, []);

  useEffect(() => {
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [updateProgress]);

  // Saludo inicial: parpadea y luego deja de saludar
  useEffect(() => {
    const t1 = setTimeout(() => setIsWaving(false), 2500);
    const t2 = setTimeout(() => setShowBubble(false), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Volver a saludar cuando llega al fondo
  useEffect(() => {
    if (progress > 0.95) {
      setIsWaving(true);
      setShowBubble(true);
    }
  }, [progress]);

  const atTop = progress < 0.05;
  const atBottom = progress > 0.95;

  return (
    <div className="fixed right-3 sm:right-5 top-20 bottom-4 z-50 flex flex-col items-center pointer-events-none">
      {/* Línea de progreso de fondo */}
      <div className="relative w-1.5 flex-1 bg-gray-200/60 rounded-full overflow-hidden">
        {/* Barra de progreso rellena */}
        <div
          className="absolute bottom-0 left-0 w-full rounded-full transition-all duration-150 ease-out"
          style={{
            height: `${progress * 100}%`,
            background: "linear-gradient(to top, #F59E0B, #3B82F6)",
          }}
        />

        {/* Marcadores de progreso cada 25% */}
        {[0.25, 0.5, 0.75].map((mark) => (
          <div
            key={mark}
            className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-gray-300"
            style={{ bottom: `${mark * 100}%` }}
          />
        ))}

        {/* Mascota que se mueve a lo largo de la línea */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-all duration-150 ease-out"
          style={{ bottom: `${progress * 100}%` }}
        >
          {/* Burbuja de texto */}
          {showBubble && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap">
              <div className="bg-white text-gray-700 text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-gray-100 relative">
                {atTop
                  ? "¡Hola! Soy Bolsita 🛍️"
                  : atBottom
                  ? "¡Llegaste al final! 🎉"
                  : "¡Sigue bajando! 👇"}
                <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-white" />
              </div>
            </div>
          )}

          {/* Bolsita - SVG */}
          <div className={`transition-transform duration-200 ${isWaving ? "animate-[wiggle_0.4s_ease-in-out_3]" : "group-hover:scale-110"}`}>
            <svg
              width="36"
              height="46"
              viewBox="0 0 64 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
            >
              {/* Piernas */}
              <rect x="18" y="62" width="6" height="12" rx="3" fill="#D97706" />
              <rect x="40" y="62" width="6" height="12" rx="3" fill="#D97706" />
              {/* Zapatos */}
              <ellipse cx="21" cy="74" rx="5" ry="2.5" fill="#92400E" />
              <ellipse cx="43" cy="74" rx="5" ry="2.5" fill="#92400E" />

              {/* Brazos */}
              <rect
                x="4" y="30" width="6" height="18" rx="3" fill="#D97706"
                className={isWaving ? "origin-top animate-[waveHand_0.4s_ease-in-out_3]" : ""}
                style={{ transformOrigin: "7px 30px" }}
              />
              <rect
                x="54" y="30" width="6" height="18" rx="3" fill="#D97706"
                className={isWaving ? "origin-top animate-[waveHand_0.4s_ease-in-out_3]" : ""}
                style={{ transformOrigin: "57px 30px", animationDelay: "0.08s" }}
              />
              {/* Manos */}
              <circle cx="7" cy="48" r="3.5" fill="#FBBF24" />
              <circle cx="57" cy="48" r="3.5" fill="#FBBF24" />

              {/* Cuerpo - Bolsa de papel */}
              <rect x="12" y="12" width="40" height="48" rx="4" fill="#F59E0B" />
              <rect x="12" y="12" width="40" height="48" rx="4" fill="url(#bagGrad)" />

              {/* Asa */}
              <path d="M22 12 C22 4, 42 4, 42 12" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />

              {/* Pliegues */}
              <line x1="20" y1="18" x2="20" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
              <line x1="32" y1="18" x2="32" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
              <line x1="44" y1="18" x2="44" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />

              {/* Ojos */}
              <ellipse cx="24" cy="32" rx="5" ry="5.5" fill="white" />
              <ellipse cx="40" cy="32" rx="5" ry="5.5" fill="white" />
              <circle cx={atTop ? "24" : "25.5"} cy="33" r="2.8" fill="#1F2937" />
              <circle cx={atTop ? "40" : "41.5"} cy="33" r="2.8" fill="#1F2937" />
              <circle cx={atTop ? "25" : "26.5"} cy="31.5" r="1" fill="white" />
              <circle cx={atTop ? "41" : "42.5"} cy="31.5" r="1" fill="white" />

              {/* Cejas */}
              <line x1="20" y1="25" x2="28" y2="26" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="36" y1="26" x2="44" y2="25" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />

              {/* Boca */}
              {atBottom ? (
                // Boca abierta - sorpresa/feliz
                <ellipse cx="32" cy="44" rx="5" ry="3.5" fill="#92400E" />
              ) : (
                <path d="M26 43 Q32 48 38 43" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
              )}

              {/* Mejillas */}
              <circle cx="18" cy="40" r="2.5" fill="#FCD34D" opacity="0.5" />
              <circle cx="46" cy="40" r="2.5" fill="#FCD34D" opacity="0.5" />

              {/* Estrella */}
              <path d="M32 48 L33.2 50.5 L36 51 L34 53 L34.5 56 L32 54.5 L29.5 56 L30 53 L28 51 L30.8 50.5 Z" fill="#FBBF24" />

              <defs>
                <linearGradient id="bagGrad" x1="12" y1="12" x2="52" y2="60" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Punto final - topo */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-500" />
      </div>

      {/* Porcentaje */}
      <div className="mt-2 text-[10px] font-bold text-gray-400 tabular-nums select-none">
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
}
