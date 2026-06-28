"use client";

import { useState, useEffect, useRef } from "react";
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
  const [customNames, setCustomNames] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [achRes, namesRes] = await Promise.all([
          fetch("/api/achievements"),
          fetch("/api/user/mascot-names"),
        ]);
        if (achRes.ok) {
          const data = await achRes.json();
          setSelected(data.selectedMascot || "box");
          setUnlockedIds(data.unlockedMascots || ["box"]);
          setAchievements(data.achievements || []);
        }
        if (namesRes.ok) {
          const data = await namesRes.json();
          setCustomNames(data.names || {});
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

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

  const startEditing = (mascotId, currentName, e) => {
    e.stopPropagation();
    setEditingId(mascotId);
    setEditValue(currentName);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveName = async (mascotId) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }
    try {
      const res = await fetch("/api/user/mascot-names", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mascotId, name: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomNames(data.names);
        toast.success("Nombre actualizado");
      } else {
        toast.error("Error al guardar nombre");
      }
    } catch {
      toast.error("Error de conexión");
    }
    setEditingId(null);
    setEditValue("");
  };

  const getDisplayName = (mascot) => {
    return customNames[mascot.id] || mascot.name;
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
          Selecciona tu mascota favorita. Desbloquea nuevas al alcanzar logros. Haz clic en el nombre para personalizarlo.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {MASCOT_LIST.map((mascot) => {
          const isUnlocked = unlockedIds.includes(mascot.id);
          const isSelected = selected === mascot.id;
          const isHovered = hoveredId === mascot.id;
          const displayName = getDisplayName(mascot);
          const isEditing = editingId === mascot.id;

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
                  view="front"
                />
              </div>

              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName(mascot.id);
                      if (e.key === "Escape") cancelEditing();
                    }}
                    onBlur={() => saveName(mascot.id)}
                    maxLength={30}
                    className="w-full text-sm text-center border border-green-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              ) : (
                <h3 className="font-semibold text-gray-900 text-sm flex items-center justify-center gap-1 group/name">
                  <span className="truncate">{displayName}</span>
                  {isUnlocked && (
                    <button
                      onClick={(e) => startEditing(mascot.id, displayName, e)}
                      className="opacity-0 group-hover/name:opacity-100 transition-opacity text-gray-400 hover:text-green-600 flex-shrink-0"
                      title="Editar nombre"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </h3>
              )}

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
