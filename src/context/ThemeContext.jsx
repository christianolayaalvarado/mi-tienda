"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import {
  BUILTIN_PALETTES,
  PREMIUM_PALETTES,
  paletteToCSSVars,
  shouldInvertLogo,
} from "@/lib/palettes";

const ThemeContext = createContext({
  theme: "default",
  selectedPalette: "builtin-default",
  customPalettes: [],
  unlockedPremium: [],
  totalSales: 0,
  setTheme: () => {},
  setSelectedPalette: () => {},
  saveCustomPalette: () => {},
  deleteCustomPalette: () => {},
  getAllPalettes: () => [],
  getActiveColors: () => [],
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("default");
  const [selectedPalette, setSelectedPaletteState] = useState("builtin-default");
  const [customPalettes, setCustomPalettes] = useState([]);
  const [unlockedPremium, setUnlockedPremium] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Cargar preferencias del servidor
  useEffect(() => {
    fetch("/api/user-profile/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.theme) setThemeState(d.theme);
        if (d.selectedPalette) setSelectedPaletteState(d.selectedPalette);
        if (Array.isArray(d.customPalettes)) setCustomPalettes(d.customPalettes);
        if (Array.isArray(d.unlockedPremium)) setUnlockedPremium(d.unlockedPremium);
        if (typeof d.totalSales === "number") setTotalSales(d.totalSales);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Aplicar paleta al DOM cuando cambie
  useEffect(() => {
    if (!loaded) return;

    const root = document.documentElement;
    root.removeAttribute("data-color-theme");
    root.removeAttribute("data-theme");

    // Encontrar la paleta activa
    const active = findPalette(selectedPalette, customPalettes);

    if (active) {
      const vars = paletteToCSSVars(active.colors);
      Object.entries(vars).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });

      // Logo invert si fondo oscuro
      if (shouldInvertLogo(active.colors)) {
        root.style.setProperty("--logo-filter", "brightness(0) invert(1)");
      } else {
        root.style.setProperty("--logo-filter", "none");
      }
    }

    // Legacy: dark theme
    if (selectedPalette === "builtin-dark" || theme === "dark") {
      root.setAttribute("data-theme", "dark");
    }
  }, [selectedPalette, customPalettes, loaded, theme]);

  // Guardar tema legacy
  const setTheme = useCallback((t) => {
    setThemeState(t);
    persist({ theme: t });
  }, []);

  // Seleccionar paleta
  const setSelectedPalette = useCallback((paletteId) => {
    setSelectedPaletteState(paletteId);
    persist({ selectedPalette: paletteId });
  }, []);

  // Guardar paleta custom
  const saveCustomPalette = useCallback((palette) => {
    setCustomPalettes((prev) => {
      const exists = prev.findIndex((p) => p.id === palette.id);
      const next = exists >= 0 ? [...prev] : [...prev];
      if (exists >= 0) {
        next[exists] = palette;
      } else {
        next.push(palette);
      }
      persist({ customPalettes: next });
      return next;
    });
  }, []);

  // Eliminar paleta custom
  const deleteCustomPalette = useCallback((paletteId) => {
    setCustomPalettes((prev) => {
      const next = prev.filter((p) => p.id !== paletteId);
      persist({ customPalettes: next });
      // Si estaba seleccionada, volver a default
      setSelectedPaletteState((curr) => {
        if (curr === paletteId) {
          persist({ selectedPalette: "builtin-default" });
          return "builtin-default";
        }
        return curr;
      });
      return next;
    });
  }, []);

  // Todas las paletas disponibles
  const getAllPalettes = useCallback(() => {
    const premium = PREMIUM_PALETTES.map((p) => ({
      ...p,
      unlocked: unlockedPremium.includes(p.id),
      premium: true,
    }));
    return [
      ...BUILTIN_PALETTES.map((p) => ({ ...p, builtin: true })),
      ...customPalettes.map((p) => ({ ...p, custom: true })),
      ...premium,
    ];
  }, [customPalettes, unlockedPremium]);

  // Colores de la paleta activa
  const getActiveColors = useCallback(() => {
    const active = findPalette(selectedPalette, customPalettes);
    return active?.colors || BUILTIN_PALETTES[0].colors;
  }, [selectedPalette, customPalettes]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        selectedPalette,
        customPalettes,
        unlockedPremium,
        totalSales,
        setTheme,
        setSelectedPalette,
        saveCustomPalette,
        deleteCustomPalette,
        getAllPalettes,
        getActiveColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/* ── Helpers internos ─────────────────────────────────────────────── */

function findPalette(id, customPalettes) {
  if (!id) return BUILTIN_PALETTES[0];

  const builtin = BUILTIN_PALETTES.find((p) => p.id === id);
  if (builtin) return builtin;

  const custom = customPalettes.find((p) => p.id === id);
  if (custom) return custom;

  const premium = PREMIUM_PALETTES.find((p) => p.id === id);
  if (premium) return premium;

  return BUILTIN_PALETTES[0];
}

function persist(data) {
  fetch("/api/user-profile/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  }).catch(() => {});
}
