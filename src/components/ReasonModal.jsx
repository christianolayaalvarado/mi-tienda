"use client";

import { useEffect, useRef } from "react";

export default function ReasonModal({ open, initialReason = "", onClose, onConfirm }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => textareaRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onClose?.()}>
      <div className="bg-white p-4 rounded w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg">Motivo</h3>
        <p className="text-sm mt-2">Indica la razón para esta acción.</p>

        <textarea
          ref={textareaRef}
          defaultValue={initialReason}
          id="reason"
          className="w-full h-28 mt-2 p-2 border rounded resize-y"
          placeholder="Escribe la razón aquí"
          aria-label="Razón"
        />

        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={() => onClose?.()} className="px-3 py-1 border rounded">Cancelar</button>

          <button
            type="button"
            onClick={() => {
              const val = document.getElementById("reason")?.value?.trim() || "";
              if (!val) return;
              onConfirm?.(val);
            }}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
