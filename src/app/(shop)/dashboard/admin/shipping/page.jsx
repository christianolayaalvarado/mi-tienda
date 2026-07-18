"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const DEPARTMENTS = [
  "Amazonas", "Ancash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca",
  "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad",
  "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco",
  "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali",
];

const RATE_TYPES = {
  fixed: { label: "Precio fijo", desc: "Costo único sin importar peso" },
  per_kg: { label: "Por kilogramo", desc: "Base + costo por cada kg" },
  per_package: { label: "Por paquete", desc: "Costo por paquete (definido por vendedor)" },
};

const EMPTY_FORM = {
  department: "",
  province: "",
  rateType: "fixed",
  baseCost: "",
  costPerKg: "",
  costPerPackage: "",
  minCost: "",
  estimatedDays: "3",
  isActive: true,
};

export default function AdminShippingRatesPage() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shipping-rates");
      const data = await res.json();
      setRates(data.rates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.department || !form.province) {
      toast.error("Departamento y provincia son requeridos");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error guardando");
      }
      toast.success("Tarifa guardada");
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchRates();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta tarifa?")) return;
    try {
      const res = await fetch(`/api/admin/shipping-rates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando");
      toast.success("Tarifa eliminada");
      fetchRates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggle = async (rate) => {
    try {
      const res = await fetch("/api/admin/shipping-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rate, isActive: !rate.isActive }),
      });
      if (!res.ok) throw new Error("Error");
      fetchRates();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatCost = (rate) => {
    switch (rate.rateType) {
      case "per_kg":
        return `S/ ${rate.baseCost} base + S/ ${rate.costPerKg}/kg`;
      case "per_package":
        return `S/ ${rate.costPerPackage}/paquete`;
      default:
        return `S/ ${rate.baseCost}`;
    }
  };

  const filtered = filterDept ? rates.filter((r) => r.department === filterDept) : rates;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifas de Envío</h1>
          <p className="text-sm text-gray-500">Configura costos de envío por destino (origen: Trujillo)</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setForm(EMPTY_FORM); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition text-sm"
        >
          {showForm ? "Cancelar" : "+ Nueva tarifa"}
        </button>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Cómo funciona el cálculo de envío:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><b>Precio fijo:</b> Costo único sin importar el peso del paquete</li>
          <li><b>Por kilogramo:</b> Costo base + (peso × costo por kg). Mínimo aplicable</li>
          <li><b>Por paquete:</b> El vendedor define cuántos paquetes envía y cobra por cada uno</li>
          <li><b>Sin tarifa configurada:</b> El comprador paga en destino al retirar en la agencia</li>
        </ul>
      </div>

      {/* New rate form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Nueva tarifa de envío</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                placeholder="Ej: Piura, Lima, Trujillo..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de tarifa</label>
              <select
                value={form.rateType}
                onChange={(e) => setForm({ ...form, rateType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(RATE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Días estimados</label>
              <input
                type="number"
                min="1"
                max="30"
                value={form.estimatedDays}
                onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {form.rateType === "fixed" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo fijo (S/)</label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={form.baseCost}
                onChange={(e) => setForm({ ...form, baseCost: e.target.value })}
                placeholder="Ej: 15.00"
                className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {form.rateType === "per_kg" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo base (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.baseCost}
                  onChange={(e) => setForm({ ...form, baseCost: e.target.value })}
                  placeholder="Ej: 5.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo por kg (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.costPerKg}
                  onChange={(e) => setForm({ ...form, costPerKg: e.target.value })}
                  placeholder="Ej: 2.50"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Costo mínimo (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.minCost}
                  onChange={(e) => setForm({ ...form, minCost: e.target.value })}
                  placeholder="Ej: 8.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {form.rateType === "per_package" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo por paquete (S/)</label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={form.costPerPackage}
                onChange={(e) => setForm({ ...form, costPerPackage: e.target.value })}
                placeholder="Ej: 10.00"
                className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Activa</label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition text-sm"
          >
            {saving ? "Guardando..." : "Guardar tarifa"}
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Todos los departamentos</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-sm text-gray-500">{filtered.length} tarifas</span>
      </div>

      {/* Rates table */}
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay tarifas configuradas. Agrega la primera.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="pb-2 font-medium">Destino</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Costo</th>
                <th className="pb-2 font-medium">Días</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rate) => (
                <tr key={rate.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3">
                    <p className="font-medium text-gray-900">{rate.province}</p>
                    <p className="text-xs text-gray-500">{rate.department}</p>
                  </td>
                  <td className="py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      rate.rateType === "fixed" ? "bg-blue-100 text-blue-800" :
                      rate.rateType === "per_kg" ? "bg-purple-100 text-purple-800" :
                      "bg-orange-100 text-orange-800"
                    }`}>
                      {RATE_TYPES[rate.rateType]?.label || rate.rateType}
                    </span>
                  </td>
                  <td className="py-3 text-gray-700">{formatCost(rate)}</td>
                  <td className="py-3 text-gray-700">{rate.estimatedDays} días</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleToggle(rate)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        rate.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        rate.isActive ? "left-4" : "left-0.5"
                      }`} />
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDelete(rate.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
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
