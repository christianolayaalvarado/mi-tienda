// src/components/ThemeInitializer.jsx
"use client";
import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    // Aplicar tema de colores del usuario al cargar
    fetch("/api/user/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.theme && d.theme !== "default") {
          const root = document.documentElement;
          root.removeAttribute("data-color-theme");
          root.removeAttribute("data-theme");
          
          if (d.theme !== "default") {
            root.setAttribute("data-color-theme", d.theme);
          }
          if (d.theme === "dark") {
            root.setAttribute("data-theme", "dark");
          }
        }
      })
      .catch(() => {});
  }, []);
  return null;
}
