"use client";

import { useState, useEffect } from "react";
import MascotAvatar from "@/components/MascotAvatar";
import { MASCOT_LIST, ACHIEVEMENT_DEFINITIONS } from "@/lib/mascotCatalog";
import toast from "react-hot-toast";

export default function MascotGallery() {
  const [selected, setSelected] = useState("box");
  const [unlockedIds, setUnlockedIds] = useState(["box"]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/achievements");
        if (res.ok) {
          const data = await res.json();
          setSelected(data.selectedMascot || "box");
          setUnlockedIds(data.unlockedMascots || ["box"]);
          setAchievements(data.achievements || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = async (mascotId) => {
    if (!unlockedIds.includes(mascotId)) return;
    if (mascotId === selected) return;

    setSaving(true);
    try {
      const res = await fetch("/api/user/mascot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mascotId }),
      });
      if (res.ok) {
        setSelected(mascotId);
        toast.success("Mascota cambiada");
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al cambiar mascota");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl border p-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Galería de Mascotas</h2>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona tu mascota favorita. Desbloquea nuevas al alcanzar logros.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MASCOT_LIST.map((mascot) => {
          const isUnlocked = unlockedIds.includes(mascot.id);
          const isSelected = selected === mascot.id;
          const isHovered = hoveredId === mascot.id;

          return (
            <button
              key={mascot.id}
              onClick={() => handleSelect(mascot.id)}
              onMouseEnter={() => setHoveredId(mascot.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={!isUnlocked || saving}
              className={`relative bg-white rounded-xl border-2 p-4 transition-all duration-200 text-center
                ${isSelected ? "border-green-500 ring-2 ring-green-200 shadow-md" : "border-gray-200 hover:border-gray-300"}
                ${!isUnlocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:shadow-md"}
                ${saving && isSelected ? "animate-pulse" : ""}
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Activa
                  </span>
                </div>
              )}

              {!isUnlocked && (
                <div className="absolute top-2 right-2">
                  <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    🔒
                  </span>
                </div>
              )}

              <div className={`flex justify-center mb-3 ${!isUnlocked ? "grayscale" : ""}`}>
                <MascotAvatar
                  type={mascot.id}
                  size={72}
                  animate={isUnlocked && (isHovered || isSelected)}
                />
              </div>

              <h3 className="font-semibold text-gray-900 text-sm">{mascot.name}</h3>

              {!isUnlocked ? (
                <p className="text-xs text-gray-500 mt-1 leading-tight">
                  {mascot.unlockLabel}
                </p>
              ) : (
                <p className="text-xs text-green-600 mt-1">
                  {isSelected ? "Seleccionada" : "Desbloqueada"}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {achievements.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Tus Logros</h3>
          <div className="space-y-2">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 bg-white border rounded-lg p-3">
                <span className="text-2xl">{a.definition?.icon || "🏅"}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{a.definition?.title || a.type}</p>
                  <p className="text-xs text-gray-500">{a.definition?.description}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(a.unlockedAt).toLocaleDateString("es-PE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
