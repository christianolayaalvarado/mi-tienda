"use client";

import VendorStats from "@/components/VendorStats";

export default function VentasPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Resumen de Ventas</h1>
        <p className="text-sm text-gray-500 mt-1">Ingresos, órdenes, comisiones y rendimiento de tu tienda</p>
      </div>
      <VendorStats />
    </div>
  );
}
