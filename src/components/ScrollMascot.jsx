"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuthContext } from "@/context/AuthProvider";
import { useMascotContext } from "@/context/MascotProvider";
import MascotAvatar from "@/components/MascotAvatar";
import Mascot3D from "@/components/Mascot3D";
import MascotFiestasPatrias from "@/components/MascotFiestasPatrias";
import AccessoryShop from "@/components/AccessoryShop";
import useMascotBehavior from "@/hooks/useMascotBehavior";

import { useHelpCenter } from "@/context/HelpCenterContext";
import { useCelebrations } from "@/context/CelebrationsContext";

function SafePortal({ children, container }) {
  const [mounted, setMounted] = useState(false);
  const portalRef = useRef(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-portal", "scroll-mascot");
    document.body.appendChild(el);
    portalRef.current = el;
    setMounted(true);
    return () => {
      try {
        if (el.parentNode) el.parentNode.removeChild(el);
      } catch {}
    };
  }, []);

  if (!mounted || !portalRef.current) return null;
  return createPortal(children, portalRef.current);
}
import useMascotPersonality from "@/hooks/useMascotPersonality";
import useMascotCoins from "@/hooks/useMascotCoins";
import useMascotChat from "@/hooks/useMascotChat";
import MascotChat from "@/components/MascotChat";
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
  const { openHelp } = useHelpCenter() || {};
  const pathname = usePathname();

  // Mascot visibility (persisted in localStorage)
  const [mascotHidden, setMascotHidden] = useState(() => {
    try { return typeof window !== "undefined" && localStorage.getItem("mascot_hidden") === "true"; } catch { return false; }
  });

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
  const [showChat, setShowChat] = useState(false);
  const [showFiestas, setShowFiestas] = useState(false);
  const { active: celebration } = useCelebrations();
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
  const { coins, newCoinAnimation, addScrollCoins, getEquippedDisplay, getScrollSpeed, getWalkSpeed, equipped } = useMascotCoins();
  const { messages, isTyping, sendMessage, clearMessages, quickActions } = useMascotChat({ mood, mascotName, coins });

  // --- PERSISTENCE ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("selectedMascot");
      if (saved && saved !== mascotType) setMascotType(saved);
    } catch {}
  }, []); // eslint-disable-line

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user-profile/mascot", { credentials: "include", cache: "no-store" })
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
    fetch("/api/user-profile/mascot-names", { credentials: "include", cache: "no-store" })
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

  // Listen for restore event from navbar
  useEffect(() => {
    const handleShow = () => setMascotHidden(false);
    window.addEventListener("mascot:show", handleShow);
    return () => window.removeEventListener("mascot:show", handleShow);
  }, []);

  const handleHideMascot = useCallback(() => {
    setMascotHidden(true);
    setShowChat(false);
    setShowShop(false);
    try { localStorage.setItem("mascot_hidden", "true"); } catch {}
    window.dispatchEvent(new Event("mascot:hidden"));
  }, []);

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

  // --- CELEBRATION OVERLAY ---
  useEffect(() => {
    const manual = localStorage.getItem("showFiestasPatrias") === "true";
    const celebrationActive = celebration?.id === "fiestas_patrias";
    setShowFiestas(celebrationActive || manual);
  }, [celebration]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "showFiestasPatrias") {
        const manual = e.newValue === "true";
        const celebrationActive = celebration?.id === "fiestas_patrias";
        setShowFiestas(celebrationActive || manual);
      }
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, [celebration]);

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

  // Hidden state — still renders the portal chat/shop if open
  if (mascotHidden && !showChat && !showShop) return null;

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
        className={`absolute right-0 top-24 pointer-events-auto transition-all ${newCoinAnimation ? "scale-110" : ""}`}
        onClick={() => setShowShop(true)}
        title="Tienda de accesorios"
      >
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-yellow-200 cursor-pointer">
          <span className="text-sm">🪙</span>
          <span className="text-xs font-bold text-yellow-600">{coins}</span>
        </div>
      </div>

      {/* Chat toggle button - bottom floating */}
      <button
        className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center pointer-events-auto hover:bg-green-600 transition-all hover:scale-110 z-[9998]"
        onClick={() => { setShowChat((v) => !v); setShowShop(false); }}
        title={showChat ? "Cerrar chat" : "Hablar con " + mascotName}
      >
        {showChat ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

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
        {/* Close mascot button */}
        <button
          className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-30 pointer-events-auto shadow"
          onClick={(e) => { e.stopPropagation(); handleHideMascot(); }}
          title="Ocultar mascota"
          aria-label="Ocultar mascota"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

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

          {/* Equipped accessories — sized to match mascot */}
          {equippedAccessories.map((acc) => {
            // Position based on accessory category
            const posStyles = {
              hat: { top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "40px" },
              glasses: { top: "28px", left: "50%", transform: "translateX(-50%)", fontSize: "36px" },
              scarf: { bottom: "-6px", left: "50%", transform: "translateX(-50%)", fontSize: "38px" },
              wings: { top: "10px", left: "50%", transform: "translateX(-50%)", fontSize: "44px" },
              effect: { top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "52px", filter: "drop-shadow(0 0 8px rgba(255,215,0,0.6))" },
            };
            const style = posStyles[acc.category] || posStyles.effect;
            return (
              <div
                key={acc.id}
                className="absolute pointer-events-none select-none"
                style={{ ...style, lineHeight: 1, zIndex: 10 }}
                title={acc.name}
              >
                {acc.emoji}
              </div>
            );
          })}

          {/* Fiestas Patrias overlay */}
          <MascotFiestasPatrias size={96} show={showFiestas} image={celebration?.mascotImage} />
        </div>
      </div>

      {/* Percentage */}
      <div className="absolute bottom-2 right-0 text-[10px] font-bold text-gray-400 tabular-nums select-none">
        {displayPct}%
      </div>

      {/* Shop rendered via portal (dedicated container, no removeChild errors) */}
      {showShop && (
        <SafePortal>
          <AccessoryShop onClose={() => setShowShop(false)} />
        </SafePortal>
      )}

      {/* Chat rendered via portal (dedicated container, no removeChild errors) */}
      {showChat && (
        <SafePortal>
          <div className="fixed bottom-20 left-6 z-[9999]" style={{ maxHeight: "60vh" }}>
            <MascotChat
              messages={messages}
              isTyping={isTyping}
              onSend={(text) => sendMessage(text)}
              onClear={clearMessages}
              quickActions={quickActions}
              mascotName={mascotName}
              mascotType={mascotType}
              moodEmoji={moodEmoji}
              onClose={() => setShowChat(false)}
            />
          </div>
        </SafePortal>
      )}
    </div>
  );
}
