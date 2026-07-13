"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  BUILTIN_PALETTES,
  PREMIUM_PALETTES,
  isValidHex,
  COLOR_ROLE_LABELS,
  COLOR_ROLE_DESCRIPTIONS,
  COLOR_ROLE_AFFECTS,
} from "@/lib/palettes";

const MAX_CUSTOM = 6;

export default function ThemeSelector() {
  const {
    selectedPalette,
    customPalettes,
    unlockedPremium,
    totalSales,
    setSelectedPalette,
    saveCustomPalette,
    deleteCustomPalette,
  } = useTheme();

  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColors, setEditColors] = useState(["", "", "", "", ""]);
  const [newPaletteMode, setNewPaletteMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const hexRefs = useRef([]);

  function openEdit(palette) {
    setEditing(palette.id);
    setEditName(palette.name);
    setEditColors([...palette.colors]);
    setNewPaletteMode(false);
  }

  function openNew() {
    const id = `custom-${Date.now()}`;
    setEditing(id);
    setEditName("Mi paleta");
    setEditColors(["#FFFFFF", "#F3F4F6", "#3B82F6", "#111827", "#6B7280"]);
    setNewPaletteMode(true);
  }

  function handleSave() {
    if (!editName.trim() || !editColors.every(isValidHex)) return;
    saveCustomPalette({ id: editing, name: editName.trim(), colors: [...editColors] });
    setEditing(null);
    setNewPaletteMode(false);
  }

  function handleCancel() {
    setEditing(null);
    setNewPaletteMode(false);
  }

  function handleDeleteConfirm() {
    if (confirmDelete) {
      deleteCustomPalette(confirmDelete);
      if (editing === confirmDelete) {
        setEditing(null);
        setNewPaletteMode(false);
      }
      setConfirmDelete(null);
    }
  }

  useEffect(() => {
    if (editing && hexRefs.current[0]) hexRefs.current[0].focus();
  }, [editing]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-theme-primary">Paleta de colores</h3>
        <p className="text-xs text-theme-secondary mt-0.5">
          Personaliza los 5 colores de tu tienda
        </p>
      </div>

      {/* ── Confirmar eliminación ──────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-xs w-full mx-4 space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Eliminar paleta</h4>
            <p className="text-xs text-gray-500">
              ¿Seguro que quieres eliminar esta paleta? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Editor de paleta ────────────────────────────────────────── */}
      {editing && (
        <div className="border-2 border-[var(--accent)] rounded-xl p-4 bg-[var(--bg-card)] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-theme-primary">
              {newPaletteMode ? "Nueva paleta" : "Editar paleta"}
            </h4>
            <button onClick={handleCancel} className="text-theme-secondary hover:text-theme-primary text-xs">
              ✕
            </button>
          </div>

          {/* Nombre */}
          <div>
            <label className="text-[10px] font-medium text-theme-secondary uppercase tracking-wide">
              Nombre
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={30}
              className="w-full mt-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--bg-card)] text-theme-primary outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Barra de preview */}
          <div className="flex h-8 rounded-lg overflow-hidden shadow-inner">
            {editColors.map((c, i) => (
              <div key={i} className="flex-1 transition-colors" style={{ backgroundColor: isValidHex(c) ? c : "#ccc" }} />
            ))}
          </div>

          {/* Mockup preview: simula navbar + card + sidebar */}
          <div className="rounded-lg overflow-hidden border border-gray-200 text-[9px]">
            {/* Navbar mockup */}
            <div className="flex items-center gap-2 px-2 py-1.5" style={{ backgroundColor: isValidHex(editColors[0]) ? editColors[0] : "#eee" }}>
              <div className="w-3 h-3 rounded" style={{ backgroundColor: isValidHex(editColors[2]) ? editColors[2] : "#ccc" }} />
              <span style={{ color: isValidHex(editColors[3]) ? editColors[3] : "#000" }} className="font-bold">Tienda</span>
              <div className="ml-auto flex gap-1">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: isValidHex(editColors[2]) ? editColors[2] : "#ccc" }} />
                <div className="w-4 h-2 rounded" style={{ backgroundColor: isValidHex(editColors[4]) ? editColors[4] : "#ccc" }} />
              </div>
            </div>
            <div className="flex">
              {/* Body */}
              <div className="flex-1 p-2 space-y-1.5" style={{ backgroundColor: isValidHex(editColors[0]) ? editColors[0] : "#eee" }}>
                {/* Card */}
                <div className="rounded p-1.5 space-y-1" style={{ backgroundColor: isValidHex(editColors[1]) ? editColors[1] : "#ddd" }}>
                  <div className="h-1.5 rounded w-3/4" style={{ backgroundColor: isValidHex(editColors[3]) ? editColors[3] : "#000" }} />
                  <div className="h-1 rounded w-1/2" style={{ backgroundColor: isValidHex(editColors[4]) ? editColors[4] : "#999" }} />
                  <div className="h-3 rounded w-full mt-1" style={{ backgroundColor: isValidHex(editColors[2]) ? editColors[2] : "#ccc" }} />
                </div>
                {/* Another card */}
                <div className="rounded p-1.5" style={{ backgroundColor: isValidHex(editColors[1]) ? editColors[1] : "#ddd" }}>
                  <div className="h-1.5 rounded w-2/3" style={{ backgroundColor: isValidHex(editColors[3]) ? editColors[3] : "#000" }} />
                  <div className="h-1 rounded w-full mt-1" style={{ backgroundColor: isValidHex(editColors[4]) ? editColors[4] : "#999" }} />
                </div>
              </div>
              {/* Sidebar */}
              <div className="w-12 p-1.5 space-y-1 border-l" style={{ backgroundColor: isValidHex(editColors[1]) ? editColors[1] : "#ddd", borderColor: isValidHex(editColors[4]) ? editColors[4] : "#ccc" }}>
                <div className="h-1 rounded w-full" style={{ backgroundColor: isValidHex(editColors[4]) ? editColors[4] : "#999" }} />
                <div className="h-1 rounded w-4/5" style={{ backgroundColor: isValidHex(editColors[2]) ? editColors[2] : "#ccc" }} />
                <div className="h-1 rounded w-full" style={{ backgroundColor: isValidHex(editColors[4]) ? editColors[4] : "#999" }} />
              </div>
            </div>
          </div>

          {/* Inputs de color con descripciones */}
          <div className="grid grid-cols-5 gap-2">
            {editColors.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <label className="text-[9px] font-bold text-theme-primary">{COLOR_ROLE_LABELS[i]}</label>
                <span className="text-[7px] text-theme-secondary text-center leading-tight">{COLOR_ROLE_AFFECTS[i]}</span>
                <div
                  className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-inner cursor-pointer relative overflow-hidden"
                  style={{ backgroundColor: isValidHex(c) ? c : "#ccc" }}
                  onClick={() => hexRefs.current[i]?.focus()}
                >
                  <input
                    ref={(el) => (hexRefs.current[i] = el)}
                    type="color"
                    value={isValidHex(c) ? c : "#000000"}
                    onChange={(e) => {
                      const next = [...editColors];
                      next[i] = e.target.value.toUpperCase();
                      setEditColors(next);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={c}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    const next = [...editColors];
                    next[i] = val;
                    setEditColors(next);
                  }}
                  maxLength={7}
                  className={`w-full text-center text-[10px] font-mono px-1 py-0.5 border rounded ${
                    isValidHex(c) ? "border-gray-200 text-theme-primary" : "border-red-400 text-red-500"
                  } bg-[var(--bg-card)] outline-none focus:ring-1 focus:ring-[var(--accent)]`}
                />
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!editName.trim() || !editColors.every(isValidHex)}
              className="flex-1 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-bold hover:bg-[var(--accent-hover)] disabled:opacity-40 transition"
            >
              {newPaletteMode ? "Crear" : "Guardar"}
            </button>
            {!newPaletteMode && editing.startsWith("custom-") && (
              <button
                onClick={() => setConfirmDelete(editing)}
                className="px-3 py-2 rounded-lg bg-red-100 text-red-600 text-sm font-bold hover:bg-red-200 transition"
              >
                🗑
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Paletas integradas ──────────────────────────────────────── */}
      <div>
        <h4 className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-2">
          Integradas
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {BUILTIN_PALETTES.map((p) => (
            <PaletteCard
              key={p.id}
              palette={p}
              active={selectedPalette === p.id}
              onClick={() => setSelectedPalette(p.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Paletas personalizadas ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider">
            Personalizadas ({customPalettes.length}/{MAX_CUSTOM})
          </h4>
          {customPalettes.length < MAX_CUSTOM && !editing && (
            <button onClick={openNew} className="text-[10px] font-bold text-[var(--accent)] hover:underline">
              + Nueva
            </button>
          )}
        </div>
        {customPalettes.length === 0 ? (
          <p className="text-xs text-theme-secondary italic">
            Crea tu propia paleta con los colores que prefieras
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {customPalettes.map((p) => (
              <PaletteCard
                key={p.id}
                palette={p}
                active={selectedPalette === p.id}
                onClick={() => setSelectedPalette(p.id)}
                onEdit={() => openEdit(p)}
                onDelete={() => setConfirmDelete(p.id)}
                custom
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Paletas premium ─────────────────────────────────────────── */}
      <div>
        <h4 className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-2">
          Premium
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {PREMIUM_PALETTES.map((p) => {
            const unlocked = unlockedPremium.includes(p.id);
            return (
              <PaletteCard
                key={p.id}
                palette={p}
                active={selectedPalette === p.id}
                onClick={() => unlocked && setSelectedPalette(p.id)}
                locked={!unlocked}
                salesRequired={p.requiredSales}
                totalSales={totalSales}
                icon={p.icon}
              />
            );
          })}
        </div>
      </div>

      {/* ── Leyenda de colores ──────────────────────────────────────── */}
      <div className="border border-[var(--border)] rounded-xl p-3 bg-[var(--bg-card)]">
        <h4 className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-2">
          ¿Qué controla cada color?
        </h4>
        <div className="space-y-1.5">
          {COLOR_ROLE_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border border-gray-200 flex-shrink-0" style={{ backgroundColor: `var(--${["bg-primary", "bg-card", "accent", "text-primary", "text-secondary"][i]})` }} />
              <span className="text-[10px] font-bold text-theme-primary w-16">{label}</span>
              <span className="text-[9px] text-theme-secondary">{COLOR_ROLE_DESCRIPTIONS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PaletteCard ──────────────────────────────────────────────────── */

function PaletteCard({
  palette,
  active,
  onClick,
  onEdit,
  onDelete,
  locked,
  salesRequired,
  totalSales,
  icon,
  custom,
}) {
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col rounded-xl border-2 transition-all overflow-hidden cursor-pointer ${
        active
          ? "border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/20 scale-[1.03]"
          : locked
          ? "border-gray-200 opacity-50 cursor-not-allowed"
          : "border-theme hover:shadow-sm hover:scale-[1.01]"
      }`}
    >
      {/* Barra de 5 colores */}
      <div className="flex h-6 w-full">
        {palette.colors.map((c, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>

      {/* Info */}
      <div className="px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1 min-w-0">
          {icon && <span className="text-xs">{icon}</span>}
          <span className="text-[10px] font-medium text-theme-secondary truncate">
            {palette.name}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {active && (
            <span className="text-[8px] font-bold text-[var(--accent)]">ACTIVO</span>
          )}
          {locked && (
            <span className="text-[9px] text-theme-secondary">
              🔒 {totalSales || 0}/{salesRequired}
            </span>
          )}
        </div>
      </div>

      {/* Acciones: editar + eliminar (solo custom) */}
      {custom && !locked && (
        <div className="absolute top-1 right-1 flex gap-1">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="w-5 h-5 rounded-full bg-white/80 hover:bg-white text-theme-secondary text-[10px] flex items-center justify-center shadow-sm"
              title="Editar"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-5 h-5 rounded-full bg-white/80 hover:bg-red-100 text-theme-secondary hover:text-red-500 text-[10px] flex items-center justify-center shadow-sm"
              title="Eliminar"
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}
