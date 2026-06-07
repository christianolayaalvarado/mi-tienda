"use client";

import { useEffect, useCallback, useState } from "react";

export default function ReasonModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  // Limpiar razón y cerrar
  const handleClose = useCallback(() => {
    setReason("");
    onClose?.();
  }, [onClose]);

  // Bloquear scroll del body mientras el modal esté abierto
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Cerrar con Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose]
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
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded p-6 w-full max-w-md max-h-[90vh] overflow-auto shadow-lg"
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
            onClick={handleClose}
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
