"use client";

import { useState, useEffect, useCallback } from "react";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "registered", label: "Registrados" },
  { value: "unregistered", label: "No registrados" },
];

export default function AdminModalFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    try {
      const res = await fetch("/api/admin/modal-flags");
      const data = await res.json();
      setFlags(data.flags || []);
    } catch (err) {
      console.error("Error fetching flags:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleFlag = useCallback(async (flag) => {
    setSaving(flag.id);
    try {
      const res = await fetch("/api/admin/modal-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flag.id, enabled: !flag.enabled }),
      });
      if (res.ok) {
        setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
      }
    } catch (err) {
      console.error("Error toggling flag:", err);
    } finally {
      setSaving(null);
    }
  }, []);

  const updateAudience = useCallback(async (flag, audience) => {
    setSaving(flag.id);
    try {
      const res = await fetch("/api/admin/modal-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flag.id, audience }),
      });
      if (res.ok) {
        setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, audience } : f));
      }
    } catch (err) {
      console.error("Error updating audience:", err);
    } finally {
      setSaving(null);
    }
  }, []);

  const updateSchedule = useCallback(async (flag, activateAt, deactivateAt) => {
    setSaving(flag.id);
    try {
      const res = await fetch("/api/admin/modal-flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flag.id, activateAt: activateAt || null, deactivateAt: deactivateAt || null }),
      });
      if (res.ok) {
        setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, activateAt: activateAt || null, deactivateAt: deactivateAt || null } : f));
      }
    } catch (err) {
      console.error("Error updating schedule:", err);
    } finally {
      setSaving(null);
    }
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">Control de Modales</h2>
      <p className="text-sm text-gray-500">Habilita/deshabilita modales de bienvenida, ofertas y temporadas. Configura audiencia y programación.</p>

      <div className="space-y-3">
        {flags.map((flag) => {
          const isSeasonal = flag.key.startsWith("seasonal_");
          return (
            <div key={flag.id} className={`p-4 rounded-xl border transition-all ${flag.enabled ? "border-green-300 bg-green-50/50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 truncate">{flag.label}</span>
                    {isSeasonal && <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">Temporada</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{flag.key}</div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={flag.audience}
                    onChange={(e) => updateAudience(flag, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                    disabled={saving === flag.id}
                  >
                    {AUDIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => toggleFlag(flag)}
                    disabled={saving === flag.id}
                    className={`relative w-11 h-6 rounded-full transition-colors ${flag.enabled ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${flag.enabled ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              </div>

              {flag.enabled && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <label className="text-gray-500">Activar:</label>
                  <input
                    type="datetime-local"
                    value={flag.activateAt ? new Date(flag.activateAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) => updateSchedule(flag, e.target.value, flag.deactivateAt)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                    disabled={saving === flag.id}
                  />
                  <label className="text-gray-500 ml-2">Desactivar:</label>
                  <input
                    type="datetime-local"
                    value={flag.deactivateAt ? new Date(flag.deactivateAt).toISOString().slice(0, 16) : ""}
                    onChange={(e) => updateSchedule(flag, flag.activateAt, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                    disabled={saving === flag.id}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
