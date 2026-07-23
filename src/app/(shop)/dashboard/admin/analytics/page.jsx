"use client";

import { useState, useEffect } from "react";

export default function ConversionAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/conversion-analytics", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const byViews = data?.byViews || [];
  const bySold = data?.bySold || [];
  const lowConversion = data?.lowConversion || [];
  const favoriteOnly = data?.favoriteOnly || [];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Conversion Analytics</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Total vistas</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalViews || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Prod. con ventas</p>
              <p className="text-2xl font-bold text-green-600">{summary.productsWithSales || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Conversion promedio</p>
              <p className="text-2xl font-bold text-blue-600">{summary.avgConversion || 0}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Baja conversion</p>
              <p className="text-2xl font-bold text-red-600">{lowConversion.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Mas vistos</h3>
              <div className="space-y-3">
                {byViews.length === 0 && <p className="text-xs text-gray-400">Sin datos</p>}
                {byViews.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.views} vistas · {p.sold} ventas · {p.favorites} fav</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${Number(p.conversionRate) > 5 ? "bg-green-100 text-green-700" : Number(p.conversionRate) > 0 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                      {p.conversionRate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Mas vendidos</h3>
              <div className="space-y-3">
                {bySold.length === 0 && <p className="text-xs text-gray-400">Sin datos</p>}
                {bySold.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.sold} ventas · {p.views} vistas · S/.{p.price}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      {p.conversionRate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">0 ventas con visitas</h3>
              <p className="text-xs text-gray-400 mb-4">Productos que la gente ve pero no compra</p>
              <div className="space-y-3">
                {lowConversion.length === 0 && <p className="text-xs text-gray-400">Ninguno. Buena senal!</p>}
                {lowConversion.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.views} vistas, {p.favorites} fav</p>
                    </div>
                    {p.discountSuggestion && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-red-600">-{p.discountSuggestion.value}%</p>
                        <p className="text-[10px] text-gray-400">{p.discountSuggestion.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Favoritos sin compra</h3>
              <p className="text-xs text-gray-400 mb-4">Productos que les dan like pero no compran</p>
              <div className="space-y-3">
                {favoriteOnly.length === 0 && <p className="text-xs text-gray-400">Ninguno</p>}
                {favoriteOnly.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.favorites} favoritos, 0 ventas</p>
                    </div>
                    {p.discountSuggestion && (
                      <div className="text-right">
                        <p className="text-xs font-semibold text-orange-600">-{p.discountSuggestion.value}%</p>
                        <p className="text-[10px] text-gray-400">{p.discountSuggestion.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
