"use client";

import { useState, useRef, useCallback } from "react";

const SEGMENTS = [
  { label: "5%", color: "#22c55e", textColor: "#fff" },
  { label: "10%", color: "#3b82f6", textColor: "#fff" },
  { label: "15%", color: "#f59e0b", textColor: "#fff" },
  { label: "S/5", color: "#8b5cf6", textColor: "#fff" },
  { label: "20%", color: "#ef4444", textColor: "#fff" },
  { label: "Envio", color: "#06b6d4", textColor: "#fff" },
  { label: "10%", color: "#3b82f6", textColor: "#fff" },
  { label: "S/10", color: "#f97316", textColor: "#fff" },
  { label: "30%", color: "#dc2626", textColor: "#fff" },
  { label: "S/20", color: "#7c3aed", textColor: "#fff" },
  { label: "20%", color: "#ef4444", textColor: "#fff" },
  { label: "5%", color: "#22c55e", textColor: "#fff" },
];

export default function SpinWheel({ onSpinResult, spinning: externalSpinning, canSpin }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const wheelRef = useRef(null);

  const spin = useCallback(() => {
    if (spinning || externalSpinning || !canSpin) return;
    setSpinning(true);

    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segmentAngle = 360 / SEGMENTS.length;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
    const totalRotation = rotation + extraSpins * 360 + targetAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      const prize = SEGMENTS[targetIndex];
      onSpinResult?.({
        type: prize.label.includes("S/") ? "fixed_discount" : prize.label === "Envio" ? "free_shipping" : "percentage_discount",
        value: parseInt(prize.label) || 0,
        label: prize.label,
        segmentIndex: targetIndex,
      });
    }, 4000);
  }, [spinning, externalSpinning, canSpin, rotation, onSpinResult]);

  const segmentAngle = 360 / SEGMENTS.length;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 280, height: 280 }}>
        <div
          className="absolute inset-0 rounded-full border-4 border-yellow-400 shadow-xl overflow-hidden"
          style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none" }}
        >
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {SEGMENTS.map((seg, i) => {
              const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
              const x1 = 150 + 140 * Math.cos(startAngle);
              const y1 = 150 + 140 * Math.sin(startAngle);
              const x2 = 150 + 140 * Math.cos(endAngle);
              const y2 = 150 + 140 * Math.sin(endAngle);
              const largeArc = segmentAngle > 180 ? 1 : 0;
              const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
              const textX = 150 + 95 * Math.cos(midAngle);
              const textY = 150 + 95 * Math.sin(midAngle);
              const textRotation = (i + 0.5) * segmentAngle;

              return (
                <g key={i}>
                  <path
                    d={`M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={seg.color}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill={seg.textColor}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}
            <circle cx="150" cy="150" r="22" fill="#1f2937" />
            <circle cx="150" cy="150" r="16" fill="#374151" />
          </svg>
        </div>

        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "20px solid #fbbf24",
          }}
        />
      </div>

      <button
        onClick={spin}
        disabled={spinning || externalSpinning || !canSpin}
        className="mt-4 px-8 py-3 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-900 font-bold rounded-full text-lg shadow-lg transition-all hover:scale-105 disabled:scale-100"
      >
        {spinning || externalSpinning ? "Girando..." : canSpin ? "GIRAR" : "Vuelve manana"}
      </button>
    </div>
  );
}
