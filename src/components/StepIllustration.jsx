"use client";

import { useState, useEffect } from "react";

const ILLUSTRATIONS = {
  // Shopping / Buying
  search: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="20" y="30" width="160" height="30" rx="15" fill="#e5e7eb" />
      <circle cx={animate ? "150" : "40"} cy="45" r="10" fill="#22c55e" style={{ transition: "cx 0.8s ease" }} />
      <line x1={animate ? "143" : "33"} y1="52" x2={animate ? "135" : "25"} y2="60" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" style={{ transition: "all 0.8s ease" }} />
      <text x="100" y="42" textAnchor="middle" fontSize="10" fill="#6b7280">Buscar productos...</text>
      {animate && (
        <g style={{ animation: "fadeSlideUp 1.5s ease infinite" }}>
          <rect x="30" y="75" width="60" height="50" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
          <rect x="40" y="82" width="40" height="20" rx="4" fill="#dcfce7" />
          <text x="60" y="95" textAnchor="middle" fontSize="7" fill="#166534">S/ 49.90</text>
          <circle cx="85" cy="82" r="6" fill="#22c55e" opacity="0.5" style={{ animation: "pulse 1s ease infinite" }} />
        </g>
      )}
    </svg>
  ),

  productCard: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="30" y="15" width="140" height="110" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="40" y="25" width="120" height="50" rx="6" fill="#f0fdf4" />
      <text x="100" y="55" textAnchor="middle" fontSize="20">📦</text>
      <text x="45" y="90" fontSize="9" fontWeight="bold" fill="#1f2937">Producto Increíble</text>
      <text x="45" y="102" fontSize="8" fill="#6b7280">Categoría</text>
      <text x="45" y="116" fontSize="11" fontWeight="bold" fill="#22c55e">S/ 99.90</text>
      {animate && (
        <rect x="110" y="105" width="50" height="16" rx="8" fill="#22c55e" style={{ animation: "pulse 1.2s ease infinite" }}>
          <animate attributeName="opacity" values="1;0.7;1" dur="1.2s" repeatCount="indefinite" />
        </rect>
      )}
      {animate && <text x="135" y="116" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">Agregar</text>}
    </svg>
  ),

  cart: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <text x="100" y="30" textAnchor="middle" fontSize="28" style={animate ? { animation: "bounce 1s ease infinite" } : {}}>🛒</text>
      <rect x="40" y="45" width="120" height="22" rx="6" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" />
      <text x="50" y="60" fontSize="8" fill="#374151">1x Producto A</text>
      <text x="150" y="60" textAnchor="end" fontSize="8" fill="#22c55e">S/ 49.90</text>
      <rect x="40" y="72" width="120" height="22" rx="6" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1" />
      <text x="50" y="87" fontSize="8" fill="#374151">2x Producto B</text>
      <text x="150" y="87" textAnchor="end" fontSize="8" fill="#22c55e">S/ 79.80</text>
      <line x1="40" y1="102" x2="160" y2="102" stroke="#d1d5db" strokeWidth="1" />
      <text x="50" y="118" fontSize="10" fontWeight="bold" fill="#1f2937">Total:</text>
      <text x="150" y="118" textAnchor="end" fontSize="12" fontWeight="bold" fill="#22c55e">S/ 129.70</text>
    </svg>
  ),

  checkout: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="30" y="10" width="140" height="120" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="100" y="32" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">Método de pago</text>
      {["💳 Tarjeta", "📱 Yape", "🏦 Transferencia", "📦 Contra entrega"].map((m, i) => (
        <g key={i}>
          <rect x="40" y={40 + i * 22} width="120" height="18" rx="9" fill={animate && i === 1 ? "#dcfce7" : "#f9fafb"} stroke={animate && i === 1 ? "#22c55e" : "#e5e7eb"} strokeWidth={animate && i === 1 ? "2" : "1"} style={{ transition: "all 0.5s ease" }} />
          <text x="55" y={53 + i * 22} fontSize="8" fill="#374151">{m}</text>
          {animate && i === 1 && <circle cx="150" cy={49 + i * 22} r="5" fill="#22c55e">
            <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
          </circle>}
        </g>
      ))}
    </svg>
  ),

  // Selling / Dashboard
  dashboard: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="20" y="15" width="160" height="110" rx="8" fill="#1f2937" />
      <rect x="25" y="20" width="40" height="100" rx="4" fill="#374151" />
      <rect x="30" y="28" width="30" height="6" rx="3" fill="#6b7280" />
      <rect x="30" y="40" width="25" height="4" rx="2" fill="#4b5563" />
      <rect x="30" y="50" width="28" height="4" rx="2" fill="#4b5563" />
      <rect x="30" y="60" width="20" height="4" rx="2" fill="#4b5563" />
      {animate && <rect x="28" y="38" width="34" height="10" rx="4" fill="#22c55e" opacity="0.3" style={{ animation: "pulse 1.5s ease infinite" }} />}
      <rect x="70" y="25" width="105" height="45" rx="6" fill="#374151" />
      <text x="80" y="42" fontSize="7" fill="#9ca3af">Ventas hoy</text>
      <text x="80" y="58" fontSize="14" fontWeight="bold" fill="#22c55e">S/ 1,250</text>
      <rect x="70" y="75" width="50" height="35" rx="4" fill="#374151" />
      <rect x="125" y="75" width="50" height="35" rx="4" fill="#374151" />
    </svg>
  ),

  productForm: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="30" y="10" width="140" height="120" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="100" y="30" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1f2937">Nuevo Producto</text>
      <rect x="45" y="38" width="110" height="14" rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />
      <text x="52" y="48" fontSize="7" fill="#9ca3af">Nombre del producto</text>
      {animate && <rect x="45" y="38" width="110" height="14" rx="4" fill="none" stroke="#22c55e" strokeWidth="2" style={{ animation: "pulse 1.5s ease infinite" }} />}
      <rect x="45" y="58" width="110" height="24" rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />
      <text x="52" y="72" fontSize="7" fill="#9ca3af">Descripción...</text>
      <rect x="45" y="88" width="52" height="14" rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />
      <text x="52" y="98" fontSize="7" fill="#9ca3af">S/ 0.00</text>
      <rect x="103" y="88" width="52" height="14" rx="4" fill="#f9fafb" stroke="#d1d5db" strokeWidth="1" />
      <text x="110" y="98" fontSize="7" fill="#9ca3af">Categoría</text>
      <rect x="45" y="108" width="110" height="16" rx="8" fill="#22c55e" />
      <text x="100" y="119" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Publicar</text>
    </svg>
  ),

  upload: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="40" y="20" width="120" height="80" rx="8" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" strokeDasharray={animate ? "8 4" : "0"} style={animate ? { animation: "dashMove 2s linear infinite" } : {}} />
      <text x="100" y="55" textAnchor="middle" fontSize="24" style={animate ? { animation: "float 2s ease-in-out infinite" } : {}}>📷</text>
      <text x="100" y="75" textAnchor="middle" fontSize="8" fill="#6b7280">Arrastra fotos aquí</text>
      <rect x="50" y="105" width="30" height="20" rx="4" fill="#dcfce7" />
      <text x="65" y="118" textAnchor="middle" fontSize="10">🖼️</text>
      <rect x="85" y="105" width="30" height="20" rx="4" fill="#f0fdf4" />
      <text x="100" y="118" textAnchor="middle" fontSize="10">🖼️</text>
      <rect x="120" y="105" width="30" height="20" rx="4" fill="#f0fdf4" stroke="#d1d5db" strokeWidth="1" />
      <text x="135" y="118" textAnchor="middle" fontSize="12" fill="#9ca3af">+</text>
    </svg>
  ),

  // Payments
  yape: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="55" y="10" width="90" height="120" rx="12" fill="#7B2D8E" />
      <text x="100" y="35" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">Yape</text>
      <rect x="70" y="45" width="60" height="60" rx="6" fill="white" />
      <text x="100" y="80" textAnchor="middle" fontSize="22">📱</text>
      {animate && (
        <g style={{ animation: "pulse 1.5s ease infinite" }}>
          <circle cx="100" cy="75" r="25" fill="none" stroke="#7B2D8E" strokeWidth="2" opacity="0.5">
            <animate attributeName="r" values="25;35;25" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      <text x="100" y="118" textAnchor="middle" fontSize="7" fill="white">Escanea el QR</text>
    </svg>
  ),

  transfer: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="30" y="15" width="140" height="110" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="100" y="35" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1f2937">Transferencia Bancaria</text>
      <rect x="45" y="45" width="110" height="30" rx="6" fill="#f0f9ff" stroke="#3b82f6" strokeWidth="1" />
      <text x="55" y="60" fontSize="7" fill="#6b7280">CCI:</text>
      <text x="55" y="70" fontSize="9" fontWeight="bold" fill="#1e40af" fontFamily="monospace">00219119860584806450</text>
      {animate && (
        <g>
          <rect x="70" y="85" width="60" height="18" rx="9" fill="#3b82f6" style={{ animation: "pulse 1.5s ease infinite" }}>
            <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <text x="100" y="97" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Copiar</text>
        </g>
      )}
      <text x="100" y="118" textAnchor="middle" fontSize="7" fill="#6b7280">Cuenta BCP: 191-9860-58480-64</text>
    </svg>
  ),

  // Account / Store
  store: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="40" y="40" width="120" height="80" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <polygon points="100,20 40,40 160,40" fill="#22c55e" />
      <text x="100" y="35" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">Mi Tienda</text>
      <rect x="55" y="55" width="90" height="10" rx="3" fill="#f0fdf4" />
      <text x="100" y="63" textAnchor="middle" fontSize="6" fill="#166534">Nombre de tu tienda</text>
      <rect x="55" y="70" width="90" height="20" rx="3" fill="#f9fafb" />
      <text x="100" y="83" textAnchor="middle" fontSize="6" fill="#9ca3af">Descripción...</text>
      {animate && (
        <circle cx="100" cy="105" r="8" fill="#22c55e" style={{ animation: "bounce 1s ease infinite" }}>
          <animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite" />
        </circle>
      )}
      {animate && <text x="100" y="108" textAnchor="middle" fontSize="8" fill="white">✓</text>}
    </svg>
  ),

  // Ranking / Gamification
  ranking: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="30" y="20" width="140" height="100" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <text x="100" y="38" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">🏆 Ranking</text>
      {[
        { x: 100, y: 85, h: 35, color: "#fbbf24", medal: "🥇", name: "Usuario A" },
        { x: 60, y: 95, h: 25, color: "#9ca3af", medal: "🥈", name: "Tú" },
        { x: 140, y: 100, h: 20, color: "#cd7f32", medal: "🥉", name: "Usuario C" },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x - 20} y={b.y} width="40" height={b.h} rx="4" fill={b.color} opacity={animate ? 0.8 : 0.4} style={animate ? { animation: `fadeSlideUp ${1 + i * 0.3}s ease infinite` } : {}} />
          <text x={b.x} y={b.y + b.h / 2 + 4} textAnchor="middle" fontSize="10">{b.medal}</text>
          <text x={b.x} y={130} textAnchor="middle" fontSize="6" fill="#6b7280">{b.name}</text>
        </g>
      ))}
    </svg>
  ),

  // Mascot
  mascot: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <circle cx="100" cy="60" r="35" fill="#fbbf24" />
      <circle cx="88" cy="52" r="5" fill="#1f2937" />
      <circle cx="112" cy="52" r="5" fill="#1f2937" />
      <path d="M 88 68 Q 100 80 112 68" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <text x="100" y="110" textAnchor="middle" fontSize="8" fill="#6b7280">Haz clic para interactuar</text>
      {animate && (
        <g>
          <circle cx="100" cy="60" r="38" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.5">
            <animate attributeName="r" values="38;45;38" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="155" y="45" fontSize="14" style={{ animation: "float 1.5s ease-in-out infinite" }}>🪙</text>
        </g>
      )}
    </svg>
  ),

  // Coins
  coins: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={60 + i * 20} cy="60" r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"
          style={animate ? { animation: `bounce ${0.8 + i * 0.15}s ease infinite`, animationDelay: `${i * 0.1}s` } : {}} />
      ))}
      <text x="100" y="95" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#92400e">+10 monedas</text>
      <text x="100" y="115" textAnchor="middle" fontSize="8" fill="#6b7280">Gana monedas explorando</text>
    </svg>
  ),

  // Offers / Coupons
  offers: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="30" y="20" width="140" height="100" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1.5" />
      <text x="100" y="45" textAnchor="middle" fontSize="22" style={animate ? { animation: "bounce 1s ease infinite" } : {}}>🔥</text>
      <text x="100" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#dc2626">-30% OFF</text>
      <text x="100" y="80" textAnchor="middle" fontSize="8" fill="#6b7280">Producto Increíble</text>
      <text x="75" y="98" textAnchor="middle" fontSize="9" fill="#9ca3af" textDecoration="line-through">S/ 149.90</text>
      <text x="125" y="98" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#22c55e">S/ 104.93</text>
      <rect x="60" y="105" width="80" height="14" rx="7" fill="#22c55e" />
      <text x="100" y="115" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">¡Comprar ahora!</text>
    </svg>
  ),

  // Notifications
  notifications: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="50" y="15" width="100" height="110" rx="12" fill="#1f2937" />
      <rect x="58" y="30" width="84" height="20" rx="6" fill="#374151" />
      <circle cx="70" cy="40" r="6" fill="#22c55e" />
      <text x="82" y="38" fontSize="6" fill="white">Nuevo pedido</text>
      <text x="82" y="46" fontSize="5" fill="#9ca3af">Hace 2 min</text>
      <rect x="58" y="55" width="84" height="20" rx="6" fill="#374151" />
      <circle cx="70" cy="65" r="6" fill="#f59e0b" />
      <text x="82" y="63" fontSize="6" fill="white">Oferta especial</text>
      <text x="82" y="71" fontSize="5" fill="#9ca3af">Hace 1 hora</text>
      {animate && (
        <g>
          <circle cx="145" cy="30" r="8" fill="#ef4444" style={{ animation: "pulse 1s ease infinite" }}>
            <animate attributeName="r" values="7;9;7" dur="1s" repeatCount="indefinite" />
          </circle>
          <text x="145" y="33" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">3</text>
        </g>
      )}
    </svg>
  ),

  // Profile / Account
  profile: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <circle cx="100" cy="45" r="25" fill="#e5e7eb" />
      <text x="100" y="52" textAnchor="middle" fontSize="20">👤</text>
      <text x="100" y="85" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1f2937">Mi Cuenta</text>
      <rect x="50" y="95" width="100" height="8" rx="4" fill="#f3f4f6" />
      <rect x="50" y="108" width="70" height="8" rx="4" fill="#f3f4f6" />
      {animate && (
        <circle cx="100" cy="45" r="28" fill="none" stroke="#22c55e" strokeWidth="2" style={{ animation: "pulse 1.5s ease infinite" }}>
          <animate attributeName="r" values="28;35;28" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  ),

  // Orders
  orders: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {[
        { status: "Pendiente", color: "#f59e0b", icon: "⏳", y: 20 },
        { status: "Procesando", color: "#3b82f6", icon: "📦", y: 50 },
        { status: "Enviado", color: "#8b5cf6", icon: "🚚", y: 80 },
      ].map((o, i) => (
        <g key={i}>
          <rect x="30" y={o.y} width="140" height="24" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" />
          <circle cx="48" cy={o.y + 12} r="8" fill={o.color} opacity={animate ? 1 : 0.5} style={animate ? { animation: `pulse 1.5s ease ${i * 0.3}s infinite` } : {}} />
          <text x="48" y={o.y + 16} textAnchor="middle" fontSize="10">{o.icon}</text>
          <text x="65" y={o.y + 16} fontSize="8" fontWeight="bold" fill="#374151">{o.status}</text>
          <text x="160" y={o.y + 16} textAnchor="end" fontSize="7" fill="#6b7280">Pedido #{1000 + i}</text>
        </g>
      ))}
    </svg>
  ),

  // Upgrade
  upgrade: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="30" y="15" width="140" height="110" rx="10" fill="white" stroke="#fbbf24" strokeWidth="2" />
      <text x="100" y="38" textAnchor="middle" fontSize="14" style={animate ? { animation: "bounce 1s ease infinite" } : {}}>⬆️</text>
      <text x="100" y="55" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1f2937">Plan Full</text>
      <text x="100" y="70" textAnchor="middle" fontSize="9" fill="#22c55e">S/ 199/año</text>
      {["🐾 Mascotas premium", "📊 Estadísticas", "🎨 Paletas premium", "💬 Chat ilimitado"].map((f, i) => (
        <text key={i} x="60" y={85 + i * 10} fontSize="7" fill="#374151">✅ {f}</text>
      ))}
      {animate && (
        <rect x="60" y="118" width="80" height="14" rx="7" fill="#22c55e" style={{ animation: "pulse 1.5s ease infinite" }}>
          <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />
        </rect>
      )}
    </svg>
  ),

  // Categories browsing
  categories: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {[
        { emoji: "🍳", label: "Cocina", color: "#fef3c7", y: 15 },
        { emoji: "🛋️", label: "Hogar", color: "#dbeafe", y: 15 },
        { emoji: "💡", label: "Iluminación", color: "#fce7f3", y: 15 },
      ].map((c, i) => (
        <g key={i}>
          <rect x={30 + i * 55} y={c.y} width="45" height="50" rx="8" fill={c.color} stroke={animate ? "#22c55e" : "#e5e7eb"} strokeWidth={animate ? "2" : "1"} style={animate ? { animation: `fadeSlideUp ${0.8 + i * 0.2}s ease infinite` } : {}} />
          <text x={52 + i * 55} y={40} textAnchor="middle" fontSize="16">{c.emoji}</text>
          <text x={52 + i * 55} y={55} textAnchor="middle" fontSize="6" fill="#374151">{c.label}</text>
        </g>
      ))}
      <text x="100" y="85" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1f2937">Explora categorías</text>
      <text x="100" y="100" textAnchor="middle" fontSize="7" fill="#6b7280">Encuentra lo que buscas</text>
    </svg>
  ),

  // Accessibility / Responsive
  responsive: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="25" y="25" width="60" height="90" rx="8" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
      <rect x="30" y="35" width="50" height="65" rx="4" fill="white" />
      <text x="55" y="70" textAnchor="middle" fontSize="16">📱</text>
      <rect x="100" y="30" width="80" height="60" rx="6" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
      <rect x="105" y="38" width="70" height="44" rx="3" fill="white" />
      <text x="140" y="62" textAnchor="middle" fontSize="16">💻</text>
      {animate && (
        <g style={{ animation: "pulse 1.5s ease infinite" }}>
          <line x1="85" y1="70" x2="100" y2="60" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
          <text x="92" y="72" fontSize="8" fill="#22c55e">↔</text>
        </g>
      )}
      <text x="100" y="115" textAnchor="middle" fontSize="8" fill="#6b7280">Se adapta a cualquier pantalla</text>
    </svg>
  ),

  // Search bar
  searchbar: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      <rect x="20" y="40" width="160" height="35" rx="17" fill="white" stroke={animate ? "#22c55e" : "#d1d5db"} strokeWidth={animate ? "2" : "1.5"} style={{ transition: "all 0.5s ease" }} />
      <circle cx="48" cy="57" r="10" fill="#f3f4f6" />
      <text x="48" y="61" textAnchor="middle" fontSize="10" fill="#9ca3af">🔍</text>
      {animate ? (
        <g>
          <text x="65" y="61" fontSize="9" fill="#22c55e" style={{ animation: "blink 1s step-end infinite" }}>cocina|</text>
        </g>
      ) : (
        <text x="65" y="61" fontSize="9" fill="#9ca3af">Buscar productos...</text>
      )}
      <text x="100" y="100" textAnchor="middle" fontSize="8" fill="#6b7280">Escribe lo que buscas</text>
      <text x="100" y="118" textAnchor="middle" fontSize="8" fill="#22c55e">Enter para buscar 🔍</text>
    </svg>
  ),

  // Scroll / Browse
  scroll: ({ animate }) => (
    <svg viewBox="0 0 200 140" className="w-full h-full">
      {[0, 1, 2].map((i) => (
        <g key={i} style={animate ? { animation: `fadeSlideUp ${1 + i * 0.3}s ease infinite` } : {}}>
          <rect x={25 + i * 60} y="20" width="50" height="65" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" />
          <rect x={30 + i * 60} y="25" width="40" height="30" rx="3" fill="#f0fdf4" />
          <text x={50 + i * 60} y="45" textAnchor="middle" fontSize="12">📦</text>
          <text x={50 + i * 60} y="65" textAnchor="middle" fontSize="6" fill="#374151">Producto</text>
          <text x={50 + i * 60} y="78" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#22c55e">S/ 49</text>
        </g>
      ))}
      {animate && (
        <g>
          <text x="100" y="110" textAnchor="middle" fontSize="20" style={{ animation: "bounce 1s ease infinite" }}>👇</text>
          <text x="100" y="130" textAnchor="middle" fontSize="7" fill="#6b7280">Desliza para ver más</text>
        </g>
      )}
    </svg>
  ),
};

// Animation keyframes injected once
const STYLE_ID = "step-illustration-styles";
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes fadeSlideUp {
      0%, 100% { opacity: 0.4; transform: translateY(8px); }
      50% { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes dashMove {
      to { stroke-dashoffset: -24; }
    }
  `;
  document.head.appendChild(style);
}

export default function StepIllustration({ type, animate = true, className = "" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { ensureStyles(); setMounted(true); }, []);

  const Illustration = ILLUSTRATIONS[type];
  if (!Illustration) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 flex items-center justify-center ${className}`}>
      {mounted ? <Illustration animate={animate} /> : (
        <div className="w-full h-full flex items-center justify-center text-2xl">✨</div>
      )}
    </div>
  );
}

export const ILLUSTRATION_TYPES = Object.keys(ILLUSTRATIONS);
