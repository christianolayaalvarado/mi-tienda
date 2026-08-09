"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import MascotAvatar from "@/components/MascotAvatar";

/**
 * MascotChat — expandable chat bubble for talking with the mascot.
 *
 * Features:
 * - Expandable/collapsible panel
 * - Message history with typing indicator
 * - Quick action buttons
 * - Auto-scroll to latest message
 * - Spanish-only UI
 */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
            style={{
              animation: `typingBounce 1s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-[10px] text-gray-400 ml-1">escribiendo...</span>
    </div>
  );
}

function QuickActions({ actions, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-2.5 pb-2 sm:px-2 sm:pb-1">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => onSelect(action.message)}
          className="text-sm sm:text-[10px] px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function MarkdownText({ text }) {
  // Simple bold markdown: **text** -> <strong>text</strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function MascotChat({
  messages,
  isTyping,
  onSend,
  onClear,
  quickActions,
  mascotName = "Shopito",
  mascotType = "box",
  moodEmoji = "😊",
  onClose,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault();
      if (!input.trim() || isTyping) return;
      onSend(input);
      setInput("");
    },
    [input, isTyping, onSend]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <>
      <style>{`
        @media (max-width: 639px) {
          .mascot-chat-panel {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 100% !important;
            border-radius: 0 !important;
            z-index: 99999 !important;
          }
        }
      `}</style>
      <div
        className="mascot-chat-panel flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[fadeInScale_0.2s_ease-out]"
        style={{ width: "280px", height: "360px", maxHeight: "60vh" }}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
            <MascotAvatar type={mascotType} size={32} animate={false} view="front" />
          </div>
          <div>
            <div className="text-base sm:text-xs font-bold">{mascotName}</div>
            <div className="text-xs sm:text-[9px] opacity-80">en línea</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClear}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            title="Limpiar chat"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            title="Cerrar chat"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-base sm:text-[11px] py-4">
            <div className="flex justify-center mb-2">
              <MascotAvatar type={mascotType} size={56} animate={true} view="front" />
            </div>
            <div className="font-medium text-gray-600 mb-1">¡Hola! Soy tu asistente 🛍️</div>
            <div className="text-[13px] sm:text-[10px] text-gray-400 mb-3">Elige un tema o escríbeme</div>

            {/* Tutorial grid */}
            <div className="grid grid-cols-2 gap-1.5 px-1">
              {[
                { emoji: "🛒", label: "Cómo comprar", message: "¿Cómo puedo comprar?" },
                { emoji: "💳", label: "Formas de pago", message: "¿Cuáles son las formas de pago?" },
                { emoji: "🏪", label: "Crear mi tienda", message: "¿Cómo creo mi tienda?" },
                { emoji: "📦", label: "Agregar productos", message: "¿Cómo agrego productos?" },
                { emoji: "📊", label: "Mi dashboard", message: "¿Cómo uso mi dashboard?" },
                { emoji: "🧾", label: "Ver pedidos", message: "¿Dónde veo mis pedidos?" },
                { emoji: "⬆️", label: "Plan Full", message: "¿Qué es el plan Full?" },
                { emoji: "🐾", label: "Mis mascotas", message: "¿Cómo funcionan las mascotas?" },
                { emoji: "🔥", label: "Ofertas", message: "¿Dónde veo las ofertas?" },
                { emoji: "📦", label: "Envíos", message: "¿Cómo funcionan los envíos?" },
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={() => onSend(t.message)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors text-left"
                >
                  <span className="text-base">{t.emoji}</span>
                  <span className="text-[11px] sm:text-[9px] font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[85%]">
              <div
                className={`rounded-2xl px-3.5 py-2.5 sm:px-3 sm:py-2 text-base sm:text-[11px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-700 rounded-bl-sm"
                }`}
              >
                <MarkdownText text={msg.text} />
              <div
                className={`text-xs sm:text-[8px] mt-1 ${
                    msg.role === "user" ? "text-green-200" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              {/* Action buttons for bot messages */}
              {msg.role === "bot" && msg.actions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {msg.actions.map((action, i) => (
                    <a
                      key={i}
                      href={action.url}
                      className="text-sm sm:text-[9px] px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors no-underline"
                    >
                      {action.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <QuickActions actions={quickActions || []} onSelect={onSend} />

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 px-2.5 py-2.5 sm:px-2 sm:py-2 border-t border-gray-100">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-1 text-base sm:text-[11px] px-3.5 py-2.5 sm:px-3 sm:py-2 rounded-full bg-gray-50 border border-gray-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200 transition-all"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="p-2.5 sm:p-2 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
    </>
  );
}
