"use client";

import React from "react";

export default function MascotFiestasPatrias({ size = 96, show = true, image = "/escarapela.png" }) {
  if (!show) return null;

  const scale = size / 96;
  const imgSize = Math.round(32 * scale);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
      {/* Imagen de celebración */}
      <div
        className="absolute"
        style={{
          top: `${Math.round(28 * scale)}px`,
          right: `${Math.round(-4 * scale)}px`,
          width: `${imgSize}px`,
          height: `${imgSize}px`,
          filter: `drop-shadow(0 ${Math.round(2 * scale)}px ${Math.round(4 * scale)}px rgba(0,0,0,0.3))`,
        }}
      >
        <img
          src={image}
          alt="Celebración"
          width={imgSize}
          height={imgSize}
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
    </div>
  );
}
