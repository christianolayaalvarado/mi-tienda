"use client";

import { useState, useRef, useEffect } from "react";
import { useCelebrations } from "@/context/CelebrationsContext";
import { useAuthContext } from "@/context/AuthProvider";
import toast from "react-hot-toast";

const IMAGE_SLOTS = [
  { key: "cardImage", label: "Imagen del Card", hint: "60×60px, fondo transparente", size: "w-12 h-12" },
  { key: "mascotImage", label: "Imagen de la Mascota", hint: "80×80px, fondo transparente", size: "w-16 h-16" },
  { key: "bannerImage", label: "Imagen del Banner", hint: "80×80px, fondo transparente", size: "w-16 h-16" },
];

function getStoredImages() {
  try {
    return JSON.parse(localStorage.getItem("celebrationImages") || "{}");
  } catch { return {}; }
}

function setStoredImages(images) {
  localStorage.setItem("celebrationImages", JSON.stringify(images));
}

export default function CelebrationImageManager() {
  const { celebrations, active } = useCelebrations();
  const { user } = useAuthContext() || {};
  const [storedImages, setStoredImagesState] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(null);
  const fileRefs = useRef({});

  const isAdmin = user?.role === "admin" || user?.email === "admin@demo.com";

  useEffect(() => {
    setStoredImagesState(getStoredImages());
  }, []);

  if (!isAdmin) return null;

  const handleUpload = async (celebrationId, slotKey, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 2MB");
      return;
    }

    setUploading(`${celebrationId}-${slotKey}`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "mi_tienda_unsigned");
      formData.append("folder", "mi_tienda/celebrations");

      const res = await fetch("https://api.cloudinary.com/v1_1/dqx8wx5fj/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir");
      const data = await res.json();
      const url = data.secure_url;

      const newStored = { ...getStoredImages() };
      if (!newStored[celebrationId]) newStored[celebrationId] = {};
      newStored[celebrationId][slotKey] = url;
      setStoredImages(newStored);
      setStoredImagesState(newStored);
      toast.success("Imagen actualizada");
      try { window.dispatchEvent(new Event("celebrationImagesUpdated")); } catch {}
    } catch (err) {
      toast.error("Error al subir imagen");
    } finally {
      setUploading(null);
    }
  };

  const handleReset = (celebrationId, slotKey) => {
    const newStored = { ...getStoredImages() };
    if (newStored[celebrationId]) {
      delete newStored[celebrationId][slotKey];
      if (Object.keys(newStored[celebrationId]).length === 0) {
        delete newStored[celebrationId];
      }
    }
    setStoredImages(newStored);
    setStoredImagesState(newStored);
    toast.success("Imagen restaurada por defecto");
    try { window.dispatchEvent(new Event("celebrationImagesUpdated")); } catch {}
  };

  const getImage = (celebration, slotKey) => {
    return storedImages[celebration.id]?.[slotKey] || celebration[slotKey];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🖼️</span>
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">Imágenes de Celebración</p>
            <p className="text-xs text-gray-500">Cambia las imágenes de cards, mascota y banner</p>
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
        <div className="border-t border-gray-100 p-4 space-y-4">
          {celebrations.map((c) => (
            <div key={c.id} className={`rounded-xl border p-4 space-y-3 ${active?.id === c.id ? "border-green-300 bg-green-50/50" : "border-gray-200"}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.emoji}</span>
                <p className="font-medium text-sm text-gray-900">{c.name}</p>
                {active?.id === c.id && (
                  <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">Activa</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {IMAGE_SLOTS.map((slot) => {
                  const currentImage = getImage(c, slot.key);
                  const isDefault = !storedImages[c.id]?.[slot.key];
                  const isUploading = uploading === `${c.id}-${slot.key}`;

                  return (
                    <div key={slot.key} className="space-y-1">
                      <p className="text-[10px] font-medium text-gray-500 uppercase">{slot.label}</p>
                      <div className="relative group">
                        <div className={`${slot.size} rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50`}>
                          {isUploading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full" />
                          ) : (
                            <img src={currentImage} alt="" className="w-full h-full object-contain" />
                          )}
                        </div>

                        <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            onClick={() => fileRefs.current[`${c.id}-${slot.key}`]?.click()}
                            className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded shadow hover:bg-gray-100"
                          >
                            Subir
                          </button>
                          {!isDefault && (
                            <button
                              onClick={() => handleReset(c.id, slot.key)}
                              className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow hover:bg-red-600"
                            >
                              Restaurar
                            </button>
                          )}
                        </div>

                        <input
                          ref={(el) => { fileRefs.current[`${c.id}-${slot.key}`] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUpload(c.id, slot.key, e.target.files?.[0])}
                        />
                      </div>
                      <p className="text-[9px] text-gray-400">{slot.hint}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
