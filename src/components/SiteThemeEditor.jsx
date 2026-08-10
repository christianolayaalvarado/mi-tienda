"use client";

import { useState, useEffect, useCallback } from "react";
import { useSiteTheme } from "@/context/SiteThemeContext";

const SECTIONS = [
  {
    id: "featured",
    label: "Productos Destacados",
    icon: "⭐",
    fields: [
      { key: "featuredGradFrom", label: "Gradiente desde", type: "color" },
      { key: "featuredGradTo", label: "Gradiente hasta", type: "color" },
      { key: "featuredBannerIconBg", label: "Color del ícono", type: "color" },
      { key: "featuredBannerBorderColor", label: "Color del borde", type: "color" },
    ],
  },
  {
    id: "mascot",
    label: "Banner Mascota",
    icon: "🐾",
    fields: [
      { key: "mascotGradFrom", label: "Gradiente desde", type: "color" },
      { key: "mascotGradTo", label: "Gradiente hasta", type: "color" },
    ],
  },
  {
    id: "latest",
    label: "Nuevos Productos",
    icon: "🆕",
    fields: [
      { key: "latestGradFrom", label: "Gradiente desde", type: "color" },
      { key: "latestGradTo", label: "Gradiente hasta", type: "color" },
    ],
  },
  {
    id: "navbar",
    label: "Barra de navegación",
    icon: "📌",
    fields: [
      { key: "navbarBg", label: "Fondo navbar", type: "color" },
      { key: "navbarTextColor", label: "Texto navbar", type: "color" },
    ],
  },
  {
    id: "categories",
    label: "Barra de categorías",
    icon: "📂",
    fields: [
      { key: "categoryBarBg", label: "Fondo categorías", type: "color" },
      { key: "categoryBarActiveColor", label: "Categoría activa", type: "color" },
    ],
  },
  {
    id: "cards",
    label: "Tarjetas de productos",
    icon: "🃏",
    fields: [
      { key: "productCardBg", label: "Fondo tarjeta", type: "color" },
      { key: "productCardHoverShadow", label: "Sombra hover", type: "text" },
      { key: "priceColor", label: "Color precio", type: "color" },
      { key: "salePriceColor", label: "Color precio oferta", type: "color" },
    ],
  },
  {
    id: "buttons",
    label: "Botones",
    icon: "🔘",
    fields: [
      { key: "primaryBtnBg", label: "Botón primario", type: "color" },
      { key: "primaryBtnHover", label: "Hover primario", type: "color" },
      { key: "primaryBtnText", label: "Texto primario", type: "color" },
      { key: "secondaryBtnBg", label: "Botón secundario", type: "color" },
      { key: "secondaryBtnHover", label: "Hover secundario", type: "color" },
      { key: "secondaryBtnText", label: "Texto secundario", type: "color" },
      { key: "accentColor", label: "Acento / CTA", type: "color" },
      { key: "accentTextColor", label: "Texto acento", type: "color" },
    ],
  },
  {
    id: "body",
    label: "General",
    icon: "🎨",
    fields: [
      { key: "bodyBg", label: "Fondo general", type: "color" },
      { key: "bodyTextColor", label: "Texto general", type: "color" },
      { key: "cardBg", label: "Fondo tarjetas", type: "color" },
      { key: "cardBorderColor", label: "Borde tarjetas", type: "color" },
      { key: "borderRadius", label: "Radio bordes", type: "text" },
      { key: "borderRadiusLg", label: "Radio bordes grandes", type: "text" },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    icon: "🦶",
    fields: [
      { key: "footerBg", label: "Fondo footer", type: "color" },
      { key: "footerTextColor", label: "Texto footer", type: "color" },
      { key: "footerLinkColor", label: "Links footer", type: "color" },
    ],
  },
];

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700">{label}</div>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-xs px-2 py-1 border border-gray-200 rounded-lg mt-0.5 font-mono"
        />
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-700 mb-1">{label}</div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg font-mono"
      />
    </div>
  );
}

