"use client";

import { useState, useEffect } from "react";

export default function DashboardAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/analytics", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-20" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Productos", value: data.totalProducts, icon: "📦", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Órdenes (7d)", value: data.ordersLast7Days, sub: `${data.totalOrders} total`, icon: "🛒", color: "text-green-600", bg: "bg-green-50" },
    { label: "Ingresos (30d)", value: `S/ ${data.revenueLast30Days.toLocaleString()}`, sub: `S/ ${data.totalRevenue.toLocaleString()} total`, icon: "💰", color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Favoritos", value: data.totalFavorites, icon: "❤️", color: "text-red-500", bg: "bg-red-50" },
    { label: "Stock bajo", value: data.lowStockProducts, icon: "⚠️", color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Sin stock", value: data.outOfStock, icon: "🚫", color: "text-gray-600", bg: "bg-gray-50" },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen de métricas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg p-3 border border-gray-100`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{s.icon}</span>
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
