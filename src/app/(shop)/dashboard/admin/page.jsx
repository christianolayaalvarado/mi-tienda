"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-24" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Usuarios", value: data?.totalUsers || 0, sub: `+${data?.newUsers30d || 0} (30d)`, icon: "👥", bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Vendedores", value: data?.totalSellers || 0, icon: "🏪", bg: "bg-purple-50", color: "text-purple-600" },
    { label: "Productos", value: data?.totalProducts || 0, icon: "📦", bg: "bg-green-50", color: "text-green-600" },
    { label: "Órdenes (30d)", value: data?.orders30d || 0, sub: `${data?.totalOrders || 0} total`, icon: "🛒", bg: "bg-yellow-50", color: "text-yellow-600" },
    { label: "Ingresos (30d)", value: `S/ ${(data?.revenue30d || 0).toLocaleString()}`, icon: "💰", bg: "bg-emerald-50", color: "text-emerald-600" },
    { label: "Reseñas", value: data?.totalReviews || 0, icon: "⭐", bg: "bg-amber-50", color: "text-amber-600" },
    { label: "Cupones usados", value: data?.couponsUsed || 0, icon: "🏷️", bg: "bg-pink-50", color: "text-pink-600" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg p-4 border border-gray-100`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{s.icon}</span>
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {data?.topCoupons?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cupones más usados</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {data.topCoupons.map((c, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <span className="font-mono text-sm font-medium text-gray-900">{c.code}</span>
                <span className="text-sm text-gray-500">{c.usedCount} usos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/admin/orders" className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition">📦 Órdenes</Link>
        <Link href="/dashboard/admin/sellers" className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition">👥 Vendedores</Link>
        <Link href="/dashboard/admin/coupons" className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition">🏷️ Cupones</Link>
        <Link href="/dashboard/admin/marketing" className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition">📧 Marketing</Link>
        <Link href="/dashboard/admin/shipping" className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition">🚚 Envíos</Link>
      </div>
    </div>
  );
}
