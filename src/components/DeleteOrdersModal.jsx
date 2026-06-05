// components/DeleteOrdersModal.jsx (simplificado)
"use client";
import { useState } from "react";

export default function DeleteOrdersModal({ orderIds = [], onClose, onDeleted }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      alert("Escribe la razón de la eliminación");
      return;
    }
    if (!confirm("Esta acción marcará las órdenes como eliminadas. ¿Continuar?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error");
      onDeleted && onDeleted();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Error eliminando órdenes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white p-4 rounded w-full max-w-lg">
        <h3 className="font-bold">Eliminar órdenes ({orderIds.length})</h3>
        <p className="text-sm mt-2">Indica la razón por la cual se eliminarán estas órdenes (registro obligatorio).</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full h-28 mt-2 p-2 border" />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} disabled={loading} className="px-3 py-1">Cancelar</button>
          <button onClick={handleConfirm} disabled={loading} className="px-3 py-1 bg-red-600 text-white rounded">
            {loading ? "Eliminando..." : "Confirmar eliminación"}
          </button>
        </div>
      </div>
    </div>
  );
}
