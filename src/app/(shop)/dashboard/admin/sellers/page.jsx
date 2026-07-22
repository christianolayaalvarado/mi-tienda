"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sellers", { credentials: "include" });
      const data = await res.json();
      setSellers(data.sellers || []);
    } catch { toast.error("Error al cargar vendedores"); }
    setLoading(false);
  };

  useEffect(() => { fetchSellers(); }, []);

  const toggleVerification = async (sellerId, current) => {
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sellerId, isVerified: !current }),
      });
      if (res.ok) {
        setSellers((prev) =>
          prev.map((s) => (s.id === sellerId ? { ...s, isVerified: !current } : s))
        );
        toast.success(!current ? "Vendedor verificado ✓" : "Verificación removida");
      } else {
        toast.error("Error al actualizar");
      }
    } catch { toast.error("Error de red"); }
  };

  const filtered = sellers.filter((s) => {
    if (filter === "verified") return s.isVerified;
    if (filter === "unverified") return !s.isVerified;
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendedores</h1>
        <Link href="/dashboard/admin" className="text-sm text-green-600 hover:underline">← Volver</Link>
      </div>

      <div className="flex gap-2 mb-4">
        {[["", "Todos"], ["verified", "Verificados"], ["unverified", "Sin verificar"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === val ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No hay vendedores.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((seller) => (
            <div key={seller.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{seller.name || "Sin nombre"}</p>
                    {seller.isVerified && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">✓ Verificado</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{seller.email}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>{seller.productCount} productos</span>
                    <span>{seller.storeCount} tiendas</span>
                    {seller.city && <span>{seller.city}</span>}
                  </div>
                </div>
                <button
                  onClick={() => toggleVerification(seller.id, seller.isVerified)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    seller.isVerified
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {seller.isVerified ? "Remover verificación" : "Verificar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
