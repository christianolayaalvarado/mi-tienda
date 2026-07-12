"use client";

import { useState, useEffect } from "react";

export default function FreeShippingToggle({ productId, currentFreeShipping, onToggle }) {
  const [enabled, setEnabled] = useState(currentFreeShipping || false);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ freeShipping: !enabled }),
      });

      if (res.ok) {
        setEnabled(!enabled);
        onToggle?.(!enabled);
      }
    } catch (e) {
      console.error("Error toggling free shipping:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-green-500" : "bg-gray-300"
        } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-gray-600">
        {enabled ? "Envío gratis activado" : "Envío gratis desactivado"}
      </span>
    </div>
  );
}
