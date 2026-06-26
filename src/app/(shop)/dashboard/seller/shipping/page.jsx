"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "Amazonas", "Ancash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca",
  "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad",
  "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco",
  "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali",
];

export default function SellerShippingPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    storeId: "",
    name: "",
    department: "",
    province: "",
    cost: "",
    estimatedDays: "3",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zonesRes, storesRes] = await Promise.all([
        fetch("/api/shipping/zones"),
        fetch("/api/stores"),
      ]);

      const zonesData = await zonesRes.json().catch(() => ({ zones: [] }));
      const storesData = await storesRes.json().catch(() => []);

      if (Array.isArray(zonesData)) {
        setZones(zonesData);
      } else if (zonesData?.zones) {
        setZones(zonesData.zones);
      }

      if (Array.isArray(storesData)) {
        setStores(storesData);
      } else if (storesData?.stores) {
        setStores(storesData.stores);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.storeId || !form.name || !form.department || !form.cost) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/shipping/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cost: Number(form.cost),
          estimatedDays: Number(form.estimatedDays) || 3,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error");

      toast.success("Zona de envío creada");
      setShowForm(false);
      setForm({ storeId: "", name: "", department: "", province: "", cost: "", estimatedDays: "3" });
      await fetchData();
    } catch (err) {
      toast.error(err?.message || "Error creando zona");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId) => {
    if (!confirm("¿Eliminar esta zona de envío?")) return;

    try {
      const res = await fetch(`/api/shipping/zones?id=${zoneId}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error");

      toast.success("Zona eliminada");
      await fetchData();
    } catch (err) {
      toast.error(err?.message || "Error eliminando zona");
    }
  };

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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de envíos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar zona
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Configura las zonas de envío y costos para tus tiendas. El comprador verá el costo al momento de checkout.
      </p>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-700">Nueva zona de envío</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tienda *</label>
              <select
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Seleccionar tienda</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la zona *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Ej: Envío estándar Lima"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">Seleccionar departamento</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia (opcional)</label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                placeholder="Dejar vacío para toda la región"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo (S/) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días estimados</label>
              <input
                type="number"
                min="1"
                value={form.estimatedDays}
                onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {saving ? "Guardando..." : "Crear zona"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de zonas */}
      {zones.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-500">No hay zonas de envío configuradas</p>
          <p className="text-sm text-gray-400 mt-1">Agrega zonas para que los compradores vean el costo de envío</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Zona</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Tienda</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Ubicación</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Costo</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Días</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Estado</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{zone.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{zone.store?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {zone.department}{zone.province ? `, ${zone.province}` : ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                    S/ {Number(zone.cost).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{zone.estimatedDays} días</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      zone.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {zone.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(zone.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Eliminar
                    </button>
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
