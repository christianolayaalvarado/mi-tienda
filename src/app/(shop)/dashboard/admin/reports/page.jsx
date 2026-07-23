"use client";

import { useState, useEffect } from "react";

const CATEGORIES = {
  bug: { label: "Bug", icon: "🐛", color: "bg-red-100 text-red-700" },
  suggestion: { label: "Sugerencia", icon: "💡", color: "bg-blue-100 text-blue-700" },
  complaint: { label: "Queja", icon: "⚠️", color: "bg-orange-100 text-orange-700" },
  other: { label: "Otro", icon: "📝", color: "bg-gray-100 text-gray-700" },
};

const STATUS_LABELS = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  resolved: { label: "Resuelto", color: "bg-green-100 text-green-700" },
  closed: { label: "Cerrado", color: "bg-gray-100 text-gray-500" },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/support-reports?${params}`, { credentials: "include" });
      const data = await res.json();
      setReports(data.reports || []);
      setStats(data.stats || null);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [filterCategory, filterStatus]);

  const updateReport = async (reportId, status) => {
    try {
      await fetch("/api/support-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reportId, status }),
      });
      await fetchReports();
    } catch {}
  };

  const total = stats?.total || reports.length;
  const byCat = stats?.byCategory || [];
  const byDevice = stats?.byDevice || [];
  const byBrowser = stats?.byBrowser || [];
  const topUrls = stats?.topUrls || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reportes de Soporte</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {reports.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Bugs</p>
          <p className="text-2xl font-bold text-red-600">
            {reports.filter((r) => r.category === "bug").length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Resueltos</p>
          <p className="text-2xl font-bold text-green-600">
            {reports.filter((r) => r.status === "resolved").length}
          </p>
        </div>
      </div>

      {byCat.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Por Categoria</h3>
            <div className="space-y-2">
              {byCat.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{CATEGORIES[item.name]?.label || item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(item.count / total) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Por Dispositivo</h3>
            <div className="space-y-2">
              {byDevice.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(item.count / total) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Por Navegador</h3>
            <div className="space-y-2">
              {byBrowser.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(item.count / total) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-6 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Paginas reportadas</h3>
            <div className="space-y-2">
              {topUrls.length === 0 && <p className="text-xs text-gray-400">Sin datos</p>}
              {topUrls.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 truncate max-w-[150px]">{item.name}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">Todas las categorias</option>
          <option value="bug">Bugs</option>
          <option value="suggestion">Sugerencias</option>
          <option value="complaint">Quejas</option>
          <option value="other">Otros</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="in_progress">En progreso</option>
          <option value="resolved">Resueltos</option>
          <option value="closed">Cerrados</option>
        </select>
        <button onClick={fetchReports} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">Actualizar</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg">Sin reportes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <span className="text-lg">{CATEGORIES[r.category]?.icon || "?"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{r.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.device} / {r.browser}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIES[r.category]?.color || "bg-gray-100"}`}>
                  {CATEGORIES[r.category]?.label || r.category}
                </span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[r.status]?.color || "bg-gray-100"}`}>
                  {STATUS_LABELS[r.status]?.label || r.status}
                </span>
                <span className="text-xs text-gray-400 hidden sm:inline">
                  {new Date(r.createdAt).toLocaleDateString("es-PE")}
                </span>
              </div>

              {expandedId === r.id && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>{" "}
                      <span className="text-gray-800">{r.email || "No proporcionado"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">URL:</span>{" "}
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline truncate">{r.url}</a>
                      ) : (
                        <span className="text-gray-800">N/A</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Fecha:</span>{" "}
                      <span className="text-gray-800">{new Date(r.createdAt).toLocaleString("es-PE")}</span>
                    </div>
                    {r.adminNote && (
                      <div>
                        <span className="text-gray-500">Nota admin:</span>{" "}
                        <span className="text-gray-800">{r.adminNote}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {r.status === "pending" && (
                      <button onClick={() => updateReport(r.id, "in_progress")} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition">
                        Marcar en progreso
                      </button>
                    )}
                    {r.status !== "resolved" && (
                      <button onClick={() => updateReport(r.id, "resolved")} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition">
                        Marcar resuelto
                      </button>
                    )}
                    {r.status !== "closed" && (
                      <button onClick={() => updateReport(r.id, "closed")} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
