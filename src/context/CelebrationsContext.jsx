"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CELEBRATIONS, CELEBRATION_LIST } from "@/lib/celebrations";

const CelebrationsContext = createContext(null);

function getStoredImages() {
  try { return JSON.parse(localStorage.getItem("celebrationImages") || "{}"); }
  catch { return {}; }
}

function mergeCelebration(celebration, storedImages) {
  const custom = storedImages[celebration.id];
  if (!custom) return celebration;
  return { ...celebration, ...custom };
}

export function CelebrationsProvider({ children }) {
  const [activeId, setActiveId] = useState(null);
  const [customImages, setCustomImages] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCustomImages(getStoredImages());
    fetch("/api/celebrations")
      .then(r => r.json())
      .then(data => {
        if (data.activeId && CELEBRATIONS[data.activeId]) {
          setActiveId(data.activeId);
        } else {
          setActiveId(null);
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem("activeCelebration");
          if (stored && CELEBRATIONS[stored]) {
            setActiveId(stored);
          }
        } catch {}
      });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = (e) => {
      if (e.key === "activeCelebration") {
        setActiveId(e.newValue && CELEBRATIONS[e.newValue] ? e.newValue : null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [mounted]);

  useEffect(() => {
    const handler = () => setCustomImages(getStoredImages());
    window.addEventListener("celebrationImagesUpdated", handler);
    return () => window.removeEventListener("celebrationImagesUpdated", handler);
  }, []);

  const activate = useCallback((celebrationId) => {
    setActiveId(celebrationId);
    try {
      if (celebrationId) {
        localStorage.setItem("activeCelebration", celebrationId);
      } else {
        localStorage.removeItem("activeCelebration");
      }
    } catch {}
    fetch("/api/celebrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ activeId: celebrationId || null }),
    }).catch(() => {});
    try { window.dispatchEvent(new Event("storage")); } catch {}
  }, []);

  const active = activeId && CELEBRATIONS[activeId]
    ? mergeCelebration(CELEBRATIONS[activeId], customImages)
    : null;

  const celebrations = CELEBRATION_LIST.map((c) => mergeCelebration(c, customImages));

  return (
    <CelebrationsContext.Provider value={{ active, activeId, activate, celebrations, mounted }}>
      {children}
    </CelebrationsContext.Provider>
  );
}

export function useCelebrations() {
  const ctx = useContext(CelebrationsContext);
  if (!ctx) return { active: null, activeId: null, activate: () => {}, celebrations: CELEBRATION_LIST, mounted: false };
  return ctx;
}
