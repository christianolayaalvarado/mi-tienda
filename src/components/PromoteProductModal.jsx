"use client";

import { useState, useEffect } from "react";

const PLANS = [
  { key: "basic", label: "Destacado", price: 5, days: 7, icon: "⭐", color: "blue" },
  { key: "boost", label: "Boost", price: 10, days: 14, icon: "🚀", color: "purple" },
  { key: "premium", label: "Premium", price: 20, days: 30, icon: "👑", color: "amber" },
];

export default function PromoteProductModal({ open, onClose }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("basic");
  const [phone, setPhone] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (open) {
      fetch("/api/products/mine", { credentials: "include" })
        .then((r) => r.json())
        .then((data) => setProducts(data.products || []))
        .catch(() => setProducts([]));
    }
  }, [open]);

  const plan = PLANS.find((p) => p.key === selectedPlan);

  const handleSubmit = async () => {
    if (!selectedProduct) {
      setToast({ type: "error", msg: "Selecciona un producto" });
      return;
    }
    if (!phone.trim()) {
      setToast({ type: "error", msg: "Ingresa tu numero de telefono" });
      return;
    }
    if (!paymentRef.trim()) {
      setToast({ type: "error", msg: "Ingresa el ID de la transaccion" });
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const res = await fetch("/api/featured/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: selectedProduct,
          plan: selectedPlan,
          paymentMethod: "yape",
          paymentRef: paymentRef || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ type: "success", msg: "Solicitud enviada. Tu producto sera destacado tras verificacion del pago (1-24 horas)." });
        setTimeout(() => {
          setToast(null);
          onClose();
          setSelectedProduct("");
          setSelectedPlan("basic");
          setPhone("");
          setPaymentRef("");
        }, 2000);
      } else {
        setToast({ type: "error", msg: data.error || "Error al procesar el pago" });
      }
    } catch {
      setToast({ type: "error", msg: "Error de conexion" });
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">Destacar producto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {toast && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${toast.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {toast.msg}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Producto</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">Selecciona un producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — S/ {p.price?.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan de destacado</label>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPlan(p.key)}
                className={`p-3 rounded-xl border-2 text-center transition ${
                  selectedPlan === p.key
                    ? `border-${p.color}-500 bg-${p.color}-50`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-lg block mb-0.5">{p.icon}</span>
                <span className="text-xs font-bold block">{p.label}</span>
                <span className="text-[10px] text-gray-500 block">{p.days} días</span>
                <span className="text-sm font-bold block mt-1">S/ {p.price}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Total a pagar: <span className="text-lg font-bold text-blue-700">S/ {plan?.price}</span>
            <span className="text-xs text-gray-500 ml-2">({plan?.days} días)</span>
          </p>
          <div className="space-y-2 mt-3">
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Yape</p>
              <p className="text-sm text-gray-800">Numero: <strong>519 595 02168</strong></p>
              <p className="text-xs text-gray-500 mt-1">Abre tu app Yape y envia el monto</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Transferencia bancaria</p>
              <p className="text-sm text-gray-800">Cuenta: <strong>19198605848064</strong></p>
              <p className="text-sm text-gray-800">CCI: <strong>00219119860584806450</strong></p>
              <p className="text-xs text-gray-500 mt-1">Banco de Credito del Peru (BCP)</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tu numero de telefono (Yape)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9XX XXX XXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID de transaccion (requerido)</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="Codigo de operacion Yape o transferencia"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedProduct || !phone.trim() || !paymentRef.trim()}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Procesando..." : `Pagar S/ ${plan?.price} y destacar`}
          </button>
        </div>
      </div>
    </div>
  );
}
