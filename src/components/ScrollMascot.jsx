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

function findScrollContainer() {
  const el = document.querySelector(".flex-1.overflow-auto");
  if (el) return el;
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

// Confetti particles
function ConfettiParticle({ delay, color }) {
  const left = Math.random() * 100;
  const duration = 1.5 + Math.random() * 1.5;
  const size = 4 + Math.random() * 4;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        top: "-10px",
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

// Balloon
function Balloon({ delay, color, left }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`,
        bottom: "0%",
        animation: `balloonFloat 3s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <svg width="24" height="32" viewBox="0 0 24 32">
        <ellipse cx="12" cy="12" rx="10" ry="12" fill={color} opacity="0.85" />
        <ellipse cx="12" cy="12" rx="10" ry="12" fill="url(#balloonShine)" />
        <polygon points="12,23 10,26 14,26" fill={color} opacity="0.85" />
        <line x1="12" y1="26" x2="12" y2="32" stroke="#9CA3AF" strokeWidth="0.5" />
        <defs>
          <radialGradient id="balloonShine" cx="0.35" cy="0.35">
            <stop offset="0%" stopColor="white" stopOpacity="0.4" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

const BALLOON_COLORS = ["#F87171", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#FB923C", "#F472B6"];
const CONFETTI_COLORS = ["#F87171", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#FB923C"];

export default function ScrollMascot() {
  const { user } = useAuthContext() || {};
  const [progress, setProgress] = useState(0);
  const [viewH, setViewH] = useState(800);
  const [navH, setNavH] = useState(130);
  const [isWaving, setIsWaving] = useState(true);
  const [message, setMessage] = useState("");
  const [msgKey, setMsgKey] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [eyeDirection, setEyeDirection] = useState({ x: 0, y: 0 });
  const [isIdle, setIsIdle] = useState(true);
  const [idleFrame, setIdleFrame] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBalloons, setShowBalloons] = useState(false);
  const lastMessageZone = useRef("");
  const encourageTimer = useRef(null);
  const hasGreeted = useRef(false);
  const idleTimer = useRef(null);
  const scrollElRef = useRef(null);

  // Track layout
  useEffect(() => {
    const updateLayout = () => {
      setViewH(window.innerHeight);
      const nav = document.querySelector("nav");
      if (nav) setNavH(nav.offsetHeight);
    };
    updateLayout();
    window.addEventListener("resize", updateLayout, { passive: true });
    const nav = document.querySelector("nav");
    let observer = null;
    if (nav) {
      observer = new ResizeObserver(updateLayout);
      observer.observe(nav);
    }
    return () => {
      window.removeEventListener("resize", updateLayout);
      if (observer) observer.disconnect();
    };
  }, []);

  // Find scroll container
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

    if (!findAndBind()) {
      const interval = setInterval(() => {
        if (findAndBind()) clearInterval(interval);
      }, 100);
      window.addEventListener("scroll", updateProgress, { passive: true });
      return () => {
        clearInterval(interval);
        window.removeEventListener("scroll", updateProgress);
        if (scrollElRef.current) scrollElRef.current.removeEventListener("scroll", updateProgress);
      };
    }
    return () => { if (scrollElRef.current) scrollElRef.current.removeEventListener("scroll", updateProgress); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProgress = useCallback(() => {
    const el = scrollElRef.current;
    let scrollY = 0, scrollHeight = 0, clientHeight = 0;
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

  // Mouse eyes
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

  // Idle animation
  useEffect(() => {
    if (!isIdle) return;
    const t = setInterval(() => setIdleFrame((f) => f + 1), 600);
    return () => clearInterval(t);
  }, [isIdle]);

  // Welcome messages
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    const name = user?.name || "";
    const greet = name ? `¡Hola ${name}, bienvenido! Soy Shopito 🛍️` : `¡Hola, bienvenido! Soy Shopito 🛍️`;
    setMessage(greet);
    setMsgKey((k) => k + 1);
    const t1 = setTimeout(() => { setMessage("Sigue bajando, ¡hay más productos para ti! 👇"); setMsgKey((k) => k + 1); }, 6000);
    const t2 = setTimeout(() => { setIsWaving(false); }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user]);

  // Zone messages
  useEffect(() => {
    if (progress < 0.03) return;
    let zone = "", msg = "";
    if (progress < 0.45) {
      zone = "early"; msg = "Sigue bajando, ¡hay más productos para ti! 👇";
    } else if (progress < 0.55) {
      zone = "mid"; msg = pickRandom(MESSAGES_MID);
      setIsJumping(true); setTimeout(() => setIsJumping(false), 600);
    } else if (progress < 0.95) {
      zone = "late"; msg = "¡Casi llegas! Faltan poquitos productos 🏁";
    } else {
      zone = "bottom"; msg = pickRandom(MESSAGES_BOTTOM);
    }
    if (zone !== lastMessageZone.current && zone !== "") {
      lastMessageZone.current = zone;
      setMessage(msg);
      setMsgKey((k) => k + 1);
    }
  }, [progress]);

  // Random messages
  useEffect(() => {
    let showPhase = true;
    const startTimeout = setTimeout(() => {
      encourageTimer.current = setInterval(() => {
        if (showPhase) { setMessage(pickRandom(ENCOURAGE_MESSAGES)); setMsgKey((k) => k + 1); showPhase = false; }
        else { setMessage(""); setMsgKey((k) => k + 1); showPhase = true; }
      }, 10000);
    }, 15000);
    return () => { clearTimeout(startTimeout); clearInterval(encourageTimer.current); };
  }, []);

  // CELEBRATION at bottom
  useEffect(() => {
    if (progress > 0.95) {
      if (!celebrating) {
        setCelebrating(true);
        setIsJumping(true);
        setShowConfetti(true);
        setShowBalloons(true);
        setMessage("¡Felicidades! Llegaste al final 🎉🎊");
        setMsgKey((k) => k + 1);
        setTimeout(() => setIsJumping(false), 2000);
        setTimeout(() => setShowConfetti(false), 4000);
        setTimeout(() => setShowBalloons(false), 4000);
      }
    } else {
      if (celebrating) {
        setCelebrating(false);
        setShowConfetti(false);
        setShowBalloons(false);
      }
    }
  }, [progress, celebrating]);

  const atBottom = progress > 0.95;

  // Arms
  const armL = celebrating ? (idleFrame % 2 === 0 ? -30 : 15) : isIdle ? (idleFrame % 2 === 0 ? -12 : 5) : isWaving ? (idleFrame % 2 === 0 ? -20 : 10) : 0;
  const armR = celebrating ? (idleFrame % 2 === 0 ? 15 : -30) : isIdle ? (idleFrame % 2 === 0 ? 5 : -12) : isWaving ? (idleFrame % 2 === 0 ? 10 : -20) : 0;
  const legL = celebrating ? (idleFrame % 2 === 0 ? 0 : 6) : isIdle ? (idleFrame % 2 === 0 ? 0 : 3) : 0;
  const legR = celebrating ? (idleFrame % 2 === 0 ? 6 : 0) : isIdle ? (idleFrame % 2 === 0 ? 3 : 0) : 0;

  const startY = navH + 10;
  const endY = viewH - 70;
  const mascotTop = atBottom ? endY - 40 : startY + progress * (endY - startY);
  const displayPct = Math.round(progress * 100);

  // Confetti array
  const confetti = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  // Balloons array
  const balloons = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    left: 10 + i * 15,
  }));

  return (
    <div className="fixed right-2 sm:right-4 top-0 bottom-0 z-50 pointer-events-none">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {confetti.map((c) => <ConfettiParticle key={c.id} delay={c.delay} color={c.color} />)}
        </div>
      )}

      {/* Balloons */}
      {showBalloons && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {balloons.map((b) => <Balloon key={b.id} delay={b.delay} color={b.color} left={b.left} />)}
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute right-2 sm:right-3 bottom-8 w-[3px] bg-gray-200/40 rounded-full" style={{ top: `${navH + 10}px` }}>
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

      {/* Mascot */}
      <div
        className="absolute right-0 sm:right-1 pointer-events-auto cursor-pointer group"
        style={{ top: `${mascotTop}px`, transition: "top 0.1s linear" }}
      >
        {/* Speech bubble */}
        {message && (
          <div key={msgKey} className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap z-20 animate-[fadeInScale_0.3s_ease-out]">
            <div className="bg-white text-gray-700 text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl border border-gray-100 relative max-w-[220px] whitespace-normal leading-relaxed">
              {message}
              <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-1 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-white" />
            </div>
          </div>
        )}

        {/* SVG Shopito */}
        <div className={`transition-transform duration-200 ${isJumping ? "animate-[celebrateJump_0.5s_ease-in-out_infinite]" : "group-hover:scale-110"}`}>
          <svg width="44" height="56" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
            {/* Party hat */}
            {atBottom && (
              <g>
                <polygon points="32,0 22,16 42,16" fill="#EF4444" />
                <polygon points="32,0 22,16 42,16" fill="url(#hatGrad)" />
                <circle cx="32" cy="1" r="2.5" fill="#FBBF24" />
                <line x1="25" y1="10" x2="39" y2="10" stroke="#FBBF24" strokeWidth="1" />
                <line x1="23" y1="13" x2="41" y2="13" stroke="#60A5FA" strokeWidth="0.8" />
              </g>
            )}

            {/* Legs */}
            <rect x="18" y="62" width="6" height="12" rx="3" fill="#D97706"
              style={{ transform: `translateY(${isJumping ? -6 : legL}px)`, transition: "transform 0.3s ease" }} />
            <rect x="40" y="62" width="6" height="12" rx="3" fill="#D97706"
              style={{ transform: `translateY(${isJumping ? -6 : legR}px)`, transition: "transform 0.3s ease" }} />
            <ellipse cx="21" cy="74" rx="5" ry="2.5" fill="#92400E"
              style={{ transform: `translateY(${isJumping ? -6 : legL}px)`, transition: "transform 0.3s ease" }} />
            <ellipse cx="43" cy="74" rx="5" ry="2.5" fill="#92400E"
              style={{ transform: `translateY(${isJumping ? -6 : legR}px)`, transition: "transform 0.3s ease" }} />

            {/* Arms */}
            <rect x="4" y="30" width="6" height="18" rx="3" fill="#D97706"
              style={{ transformOrigin: "7px 30px", transform: `rotate(${armL}deg)`, transition: "transform 0.3s ease" }} />
            <rect x="54" y="30" width="6" height="18" rx="3" fill="#D97706"
              style={{ transformOrigin: "57px 30px", transform: `rotate(${armR}deg)`, transition: "transform 0.3s ease" }} />
            <circle cx="7" cy="48" r="3.5" fill="#FBBF24"
              style={{ transform: `rotate(${armL}deg)`, transformOrigin: "7px 30px", transition: "transform 0.3s ease" }} />
            <circle cx="57" cy="48" r="3.5" fill="#FBBF24"
              style={{ transform: `rotate(${armR}deg)`, transformOrigin: "57px 30px", transition: "transform 0.3s ease" }} />

            {/* Body */}
            <rect x="12" y="12" width="40" height="48" rx="4" fill="#F59E0B" />
            <rect x="12" y="12" width="40" height="48" rx="4" fill="url(#bGrad)" />
            <path d="M22 12 C22 4, 42 4, 42 12" stroke="#D97706" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <line x1="20" y1="18" x2="20" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
            <line x1="32" y1="18" x2="32" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />
            <line x1="44" y1="18" x2="44" y2="56" stroke="#D97706" strokeWidth="0.5" opacity="0.25" />

            {/* Eyes */}
            <ellipse cx="24" cy="32" rx="5" ry="5.5" fill="white" />
            <ellipse cx="40" cy="32" rx="5" ry="5.5" fill="white" />
            <circle cx={24 + eyeDirection.x} cy={33 + eyeDirection.y} r="2.8" fill="#1F2937" />
            <circle cx={40 + eyeDirection.x} cy={33 + eyeDirection.y} r="2.8" fill="#1F2937" />
            <circle cx={25 + eyeDirection.x * 0.5} cy={31.5 + eyeDirection.y * 0.5} r="1" fill="white" />
            <circle cx={41 + eyeDirection.x * 0.5} cy={31.5 + eyeDirection.y * 0.5} r="1" fill="white" />

            {/* Eyebrows */}
            <line x1="20" y1="25" x2="28" y2="26" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="36" y1="26" x2="44" y2="25" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />

            {/* Mouth */}
            {atBottom ? (
              <path d="M24 42 Q32 50 40 42" stroke="#92400E" strokeWidth="2" fill="#FCA5A5" strokeLinecap="round" />
            ) : (
              <path d="M26 43 Q32 48 38 43" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}

            {/* Cheeks */}
            <circle cx="18" cy="40" r="2.5" fill="#FCD34D" opacity="0.5" />
            <circle cx="46" cy="40" r="2.5" fill="#FCD34D" opacity="0.5" />

            {/* Star */}
            <path d="M32 48 L33.2 50.5 L36 51 L34 53 L34.5 56 L32 54.5 L29.5 56 L30 53 L28 51 L30.8 50.5 Z" fill="#FBBF24" />

            <defs>
              <linearGradient id="bGrad" x1="12" y1="12" x2="52" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="hatGrad" x1="22" y1="0" x2="42" y2="16" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F87171" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Percentage */}
      <div className="absolute bottom-2 right-0 text-[10px] font-bold text-gray-400 tabular-nums select-none">
        {displayPct}%
      </div>
    </div>
  );
}
