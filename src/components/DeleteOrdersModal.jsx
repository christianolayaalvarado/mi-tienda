"use client";

import { useEffect, useCallback, useState } from "react";

export default function DeleteOrdersModal({ orderIds = [], onClose, onDeleted }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Limpiar cuando se abre/cierra
  useEffect(() => {
    if (!orderIds || orderIds.length === 0) {
      setReason("");
      setError(null);
    }
  }, [orderIds]);

  // Cerrar con Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!orderIds || orderIds.length === 0) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orderIds, handleKeyDown]);

  const handleConfirm = async () => {
    setError(null);
    const trimmed = (reason || "").trim();
    if (!trimmed) {
      setError("La razón es obligatoria");
      return;
    }

    if (!confirm(`Esta acción marcará ${orderIds.length} orden(es) como eliminadas. ¿Continuar?`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/orders/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds, reason: trimmed }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || json?.message || "Error eliminando órdenes");
      }

      onDeleted && onDeleted();
      onClose && onClose();
    } catch (err) {
      console.error("DeleteOrdersModal error:", err);
      setError(err?.message || "Error eliminando órdenes");
    } finally {
      setLoading(false);
    }
  };

  if (!orderIds || orderIds.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Eliminar ${orderIds.length} ordenes`}
      className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      onClick={() => onClose?.()}
    >
      <div
        className="bg-white p-4 rounded w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-lg">Eliminar órdenes ({orderIds.length})</h3>

        <p className="text-sm mt-2">
          Indica la razón por la cual se eliminarán estas órdenes. Este registro es obligatorio.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full h-28 mt-2 p-2 border rounded resize-y"
          placeholder="Ejemplo: Cliente canceló la compra"
          aria-label="Razón de eliminación"
        />

        {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

        <div className="flex justify-end gap-2 mt-3">
          <button
            type="button"
            onClick={() => {
              setReason("");
              setError(null);
              onClose?.();
            }}
            disabled={loading}
            className="px-3 py-1 border rounded"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (reason || "").trim().length === 0}
            className={`px-3 py-1 rounded text-white ${
              loading || (reason || "").trim().length === 0
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
            aria-disabled={loading || (reason || "").trim().length === 0}
          >
            {loading ? "Eliminando..." : "Confirmar eliminación"}
          </button>
        </div>
      </div>
    </div>
  );
}
