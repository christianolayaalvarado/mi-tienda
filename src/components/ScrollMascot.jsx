"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthContext } from "@/context/AuthProvider";

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

// Encontrar el contenedor scrolleable
function findScrollContainer() {
  // Buscar el div flex-1 overflow-auto del layout
  const el = document.querySelector(".flex-1.overflow-auto");
  if (el) return el;
  // Fallback: buscar cualquier elemento con overflow auto/scroll
  const all = document.querySelectorAll("div");
  for (const d of all) {
    const style = window.getComputedStyle(d);
    if ((style.overflow === "auto" || style.overflow === "scroll" ||
         style.overflowY === "auto" || style.overflowY === "scroll") &&
        d.scrollHeight > d.clientHeight) {
      return d;
    }
  }
  return null;
}

export default function ScrollMascot() {
  const { user } = useAuthContext() || {};
  const [progress, setProgress] = useState(0);
  const [viewH, setViewH] = useState(800);
  const [isWaving, setIsWaving] = useState(true);
  const [message, setMessage] = useState("");
  const [msgKey, setMsgKey] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [eyeDirection, setEyeDirection] = useState({ x: 0, y: 0 });
  const [isIdle, setIsIdle] = useState(true);
  const [idleFrame, setIdleFrame] = useState(0);
  const lastMessageZone = useRef("");
  const encourageTimer = useRef(null);
  const hasGreeted = useRef(false);
  const idleTimer = useRef(null);
  const scrollElRef = useRef(null);

  // Track window height
  useEffect(() => {
    const updateHeight = () => setViewH(window.innerHeight);
    updateHeight();
    window.addEventListener("resize", updateHeight, { passive: true });
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Encontrar el contenedor scrolleable y escuchar su evento scroll
  useEffect(() => {
    const findAndBind = () => {
      const el = findScrollContainer();
      if (el) {
        scrollElRef.current = el;
        el.addEventListener("scroll", updateProgress, { passive: true });
        updateProgress();
        return true;
      }
      return false;
    };

    // Intentar encontrar el contenedor
    if (!findAndBind()) {
      // Si no existe aún, observer para detectarlo
      const interval = setInterval(() => {
        if (findAndBind()) clearInterval(interval);
      }, 100);
      // También intentar en window como fallback
      window.addEventListener("scroll", updateProgress, { passive: true });
      return () => {
        clearInterval(interval);
        window.removeEventListener("scroll", updateProgress);
        if (scrollElRef.current) {
          scrollElRef.current.removeEventListener("scroll", updateProgress);
        }
      };
    }

    return () => {
      if (scrollElRef.current) {
        scrollElRef.current.removeEventListener("scroll", updateProgress);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcular progreso real desde el contenedor scrolleable
  const updateProgress = useCallback(() => {
    const el = scrollElRef.current;
    let scrollY = 0;
    let scrollHeight = 0;
    let clientHeight = 0;

    if (el) {
      scrollY = el.scrollTop;
      scrollHeight = el.scrollHeight;
      clientHeight = el.clientHeight;
    } else {
      scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    }

    const docHeight = scrollHeight - clientHeight;
    if (docHeight <= 0) { setProgress(0); return; }
    const pct = Math.min(Math.max(scrollY / docHeight, 0), 1);
    setProgress(pct);
    setIsIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsIdle(true), 800);
  }, []);

  // Mouse para ojos
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

  // Animación idle: brazos y piernas cada 0.6s
  useEffect(() => {
    if (!isIdle) return;
    const t = setInterval(() => setIdleFrame((f) => f + 1), 600);
    return () => clearInterval(t);
  }, [isIdle]);

  // Primer mensaje + segundo después de 6 segundos
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    const name = user?.name || "";
    const greet = name
      ? `¡Hola ${name}, bienvenido! Soy Shopito 🛍️`
      : `¡Hola, bienvenido! Soy Shopito 🛍️`;
    setMessage(greet);
    setMsgKey((k) => k + 1);

    const t1 = setTimeout(() => {
      setMessage("Sigue bajando, ¡hay más productos para ti! 👇");
      setMsgKey((k) => k + 1);
    }, 6000);

    const t2 = setTimeout(() => { setIsWaving(false); }, 3000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user]);

  // Mensajes por zona
  useEffect(() => {
    if (progress < 0.03) return;

    let zone = "";
    let msg = "";

    if (progress < 0.45) {
      zone = "early";
      msg = "Sigue bajando, ¡hay más productos para ti! 👇";
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

    if (zone !== lastMessageZone.current && zone !== "") {
      lastMessageZone.current = zone;
      setMessage(msg);
      setMsgKey((k) => k + 1);
    }
  }, [progress]);

  // Mensajes aleatorios: empieza después de 15s, luego 10s visible, 10s vacío
  useEffect(() => {
    let showPhase = true;
    const startTimeout = setTimeout(() => {
      encourageTimer.current = setInterval(() => {
        if (showPhase) {
          setMessage(pickRandom(ENCOURAGE_MESSAGES));
          setMsgKey((k) => k + 1);
          showPhase = false;
        } else {
          setMessage("");
          setMsgKey((k) => k + 1);
          showPhase = true;
        }
      }, 10000);
    }, 15000);
    return () => {
      clearTimeout(startTimeout);
      clearInterval(encourageTimer.current);
    };
  }, []);

  const atBottom = progress > 0.95;

  // Brazos
  const armL = isIdle ? (idleFrame % 2 === 0 ? -12 : 5) : isWaving ? (idleFrame % 2 === 0 ? -20 : 10) : 0;
  const armR = isIdle ? (idleFrame % 2 === 0 ? 5 : -12) : isWaving ? (idleFrame % 2 === 0 ? 10 : -20) : 0;

  // Piernas
  const legL = isIdle ? (idleFrame % 2 === 0 ? 0 : 3) : 0;
  const legR = isIdle ? (idleFrame % 2 === 0 ? 3 : 0) : 0;

  // Posición mascot: de arriba (80px) hasta fondo del viewport
  const startY = 80;
  const endY = viewH - 70;
  // Cuando llega al final, subir 40px para no tapar el porcentaje
  const mascotTop = atBottom
    ? endY - 40
    : startY + progress * (endY - startY);

  const displayPct = Math.round(progress * 100);

  return (
    <div className="fixed right-2 sm:right-4 top-0 bottom-0 z-50 pointer-events-none">
      {/* Barra de progreso - debajo de la navbar, más delgada */}
      <div className="absolute right-2 sm:right-3 top-20 bottom-8 w-[3px] bg-gray-200/40 rounded-full">
        <div
          className="absolute bottom-0 left-0 w-full rounded-full"
          style={{
            height: `${progress * 100}%`,
            background: "linear-gradient(to top, #D1FAE5, #FEF9C3)",
            transition: "height 0.1s linear",
          }}
        />
        {[0.25, 0.5, 0.75].map((m) => (
          <div key={m} className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full border border-white bg-gray-300 z-10" style={{ bottom: `${m * 100}%` }} />
        ))}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full border border-white bg-green-200 z-10" />
      </div>

      {/* Mascota */}
      <div
        className="absolute right-0 sm:right-1 pointer-events-auto cursor-pointer group"
        style={{ top: `${mascotTop}px`, transition: "top 0.1s linear" }}
      >
        {/* Burbuja */}
        {message && (
          <div key={msgKey} className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap z-20 animate-[fadeInScale_0.3s_ease-out]">
            <div className="bg-white text-gray-700 text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl border border-gray-100 relative max-w-[220px] whitespace-normal leading-relaxed">
              {message}
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-white" />
            </div>
          </div>
        )}

        {/* SVG Shopito */}
        <div className={`transition-transform duration-200 ${isJumping ? "animate-[wiggle_0.4s_ease-in-out_3]" : "group-hover:scale-110"}`}>
          <svg width="44" height="56" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            {/* Piernas */}
            <rect x="18" y="62" width="6" height="12" rx="3" fill="#D97706"
              style={{ transform: `translateY(${isJumping ? -4 : legL}px)`, transition: "transform 0.3s ease" }} />
            <rect x="40" y="62" width="6" height="12" rx="3" fill="#D97706"
              style={{ transform: `translateY(${isJumping ? -4 : legR}px)`, transition: "transform 0.3s ease" }} />
            <ellipse cx="21" cy="74" rx="5" ry="2.5" fill="#92400E"
              style={{ transform: `translateY(${isJumping ? -4 : legL}px)`, transition: "transform 0.3s ease" }} />
            <ellipse cx="43" cy="74" rx="5" ry="2.5" fill="#92400E"
              style={{ transform: `translateY(${isJumping ? -4 : legR}px)`, transition: "transform 0.3s ease" }} />

            {/* Brazos */}
            <rect x="4" y="30" width="6" height="18" rx="3" fill="#D97706"
              style={{ transformOrigin: "7px 30px", transform: `rotate(${armL}deg)`, transition: "transform 0.3s ease" }} />
            <rect x="54" y="30" width="6" height="18" rx="3" fill="#D97706"
              style={{ transformOrigin: "57px 30px", transform: `rotate(${armR}deg)`, transition: "transform 0.3s ease" }} />
            <circle cx="7" cy="48" r="3.5" fill="#FBBF24"
              style={{ transform: `rotate(${armL}deg)`, transformOrigin: "7px 30px", transition: "transform 0.3s ease" }} />
            <circle cx="57" cy="48" r="3.5" fill="#FBBF24"
              style={{ transform: `rotate(${armR}deg)`, transformOrigin: "57px 30px", transition: "transform 0.3s ease" }} />

            {/* Cuerpo */}
            <rect x="12" y="12" width="40" height="48" rx="4" fill="#F59E0B" />
            <rect x="12" y="12" width="40" height="48" rx="4" fill="url(#bGrad)" />
            <path d="M22 12 C22 4, 42 4, 42 12" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <line x1="20" y1="18" x2="20" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
            <line x1="32" y1="18" x2="32" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
            <line x1="44" y1="18" x2="44" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />

            {/* Ojos */}
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
        {displayPct}%
      </div>
    </div>
  );
}
