"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuthContext } from "@/context/AuthProvider";
import { useMascotContext } from "@/context/MascotProvider";
import MascotAvatar from "@/components/MascotAvatar";
import Mascot3D from "@/components/Mascot3D";
import AccessoryShop from "@/components/AccessoryShop";
import useMascotBehavior from "@/hooks/useMascotBehavior";
import useMascotPersonality from "@/hooks/useMascotPersonality";
import useMascotCoins from "@/hooks/useMascotCoins";
import { usePathname } from "next/navigation";
import { MASCOTS } from "@/lib/mascotCatalog";
import { MascotEmotion } from "@/lib/mascot/MascotEmotion";

function ConfettiParticle({ delay, color }) {
  const left = Math.random() * 100;
  const duration = 1.5 + Math.random() * 1.5;
  const size = 4 + Math.random() * 4;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`, top: "-10px",
        width: `${size}px`, height: `${size}px`,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        animation: `confettiFall ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

function Balloon({ delay, color, left }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${left}%`, bottom: "0%",
        animation: `balloonFloat 3s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      <svg width="24" height="32" viewBox="0 0 24 32">
        <ellipse cx="12" cy="12" rx="10" ry="12" fill={color} opacity="0.85" />
        <polygon points="12,23 10,26 14,26" fill={color} opacity="0.85" />
        <line x1="12" y1="26" x2="12" y2="32" stroke="#9CA3AF" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

function ZzzBubbles({ active }) {
  if (!active) return null;
  return (
    <div className="absolute -top-6 left-0 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute text-blue-400 font-bold opacity-0"
          style={{
            left: `${i * 8}px`,
            fontSize: `${10 + i * 3}px`,
            animation: `zzzFloat 2s ease-out ${i * 0.6}s infinite`,
          }}
        >
          Z
        </span>
      ))}
    </div>
  );
}

