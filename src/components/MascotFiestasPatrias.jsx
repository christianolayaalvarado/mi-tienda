"use client";

import React from "react";

export default function MascotFiestasPatrias({ size = 96, show = true }) {
  if (!show) return null;

  const scale = size / 96;
  const escSize = Math.round(32 * scale);
  const sashW = Math.round(100 * scale);
  const sashH = Math.round(14 * scale);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
      {/* Escarapela - esquina superior derecha de la mascota */}
      <div
        className="absolute"
        style={{
          top: `${Math.round(-4 * scale)}px`,
          right: `${Math.round(-2 * scale)}px`,
          width: `${escSize}px`,
          height: `${escSize}px`,
          filter: `drop-shadow(0 ${Math.round(2 * scale)}px ${Math.round(4 * scale)}px rgba(0,0,0,0.3))`,
        }}
      >
        <img
          src="/escarapela.png"
          alt="Escarapela"
          width={escSize}
          height={escSize}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* Banda presidencial - diagonal de arriba-izquierda a abajo-derecha */}
      <svg
        className="absolute"
        style={{
          top: `${Math.round(18 * scale)}px`,
          left: `${Math.round(-6 * scale)}px`,
          width: `${sashW}px`,
          height: `${Math.round(70 * scale)}px`,
          overflow: "visible",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 70"
      >
        <defs>
          <linearGradient id="sashGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#C8102E" />
            <stop offset="33%" stopColor="#C8102E" />
            <stop offset="33%" stopColor="#fff" />
            <stop offset="66%" stopColor="#fff" />
            <stop offset="66%" stopColor="#C8102E" />
            <stop offset="100%" stopColor="#C8102E" />
          </linearGradient>
        </defs>
        {/* Banda diagonal */}
        <path
          d="M10,0 L90,0 L100,70 L0,70 Z"
          fill="url(#sashGrad)"
          stroke="#8B0000"
          strokeWidth="1.5"
        />
        {/* Borde dorado superior */}
        <line x1="10" y1="0" x2="90" y2="0" stroke="#D4AF37" strokeWidth="2" />
        {/* Borde dorado inferior */}
        <line x1="0" y1="70" x2="100" y2="70" stroke="#D4AF37" strokeWidth="2" />
      </svg>
    </div>
  );
}
