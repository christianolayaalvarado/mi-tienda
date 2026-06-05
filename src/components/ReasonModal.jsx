"use client";

import { useEffect, useCallback, useState } from "react";

export default function ReasonModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  // Defiere la limpieza para evitar setState sincrónico dentro del effect
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    // microtask para evitar la advertencia del linter
    Promise.resolve().then(() => {
      if (mounted) setReason("");
    });
    return () => {
      mounted = false;
    };
  }, [open]);

  // Cerrar con Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleConfirm = () => {
    const trimmed = (reason || "").trim();
    onConfirm?.(trimmed);
    setReason("");
    onClose?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modal eliminar orden"
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={() => onClose?.()}
    >
      <div
        className="bg-white rounded p-6 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">Eliminar orden</h2>

        <p className="text-sm text-gray-600 mb-3">
          Por favor ingresa la razón de la eliminación:
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded p-2 text-sm resize-y"
          rows={4}
          placeholder="Ejemplo: Cliente canceló la compra"
          aria-label="Razón de eliminación"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setReason("");
              onClose?.();
            }}
            className="px-4 py-2 rounded border hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={(reason || "").trim().length === 0}
            className={`px-4 py-2 rounded text-white ${
              (reason || "").trim().length === 0
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
            aria-disabled={(reason || "").trim().length === 0}
          >
            Confirmar eliminación
          </button>
        </div>
      </div>
    </div>
  );
}