function GradientField({ labelFrom, labelTo, valueFrom, valueTo, onChangeFrom, onChangeTo }) {
  const from = valueFrom || "#10b981";
  const to = valueTo || "#06b6d4";
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-gray-700">{labelFrom || "Gradiente"}</div>
      <div className="flex items-center gap-2">
        <input type="color" value={from} onChange={(e) => onChangeFrom(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0" />
        <span className="text-xs text-gray-400">→</span>
        <input type="color" value={to} onChange={(e) => onChangeTo(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0" />
        <div className="flex-1 h-10 rounded-lg border border-gray-200" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
      </div>
    </div>
  );
}

export default function SiteThemeEditor() {
  const { refresh } = useSiteTheme();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("featured");

  useEffect(() => {
    fetch("/api/admin/site-theme", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.settings) setSettings(d.settings); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSaved(true);
        refresh();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Error saving theme:", err);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleReset = useCallback(() => {
    if (confirm("¿Restaurar colores por defecto?")) {
      setSettings({});
      setSaved(false);
    }
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Cargando...</div>;

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Apariencia del sitio</h2>
          <p className="text-sm text-gray-500">Personaliza colores de banners, fondos, botones y más</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
            Restaurar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${
              saved ? "bg-green-100 text-green-700" : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar"}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Section tabs */}
        <div className="w-40 shrink-0 space-y-1">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-all ${
                activeSection === sec.id
                  ? "bg-green-100 text-green-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{currentSection?.icon}</span>
            <span className="text-sm font-bold text-gray-800">{currentSection?.label}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentSection?.fields.map((field) => {
              const val = settings[field.key] || "";
              if (field.type === "gradient") {
                return null; // handled separately below
              }
              if (field.type === "color") {
                return <ColorField key={field.key} label={field.label} value={val} onChange={(v) => update(field.key, v)} />;
              }
              return <TextField key={field.key} label={field.label} value={val} onChange={(v) => update(field.key, v)} />;
            })}
          </div>

          {/* Gradient pairs for banner sections */}
          {currentSection?.id === "featured" && (
            <GradientField
              labelFrom="Desde"
              labelTo="Hasta"
              valueFrom={settings.featuredGradFrom}
              valueTo={settings.featuredGradTo}
              onChangeFrom={(v) => update("featuredGradFrom", v)}
              onChangeTo={(v) => update("featuredGradTo", v)}
            />
          )}
          {currentSection?.id === "mascot" && (
            <GradientField
              labelFrom="Desde"
              labelTo="Hasta"
              valueFrom={settings.mascotGradFrom}
              valueTo={settings.mascotGradTo}
              onChangeFrom={(v) => update("mascotGradFrom", v)}
              onChangeTo={(v) => update("mascotGradTo", v)}
            />
          )}
          {currentSection?.id === "latest" && (
            <GradientField
              labelFrom="Desde"
              labelTo="Hasta"
              valueFrom={settings.latestGradFrom}
              valueTo={settings.latestGradTo}
              onChangeFrom={(v) => update("latestGradFrom", v)}
              onChangeTo={(v) => update("latestGradTo", v)}
            />
          )}

          {/* Live preview */}
          <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="text-xs font-bold text-gray-500 mb-2">Vista previa</div>
            <div className="space-y-2">
              {/* Featured banner preview */}
              <div
                className="px-4 py-3 rounded-lg text-sm font-medium text-white"
                style={{ background: `linear-gradient(135deg, ${settings.featuredGradFrom || "#eff6ff"}, ${settings.featuredGradTo || "#eef2ff"})` }}
              >
                ⭐ Productos Destacados
              </div>
              {/* Mascot banner preview */}
              <div
                className="px-4 py-3 rounded-lg text-sm font-medium text-white"
                style={{ background: `linear-gradient(135deg, ${settings.mascotGradFrom || "#10b981"}, ${settings.mascotGradTo || "#06b6d4"})` }}
              >
                🐾 Banner Mascota
              </div>
              {/* Latest banner preview */}
              <div
                className="px-4 py-3 rounded-lg text-sm font-medium text-white"
                style={{ background: `linear-gradient(135deg, ${settings.latestGradFrom || "#0f172a"}, ${settings.latestGradTo || "#312e81"})` }}
              >
                🆕 Nuevos Productos
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-xs font-medium"
                  style={{ background: settings.primaryBtnBg, color: settings.primaryBtnText }}
                >
                  Botón primario
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-medium border"
                  style={{ background: settings.secondaryBtnBg, color: settings.secondaryBtnText, borderColor: settings.cardBorderColor }}
                >
                  Botón secundario
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-medium"
                  style={{ background: settings.accentColor, color: settings.accentTextColor }}
                >
                  Acento
                </button>
              </div>
              <div
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: settings.productCardBg, border: `1px solid ${settings.cardBorderColor}` }}
              >
                <span style={{ color: settings.priceColor, fontWeight: "bold" }}>S/ 99.90</span>
                <span className="ml-2" style={{ color: settings.salePriceColor, fontWeight: "bold" }}>S/ 49.90</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