const BALLOON_COLORS = ["#F87171", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#FB923C", "#F472B6"];
const CONFETTI_COLORS = ["#F87171", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#FB923C"];

export default function ScrollMascot({ onClick }) {
  const { user } = useAuthContext() || {};
  const { emotion, lastMessage: emotionMsg, emotionMessageKey, triggerInteraction } = useMascotContext() || {};
  const pathname = usePathname();

  // Core states
  const [progress, setProgress] = useState(0);
  const [viewH, setViewH] = useState(800);
  const [navH, setNavH] = useState(130);
  const [isWaving, setIsWaving] = useState(true);
  const [message, setMessage] = useState("");
  const [msgKey, setMsgKey] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBalloons, setShowBalloons] = useState(false);
  const [mascotType, setMascotType] = useState("box");
  const [mascotName, setMascotName] = useState("");
  const [showShop, setShowShop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const mascotNameResolved = useRef(false);
  const lastMessageZone = useRef("");
  const encourageTimer = useRef(null);
  const hasGreeted = useRef(false);
  const scrollElRef = useRef(null);
  const mascotRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Systems
  const {
    state: mascotState, position, direction, isGrounded, zzz, jump, reactToActivity, STATES,
  } = useMascotBehavior({
    screenWidth: typeof window !== "undefined" ? window.innerWidth : 1200,
    screenHeight: viewH,
    navHeight: navH,
    isActive: true,
  });

  const { mood, moodEmoji, lastDialogue, dialogueKey, speak } = useMascotPersonality();
  const { coins, newCoinAnimation, lastBonusMsg, addScrollCoins, getEquippedDisplay, getScrollSpeed, getWalkSpeed, equipped } = useMascotCoins();

  // --- PERSISTENCE ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("selectedMascot");
      if (saved && saved !== mascotType) setMascotType(saved);
    } catch {}
  }, []); // eslint-disable-line

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/mascot", { credentials: "include", cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (!cancelled && d?.mascot) { setMascotType(d.mascot); localStorage.setItem("selectedMascot", d.mascot); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    if (user?.selectedMascot && user.selectedMascot !== mascotType) {
      setMascotType(user.selectedMascot);
      localStorage.setItem("selectedMascot", user.selectedMascot);
    }
  }, [user?.selectedMascot]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/mascot-names", { credentials: "include", cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (cancelled) return;
        const customName = d?.names?.[mascotType];
        setMascotName(customName || MASCOTS[mascotType]?.name || "Shopito");
        mascotNameResolved.current = true;
      })
      .catch(() => { if (!cancelled) { setMascotName(MASCOTS[mascotType]?.name || "Shopito"); mascotNameResolved.current = true; } });
    return () => { cancelled = true; };
  }, [mascotType]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mascotNames");
      if (raw) { const names = JSON.parse(raw); setMascotName(names[mascotType] || MASCOTS[mascotType]?.name || "Shopito"); }
      else setMascotName(MASCOTS[mascotType]?.name || "Shopito");
    } catch { setMascotName(MASCOTS[mascotType]?.name || "Shopito"); }
  }, [mascotType]);

  useEffect(() => {
    const h = (e) => { const t = e?.detail?.mascotId; if (t) { setMascotType(t); localStorage.setItem("selectedMascot", t); } };
    window.addEventListener("mascot-changed", h);
    return () => window.removeEventListener("mascot-changed", h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === "selectedMascot" && e.newValue) setMascotType(e.newValue); };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, []);

  // --- LAYOUT ---
  useEffect(() => {
    const update = () => { setViewH(window.innerHeight); const nav = document.querySelector("nav"); if (nav) setNavH(nav.offsetHeight); };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  // --- SCROLL ---
  useEffect(() => {
    const findAndBind = () => {
      const el = document.querySelector(".flex-1.overflow-auto");
      if (el) { scrollElRef.current = el; el.addEventListener("scroll", updateProgress, { passive: true }); updateProgress(); return true; }
      return false;
    };
    if (!findAndBind()) {
      const interval = setInterval(() => { if (findAndBind()) clearInterval(interval); }, 100);
      window.addEventListener("scroll", updateProgress, { passive: true });
      return () => { clearInterval(interval); window.removeEventListener("scroll", updateProgress); };
    }
    return () => { if (scrollElRef.current) scrollElRef.current.removeEventListener("scroll", updateProgress); };
  }, []); // eslint-disable-line

  const updateProgress = useCallback(() => {
    const el = scrollElRef.current;
    let scrollY = 0, scrollHeight = 0, clientHeight = 0;
    if (el) { scrollY = el.scrollTop; scrollHeight = el.scrollHeight; clientHeight = el.clientHeight; }
    else { scrollY = window.scrollY || document.documentElement.scrollTop; scrollHeight = document.documentElement.scrollHeight; clientHeight = window.innerHeight; }
    const docHeight = scrollHeight - clientHeight;
    if (docHeight <= 0) { setProgress(0); return; }
    const pct = Math.min(Math.max(scrollY / docHeight, 0), 1);
    setProgress(pct);
    lastActivityRef.current = Date.now();
    reactToActivity();
    addScrollCoins(pct * 100);
  }, [reactToActivity, addScrollCoins]);

  // --- ZONE MESSAGES ---
  useEffect(() => {
    if (progress < 0.03) return;
    let zone = "", msg = "";
    if (progress < 0.45) { zone = "early"; msg = speak("scrolling"); }
    else if (progress < 0.55) { zone = "mid"; msg = speak("scrolling"); setIsJumping(true); setTimeout(() => setIsJumping(false), 600); }
    else if (progress < 0.95) { zone = "late"; msg = speak("scrolling"); }
    else { zone = "bottom"; msg = speak("bottom"); }
    if (zone !== lastMessageZone.current && zone !== "") { lastMessageZone.current = zone; setMessage(msg); setMsgKey((k) => k + 1); }
  }, [progress, speak]);

  // --- RANDOM MESSAGES ---
  useEffect(() => {
    let showPhase = true;
    const t = setTimeout(() => {
      encourageTimer.current = setInterval(() => {
        if (showPhase) { setMessage(speak("idle")); setMsgKey((k) => k + 1); showPhase = false; }
        else { setMessage(""); setMsgKey((k) => k + 1); showPhase = true; }
      }, 12000);
    }, 20000);
    return () => { clearTimeout(t); clearInterval(encourageTimer.current); };
  }, [speak]);

  // --- WELCOME ---
  useEffect(() => {
    if (hasGreeted.current || !user || !mascotNameResolved.current || !mascotName) return;
    hasGreeted.current = true;
    const greet = speak("greeting");
    setMessage(greet); setMsgKey((k) => k + 1);
    const t1 = setTimeout(() => { setMessage(speak("scrolling")); setMsgKey((k) => k + 1); }, 6000);
    const t2 = setTimeout(() => setIsWaving(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [user, mascotName, speak]);

  // --- CELEBRATION ---
  useEffect(() => {
    if (progress > 0.95) {
      if (!celebrating) {
        setCelebrating(true); setIsJumping(true); setShowConfetti(true); setShowBalloons(true);
        setMessage(speak("bottom")); setMsgKey((k) => k + 1);
        setTimeout(() => setIsJumping(false), 2000);
        setTimeout(() => setShowConfetti(false), 4000);
        setTimeout(() => setShowBalloons(false), 4000);
      }
    } else { setCelebrating(false); setShowConfetti(false); setShowBalloons(false); }
  }, [progress, celebrating, speak]);

  // --- DRAG & DROP ---
  const handleDragStart = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = mascotRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 });
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const el = mascotRef.current;
      if (el) {
        el.style.position = "fixed";
        el.style.left = `${clientX - dragOffset.x}px`;
        el.style.top = `${clientY - dragOffset.y}px`;
        el.style.transform = "scale(1.1)";
        el.style.zIndex = "9999";
      }
    };
    const handleUp = () => {
      setIsDragging(false);
      const el = mascotRef.current;
      if (el) {
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        el.style.transform = "";
        el.style.zIndex = "";
      }
      reactToActivity();
      setMessage(speak("idle")); setMsgKey((k) => k + 1);
    };
    window.addEventListener("mousemove", handleMove, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, dragOffset, reactToActivity, speak]);

  // --- RENDER ---
  const atBottom = progress > 0.95;
  const startY = navH + 10;
  const endY = viewH - 70;
  const displayPct = Math.round(progress * 100);
  const equippedAccessories = getEquippedDisplay();

  const confetti = Array.from({ length: 20 }, (_, i) => ({ id: i, delay: Math.random() * 1.5, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }));
  const balloons = Array.from({ length: 6 }, (_, i) => ({ id: i, delay: i * 0.3, color: BALLOON_COLORS[i % BALLOON_COLORS.length], left: 10 + i * 15 }));

  const isSleeping = mascotState === STATES.SLEEPING;
  const isSitting = mascotState === STATES.SITTING;
  const isLying = mascotState === STATES.LYING;
  const isWalking = mascotState === STATES.WALKING;

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
        <div className="absolute bottom-0 left-0 w-full rounded-full" style={{ height: `${progress * 100}%`, background: "linear-gradient(to top, #D1FAE5, #FEF9C3)", transition: "height 0.1s linear" }} />
        {[0.25, 0.5, 0.75].map((m) => (
          <div key={m} className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full border border-white bg-gray-300 z-10" style={{ bottom: `${m * 100}%` }} />
        ))}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full border border-white bg-green-200 z-10" />
      </div>

      {/* Coins display */}
      <div
        className={`absolute right-0 top-24 flex flex-col items-center gap-1 pointer-events-none transition-all ${newCoinAnimation ? "scale-125" : ""}`}
      >
        <div
          className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-yellow-200 cursor-pointer pointer-events-auto"
          onClick={() => setShowShop(true)}
          title="Abrir tienda de accesorios"
        >
          <span className="text-sm">🪙</span>
          <span className="text-xs font-bold text-yellow-600">{coins}</span>
        </div>
        {/* Bonus message */}
        {lastBonusMsg && (
          <div className="bg-green-500 text-white text-[9px] font-medium px-2 py-0.5 rounded-full animate-[fadeInScale_0.2s_ease-out] whitespace-nowrap">
            {lastBonusMsg}
          </div>
        )}
      </div>

      {/* Mood emoji */}
      <div className="absolute right-0 top-36 text-lg pointer-events-none select-none" title={`Mood: ${mood}`}>
        {moodEmoji}
      </div>

      {/* Mascot */}
      <div
        ref={mascotRef}
        className={`absolute right-12 sm:right-[60px] pointer-events-auto cursor-pointer group select-none ${showShop ? "pointer-events-none" : ""}`}
        style={{
          top: isWalking ? `${position.y}px` : atBottom ? `${endY - 40}px` : `${startY + progress * (endY - startY)}px`,
          transition: isWalking ? "top 0.03s linear, left 0.03s linear" : "top 0.1s linear",
          transform: isSitting ? "scale(0.9)" : isLying ? "scale(0.85) rotate(-5deg)" : "",
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onClick={() => { if (showShop) return; onClick?.(); triggerInteraction(); jump(); setMessage(speak("idle")); setMsgKey((k) => k + 1); }}
        role="button"
        tabIndex={0}
        aria-label="Mascota"
      >
        {/* Speech bubble */}
        {(message || lastDialogue) && (
          <div key={msgKey + (dialogueKey || 0)} className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 animate-[fadeInScale_0.3s_ease-out]">
            <div className="bg-white text-gray-700 text-[11px] font-medium px-3 py-2 rounded-xl shadow-xl border border-gray-100 relative max-w-[220px] whitespace-normal leading-relaxed">
              {message || lastDialogue}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white" />
            </div>
          </div>
        )}

        {/* ZZZ bubbles */}
        <ZzzBubbles active={isSleeping} />

        {/* Mascot Avatar */}
        <div
          className={`transition-all duration-300 ${
            isJumping ? "animate-[celebrateJump_0.5s_ease-in-out_infinite]" :
            isWalking ? "animate-[mascotFloat_0.5s_ease-in-out_infinite]" :
            "group-hover:scale-110"
          }`}
          style={{
            filter: isSleeping ? "brightness(0.7) saturate(0.5)" : "none",
            transform: `scale(${isSitting ? 0.9 : isLying ? 0.85 : 1})`,
          }}
        >
          <Mascot3D
            size={96}
            idleTime={0}
            isScrolling={!isWalking}
            mascotType={mascotType}
          >
            <MascotAvatar type={mascotType} size={96} animate={!celebrating && !isSleeping} view="front" />
          </Mascot3D>

          {/* Equipped accessories */}
          {equippedAccessories.map((acc) => (
            <div key={acc.id} className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl pointer-events-none" title={acc.name}>
              {acc.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Percentage */}
      <div className="absolute bottom-2 right-0 text-[10px] font-bold text-gray-400 tabular-nums select-none">
        {displayPct}%
      </div>

      {/* Shop rendered via portal to document body (outside pointer-events-none) */}
      {showShop && createPortal(
        <AccessoryShop onClose={() => setShowShop(false)} />,
        document.body
      )}
    </div>
  );
}
