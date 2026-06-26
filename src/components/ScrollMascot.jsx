"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthContext } from "@/context/AuthProvider";

const MESSAGES_TOP = [
  "¡Hola! Soy Bolsita, tu guía de compras 🛍️",
  "¡Bienvenido! Explora nuestra tienda ✨",
  "¡Qué alegría verte! Tenemos ofertas increíbles 🔥",
];

const MESSAGES_MID = [
  "¡Ya vas por la mitad! Sigue bajando 🚀",
  "Mira estos productos increíbles 👀",
  "¡No te pierdas nuestras ofertas! 💰",
  "¿Ya viste lo que tenemos para ti? 🏠",
];

const MESSAGES_BOTTOM = [
  "¡Llegaste al final! Ya viste todo 🎉",
  "¡Genial! Ya conoces todos nuestros productos ⭐",
];

const ENCOURAGE_MESSAGES = [
  "¡Productos con precios de infarto! 🔥",
  "¡Ofertas que no puedes dejar pasar! 💸",
  "¡Todo para tu hogar al mejor precio! 🏡",
  "¡Calidad que te va a sorprender! ✨",
  "¡Compra inteligente, compra en Mi Tienda! 🛒",
  "¡Envío rápido a toda tu puerta! 🚚",
  "¡Los mejores vendedores están aquí! ⭐",
  "¡Regala algo especial hoy! 🎁",
  "¡Productos únicos que enamoran! 💝",
  "¡Tu hogar merece lo mejor! 🏠",
  "¡Precios que tu billetera va a amar! 💰",
  "¡Descubre productos que no sabías que necesitabas! 🔍",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function ScrollMascot() {
  const { user } = useAuthContext() || {};
  const [progress, setProgress] = useState(0);
  const [isWaving, setIsWaving] = useState(true);
  const [message, setMessage] = useState("");
  const [msgKey, setMsgKey] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [eyeDirection, setEyeDirection] = useState({ x: 0, y: 0 });
  const [armAngle, setArmAngle] = useState(0);
  const lastMessageZone = useRef("");
  const encourageTimer = useRef(null);

  const updateProgress = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) { setProgress(0); return; }
    setProgress(Math.min(Math.max(scrollY / docHeight, 0), 1));
  }, []);

  // Track mouse for eye direction
  useEffect(() => {
    const handleMouse = (e) => {
      const centerX = window.innerWidth - 50;
      const centerY = window.innerHeight / 2;
      const dx = (e.clientX - centerX) / window.innerWidth;
      const dy = (e.clientY - centerY) / window.innerHeight;
      setEyeDirection({ x: dx * 2.5, y: dy * 2 });
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
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

  // Greeting on mount
  useEffect(() => {
    const name = user?.name || "";
    const greet = name ? `¡Hola ${name}! Soy Bolsita 🛍️` : pickRandom(MESSAGES_TOP);
    setMessage(greet);
    setMsgKey((k) => k + 1);
    const t = setTimeout(() => { setIsWaving(false); }, 3000);
    return () => clearTimeout(t);
  }, [user]);

  // Messages based on scroll zone
  useEffect(() => {
    let zone = "";
    let msg = "";

    if (progress < 0.05) {
      zone = "top";
      const name = user?.name || "";
      msg = name ? `¡Hola ${name}! Sigue explorando 👇` : pickRandom(MESSAGES_TOP);
    } else if (progress < 0.45) {
      zone = "early";
      msg = "Muuévete más abajo para ver más productos 👇";
    } else if (progress < 0.55) {
      zone = "mid";
      msg = pickRandom(MESSAGES_MID);
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 600);
    } else if (progress < 0.95) {
      zone = "late";
      msg = "¡Casi llegas! Faltan poquitos productos 🏁";
    } else {
      zone = "bottom";
      msg = pickRandom(MESSAGES_BOTTOM);
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 600);
    }

    if (zone !== lastMessageZone.current) {
      lastMessageZone.current = zone;
      setMessage(msg);
      setMsgKey((k) => k + 1);
    }
  }, [progress, user]);

  // Random encourage messages every 8s
  useEffect(() => {
    encourageTimer.current = setInterval(() => {
      setMessage(pickRandom(ENCOURAGE_MESSAGES));
      setMsgKey((k) => k + 1);
    }, 8000);
    return () => clearInterval(encourageTimer.current);
  }, []);

  // Arm wave cycle
  useEffect(() => {
    const t = setInterval(() => setArmAngle((a) => (a === 0 ? -20 : 0)), 1500);
    return () => clearInterval(t);
  }, []);

  const atTop = progress < 0.05;
  const atBottom = progress > 0.95;

  // Mascot Y position: from 80px (below navbar) to bottom of viewport
  const viewH = typeof window !== "undefined" ? window.innerHeight : 800;
  const mascotTop = 80 + progress * (viewH - 180);

  return (
    <div className="fixed right-2 sm:right-4 top-0 bottom-0 z-50 pointer-events-none">
      {/* Barra de progreso */}
      <div className="absolute right-1.5 sm:right-2 top-20 bottom-8 w-1 bg-gray-200/50 rounded-full">
        <div
          className="absolute bottom-0 left-0 w-full rounded-full transition-all duration-150 ease-out"
          style={{ height: `${progress * 100}%`, background: "linear-gradient(to top, #F59E0B, #3B82F6)" }}
        />
        {[0.25, 0.5, 0.75].map((m) => (
          <div key={m} className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 border-white bg-gray-300 z-10" style={{ bottom: `${m * 100}%` }} />
        ))}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full border-2 border-white bg-blue-500 z-10" />
      </div>

      {/* Mascota */}
      <div
        className="absolute right-0 sm:right-1 transition-all duration-200 ease-out pointer-events-auto cursor-pointer group"
        style={{ top: `${mascotTop}px` }}
      >
        {/* Burbuja de mensaje */}
        <div key={msgKey} className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap z-20 animate-[fadeInScale_0.3s_ease-out]">
          <div className="bg-white text-gray-700 text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl border border-gray-100 relative max-w-[200px] whitespace-normal leading-relaxed">
            {message}
            <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-white" />
          </div>
        </div>

        {/* SVG Bolsita */}
        <div
          className={`transition-transform duration-200 ${isWaving || isJumping ? "animate-[wiggle_0.4s_ease-in-out_3]" : "group-hover:scale-110"}`}
        >
          <svg width="44" height="56" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            {/* Piernas con caminata */}
            <g className={isJumping ? "" : ""}>
              <rect x="18" y="62" width="6" height="12" rx="3" fill="#D97706">
                {isJumping && <animate attributeName="y" values="62;58;62" dur="0.3s" repeatCount="2" />}
              </rect>
              <rect x="40" y="62" width="6" height="12" rx="3" fill="#D97706">
                {isJumping && <animate attributeName="y" values="62;58;62" dur="0.3s" repeatCount="2" begin="0.05s" />}
              </rect>
              <ellipse cx="21" cy="74" rx="5" ry="2.5" fill="#92400E" />
              <ellipse cx="43" cy="74" rx="5" ry="2.5" fill="#92400E" />
            </g>

            {/* Brazos */}
            <rect
              x="4" y="30" width="6" height="18" rx="3" fill="#D97706"
              style={{ transformOrigin: "7px 30px", transform: `rotate(${isWaving ? armAngle : 0}deg)`, transition: "transform 0.3s ease" }}
            />
            <rect
              x="54" y="30" width="6" height="18" rx="3" fill="#D97706"
              style={{ transformOrigin: "57px 30px", transform: `rotate(${isWaving ? -armAngle * 0.8 : 0}deg)`, transition: "transform 0.3s ease" }}
            />
            <circle cx="7" cy="48" r="3.5" fill="#FBBF24" />
            <circle cx="57" cy="48" r="3.5" fill="#FBBF24" />

            {/* Cuerpo */}
            <rect x="12" y="12" width="40" height="48" rx="4" fill="#F59E0B" />
            <rect x="12" y="12" width="40" height="48" rx="4" fill="url(#bGrad)" />

            {/* Asa */}
            <path d="M22 12 C22 4, 42 4, 42 12" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Pliegues */}
            <line x1="20" y1="18" x2="20" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
            <line x1="32" y1="18" x2="32" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
            <line x1="44" y1="18" x2="44" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />

            {/* Ojos con dirección */}
            <ellipse cx="24" cy="32" rx="5" ry="5.5" fill="white" />
            <ellipse cx="40" cy="32" rx="5" ry="5.5" fill="white" />
            <circle cx={24 + eyeDirection.x} cy={33 + eyeDirection.y} r="2.8" fill="#1F2937" />
            <circle cx={40 + eyeDirection.x} cy={33 + eyeDirection.y} r="2.8" fill="#1F2937" />
            <circle cx={25 + eyeDirection.x * 0.5} cy={31.5 + eyeDirection.y * 0.5} r="1" fill="white" />
            <circle cx={41 + eyeDirection.x * 0.5} cy={31.5 + eyeDirection.y * 0.5} r="1" fill="white" />

            {/* Cejas */}
            <line x1="20" y1="25" x2="28" y2="26" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="36" y1="26" x2="44" y2="25" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />

            {/* Boca */}
            {atBottom ? (
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
              <linearGradient id="bGrad" x1="12" y1="12" x2="52" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Porcentaje */}
      <div className="absolute bottom-2 right-0 text-[10px] font-bold text-gray-400 tabular-nums select-none">
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
}
