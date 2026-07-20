"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatCurrency(v) {
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v || 0);
  } catch {
    return `S/ ${(v || 0).toFixed(2)}`;
  }
}

export default function SoldProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/sold-products", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setProducts(d?.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = products.reduce((s, p) => s + p.totalRevenue, 0);
  const totalSold = products.reduce((s, p) => s + p.totalSold, 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productos Vendidos</h1>
        <p className="text-sm text-gray-500">Resumen de productos que has vendido</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Productos vendidos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Unidades vendidas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalSold}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Ingresos totales</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {/* Products table */}
      {products.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-500 mt-4">Aún no has vendido ningún producto</p>
          <Link href="/dashboard/products/new" className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            Crear producto
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Vendidos</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Ingresos</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Stock actual</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">IMG</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{p.title}</p>
                          <Link href={`/product/${p.id}`} className="text-xs text-green-600 hover:underline">Ver en tienda</Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{p.totalSold}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(p.totalRevenue)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.currentStock === 0 ? "bg-red-100 text-red-700" : p.currentStock <= 3 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
                        {p.currentStock === 0 ? "Agotado" : p.currentStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.currentStock === 0 ? (
                        <Link href={`/dashboard/products/edit/${p.id}`} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg hover:bg-yellow-200 transition font-medium">
                          Reabastecer
                        </Link>
                      ) : (
                        <Link href={`/dashboard/products/edit/${p.id}`} className="text-xs text-gray-500 hover:text-green-600 transition">
                          Editar
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
