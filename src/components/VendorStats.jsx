"use client";

import { useState, useEffect } from "react";
import PromoteProductModal from "@/components/PromoteProductModal";

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0`}
        style={{ background: color + "18" }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-5 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

function formatCurrency(val) {
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(val || 0));
  } catch {
    return `S/ ${Number(val || 0).toFixed(2)}`;
  }
}

export default function VendorStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPromote, setShowPromote] = useState(false);

  useEffect(() => {
    fetch("/api/vendor/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats({
          totalRevenue: 0,
          totalOrders: 0,
          pendingCommission: 0,
          paidCommission: 0,
          productCount: 0,
          totalViews: 0,
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        <StatCard
          icon="💰"
          label="Ingresos"
          value={formatCurrency(stats.totalRevenue)}
          color="#16a34a"
          sub="Ventas pagadas"
        />
        <StatCard
          icon="📦"
          label="Órdenes"
          value={stats.totalOrders}
          color="#3b82f6"
          sub="Total realizadas"
        />
        <StatCard
          icon="⏳"
          label="Comisión pendiente"
          value={formatCurrency(stats.pendingCommission)}
          color="#f59e0b"
          sub="Por cobrar"
        />
        <StatCard
          icon="✅"
          label="Comisión pagada"
          value={formatCurrency(stats.paidCommission)}
          color="#10b981"
          sub="Ya cobrada"
        />
        <StatCard
          icon="🏷️"
          label="Productos"
          value={stats.productCount}
          color="#8b5cf6"
          sub="En tu tienda"
        />
        <StatCard
          icon="👁️"
          label="Vistas totales"
          value={stats.totalViews.toLocaleString()}
          color="#ec4899"
          sub="Visitas a productos"
        />
      </div>

      <div className="mt-4">
        <button
          onClick={() => setShowPromote(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium text-sm hover:from-blue-600 hover:to-purple-700 transition shadow-sm"
        >
          🚀 Promocionar producto
        </button>
      </div>

      <PromoteProductModal open={showPromote} onClose={() => setShowPromote(false)} />
    </>
  );
}
