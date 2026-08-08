"use client";

import { useState, useEffect, useCallback } from "react";
import MascotAvatar from "@/components/MascotAvatar";

const SLIDES = [
  {
    mascot: "box",
    title: "¡Conoce a tus Mascotas!",
    subtitle: "Compañeros inteligentes que te ayudan a comprar y vender",
    color: "from-amber-500 to-orange-600",
    bg: "bg-gradient-to-br from-amber-50 to-orange-100",
    features: ["Asistente con IA", "Responde tus preguntas", "Te guía en cada compra"],
  },
  {
    mascot: "cart",
    title: "Personaliza tu Mascota",
    subtitle: "Elige entre mascotas gratuitas y premium",
    color: "from-green-500 to-emerald-600",
    bg: "bg-gradient-to-br from-green-50 to-emerald-100",
    features: ["5 mascotas gratis", "12 premium exclusivas", "Nombres personalizados"],
  },
  {
    mascot: "rocket_b",
    title: "¡Desbloquea Logros!",
    subtitle: "Consigue mascotas premium comprando y vendiendo",
    color: "from-red-500 to-rose-600",
    bg: "bg-gradient-to-br from-red-50 to-rose-100",
    features: ["Primera compra = 1 mascota", "5 ventas = mascota rara", "100 ventas = legendario"],
  },
];

const PARTICLE_COLORS = ["#F59E0B", "#22C55E", "#3B82F6", "#EC4899", "#A855F7", "#EF4444"];

function Particle({ delay, color }) {
  const left = Math.random() * 100;
  const size = 4 + Math.random() * 6;
  const duration = 2 + Math.random() * 2;
  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        left: `${left}%`,
        top: "-10px",
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        animation: `mascotConfetti ${duration}s ease-in ${delay}s forwards`,
        opacity: 0,
      }}
    />
  );
}

const MASCOT_WELCOME_ENABLED = false;

export default function MascotWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!MASCOT_WELCOME_ENABLED) return null;

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem("mascot-welcome-shown");
      if (!shown) {
        const t = setTimeout(() => setIsOpen(true), 5000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
        try { sessionStorage.setItem("mascot-welcome-shown", "1"); } catch {}
      }, 300);
    }, 100);
  }, []);

  // Auto-close after 48 seconds if not manually closed
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => handleClose(), 48000);
    return () => clearTimeout(t);
  }, [isOpen, handleClose]);

  const goToSlide = (idx) => {
    if (idx !== currentSlide) setCurrentSlide(idx);
  };

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
  }));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ transition: "opacity 0.3s ease", opacity: isVisible ? 1 : 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div
        className={`relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${slide.bg}`}
        style={{
          transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
          transform: isVisible ? "scale(1) translateY(0)" : "scale(0.8) translateY(30px)",
        }}
      >
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {particles.map((p) => (
            <Particle key={`${currentSlide}-${p.id}`} delay={p.delay} color={p.color} />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8 text-center">
          {/* Mascot */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{ background: `linear-gradient(135deg, ${slide.color.includes("amber") ? "#F59E0B" : slide.color.includes("green") ? "#22C55E" : "#EF4444"}, transparent)` }}
              />
              <div className="relative animate-[mascotBounce_2s_ease-in-out_infinite]">
                <MascotAvatar type={slide.mascot} size={100} animate={true} view="front" />
              </div>
            </div>
          </div>

          {/* Text */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            {slide.title}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-5">
            {slide.subtitle}
          </p>

          {/* Features */}
          <div className="flex flex-col gap-2 mb-6">
            {slide.features.map((feat, i) => (
              <div
                key={feat}
                className="flex items-center justify-center gap-2 text-sm text-gray-700"
                style={{ animation: `fadeInUp 0.4s ease ${i * 0.1}s both` }}
              >
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feat}
              </div>
            ))}
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center gap-2 mb-5">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "bg-gray-800 w-6" : "bg-gray-400/40 w-2"
                }`}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleClose}
            className={`w-full py-3 rounded-xl text-white font-bold text-sm sm:text-base bg-gradient-to-r ${slide.color} hover:shadow-lg hover:scale-[1.02] transition-all duration-200`}
          >
            ¡Explorar Mascotas!
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Encuéntralas en tu Dashboard → Mascotas
          </p>
        </div>
      </div>
    </div>
  );
}
