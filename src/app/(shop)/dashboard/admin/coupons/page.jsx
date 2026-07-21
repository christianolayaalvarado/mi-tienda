"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: "",
    maxUses: "",
    expiresAt: "",
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons", { credentials: "include" });
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      toast.error("Error cargando cupones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) {
      toast.error("Código y valor requeridos");
      return;
    }
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Cupón creado");
        setForm({ code: "", discountType: "percentage", discountValue: "", minPurchase: "", maxUses: "", expiresAt: "" });
        setShowForm(false);
        fetchCoupons();
      } else {
        toast.error(data.error || "Error creando cupón");
      }
    } catch {
      toast.error("Error creando cupón");
    }
  };

  const toggleActive = async (id, active) => {
    try {
      await fetch(`/api/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ active: !active }),
      });
      fetchCoupons();
    } catch {
      toast.error("Error actualizando cupón");
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm("¿Eliminar este cupón?")) return;
    try {
      await fetch(`/api/coupons/${id}`, { method: "DELETE", credentials: "include" });
      toast.success("Cupón eliminado");
      fetchCoupons();
    } catch {
      toast.error("Error eliminando cupón");
    }
  };

  if (loading) return <p className="p-6">Cargando cupones...</p>;

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Cupones de Descuento</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition"
        >
          {showForm ? "Cancelar" : "+ Nuevo cupón"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Ej: PRIMERA10"
                className="w-full px-3 py-2 border rounded-lg text-sm uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo (S/)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor del descuento</label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "percentage" ? "10" : "5.00"}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compra mínima (S/)</label>
              <input
                type="number"
                value={form.minPurchase}
                onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usos máximos (0 = ilimitado)</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de expiración</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            Crear cupón
          </button>
        </form>
      )}

      {coupons.length === 0 ? (
        <p className="text-gray-500">No hay cupones creados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Mínimo</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Usos</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{c.code}</td>
                  <td className="px-4 py-3 text-center">{c.discountType === "percentage" ? "%" : "S/"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{c.discountValue}{c.discountType === "percentage" ? "%" : ""}</td>
                  <td className="px-4 py-3 text-right">S/ {c.minPurchase.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">{c.usedCount}{c.maxUses > 0 ? `/${c.maxUses}` : "/∞"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => toggleActive(c.id, c.active)} className="text-xs text-blue-600 hover:text-blue-800">
                        {c.active ? "Desactivar" : "Activar"}
                      </button>
                      <button onClick={() => deleteCoupon(c.id)} className="text-xs text-red-600 hover:text-red-800">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
