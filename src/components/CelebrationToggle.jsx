"use client";

import { useState } from "react";
import { useCelebrations } from "@/context/CelebrationsContext";
import { isCelebrationInSeason } from "@/lib/celebrations";
import { useAuthContext } from "@/context/AuthProvider";
import toast from "react-hot-toast";

export default function CelebrationToggle() {
  const { active, activate, celebrations } = useCelebrations();
  const { user } = useAuthContext() || {};
  const [expanded, setExpanded] = useState(false);

  const isAdmin = user?.role === "admin" || user?.email === "admin@demo.com";
  if (!isAdmin) return null;

  const handleToggle = (celebrationId) => {
    if (active?.id === celebrationId) {
      activate(null);
      toast.success("Celebración desactivada");
    } else {
      activate(celebrationId);
      toast.success(`¡${celebrations.find(c => c.id === celebrationId)?.name || "Celebración"} activada!`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">Celebraciones Temporales</p>
            <p className="text-xs text-gray-500">
              {active ? `${active.emoji} ${active.name} activa` : "Ninguna activa"}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <p className="text-xs text-gray-500 mb-3">
            Activa una celebración para mostrar imágenes temáticas en cards, banner y mascota.
          </p>
          {celebrations.map((c) => {
            const isActive = active?.id === c.id;
            const inSeason = isCelebrationInSeason(c);
            const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
            const dateRange = `${months[c.dateStart.month]} ${c.dateStart.day} - ${months[c.dateEnd.month]} ${c.dateEnd.day}`;

            return (
              <button
                key={c.id}
                onClick={() => handleToggle(c.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                  ${isActive
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
              >
                <img src={c.cardImage} alt={c.name} className="w-10 h-10 object-contain" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-gray-900">{c.name}</p>
                    {inSeason && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                        En temporada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{dateRange}</p>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center transition-colors ${isActive ? "bg-green-500 justify-end" : "bg-gray-300 justify-start"}`}>
                  <div className="w-5 h-5 bg-white rounded-full shadow mx-0.5" />
                </div>
              </button>
            );
          })}

          {active && (
            <button
              onClick={() => { activate(null); toast.success("Celebración desactivada"); }}
              className="w-full py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Desactivar celebración
            </button>
          )}
        </div>
      )}
    </div>
  );
}
