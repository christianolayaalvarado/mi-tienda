// src/components/ThemeInitializer.jsx
"use client";
import { useEffect } from "react";
import { BUILTIN_PALETTES, PREMIUM_PALETTES, paletteToCSSVars, shouldInvertLogo } from "@/lib/palettes";

/**
 * Aplica la paleta del usuario lo más rápido posible para evitar FOUC.
 * ThemeContext se encarga del reste; este componente solo aplica el splash inicial.
 */
export default function ThemeInitializer() {
  useEffect(() => {
    fetch("/api/user/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const paletteId = d.selectedPalette || "builtin-default";
        const customPalettes = Array.isArray(d.customPalettes) ? d.customPalettes : [];

        // Buscar paleta activa
        const all = [
          ...BUILTIN_PALETTES,
          ...customPalettes,
          ...PREMIUM_PALETTES,
        ];
        const active = all.find((p) => p.id === paletteId) || BUILTIN_PALETTES[0];

        const root = document.documentElement;
        root.removeAttribute("data-color-theme");
        root.removeAttribute("data-theme");

        // Aplicar variables CSS
        const vars = paletteToCSSVars(active.colors);
        Object.entries(vars).forEach(([key, val]) => {
          root.style.setProperty(key, val);
        });

        if (shouldInvertLogo(active.colors)) {
          root.style.setProperty("--logo-filter", "brightness(0) invert(1)");
        }

        if (paletteId === "builtin-dark" || d.theme === "dark") {
          root.setAttribute("data-theme", "dark");
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
