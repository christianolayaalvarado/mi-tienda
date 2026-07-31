"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CELEBRATIONS, CELEBRATION_LIST, isCelebrationInSeason } from "@/lib/celebrations";

const CelebrationsContext = createContext(null);

export function CelebrationsProvider({ children }) {
  const [activeId, setActiveId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("activeCelebration");
      if (stored && CELEBRATIONS[stored]) {
        setActiveId(stored);
        return;
      }
    } catch {}
    for (const c of CELEBRATION_LIST) {
      if (isCelebrationInSeason(c)) {
        setActiveId(c.id);
        return;
      }
    }
    setActiveId(null);
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

  const activate = useCallback((celebrationId) => {
    setActiveId(celebrationId);
    try {
      if (celebrationId) {
        localStorage.setItem("activeCelebration", celebrationId);
      } else {
        localStorage.removeItem("activeCelebration");
      }
    } catch {}
    try { window.dispatchEvent(new Event("storage")); } catch {}
  }, []);

  const active = activeId && CELEBRATIONS[activeId] ? CELEBRATIONS[activeId] : null;

  return (
    <CelebrationsContext.Provider value={{ active, activeId, activate, celebrations: CELEBRATION_LIST, mounted }}>
      {children}
    </CelebrationsContext.Provider>
  );
}

export function useCelebrations() {
  const ctx = useContext(CelebrationsContext);
  if (!ctx) return { active: null, activeId: null, activate: () => {}, celebrations: CELEBRATION_LIST, mounted: false };
  return ctx;
}
