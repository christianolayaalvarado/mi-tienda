"use client";

import { useTheme } from "@/context/ThemeContext";

const THEMES = [
  { id: "default", label: "Predeterminado", colors: ["#FFFFFF", "#16a34a", "#171717"] },
  { id: "pastel", label: "Pasteles", colors: ["#fdf4ff", "#c084fc", "#581c87"] },
  { id: "grayscale", label: "Grises", colors: ["#fafafa", "#525252", "#171717"] },
  { id: "vibrant", label: "Encendidos", colors: ["#fffbeb", "#f43f5e", "#1c1917"] },
  { id: "dark", label: "Oscuro", colors: ["#0a0a0a", "#22c55e", "#f3f4f6"] },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-theme-primary">Tema de colores</h3>
      <p className="text-xs text-theme-secondary">Selecciona un tema para personalizar la apariencia</p>
      <div className="grid grid-cols-5 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
              theme === t.id
                ? "border-[var(--accent)] shadow-md scale-105"
                : "border-theme hover:scale-102"
            }`}
          >
            <div className="flex gap-0.5">
              {t.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-gray-300 shadow-inner"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-[10px] font-medium text-theme-secondary">{t.label}</span>
            {theme === t.id && (
              <span className="text-[8px] text-[var(--accent)] font-bold">ACTIVO</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
