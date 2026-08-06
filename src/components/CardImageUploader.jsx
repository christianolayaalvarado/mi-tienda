"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const CATEGORIES = [
  {
    id: "nav", label: "Navegación", icon: "📌",
    items: [
      { href: "/dashboard", label: "Inicio", icon: "🏠" },
      { href: "/dashboard/favorites", label: "Favoritos", icon: "❤️" },
    ],
  },
  {
    id: "tienda", label: "Tienda", icon: "🛍️",
    items: [
      { href: "/dashboard/products", label: "Productos", icon: "📦" },
      { href: "/dashboard/orders", label: "Mis Órdenes", icon: "🧾" },
      { href: "/dashboard/seller/reviews", label: "Reseñas", icon: "⭐" },
    ],
  },
  {
    id: "ventas", label: "Ventas", icon: "💰",
    items: [
      { href: "/dashboard/seller/orders", label: "Ventas", icon: "💰" },
      { href: "/dashboard/seller/sold-products", label: "Productos vendidos", icon: "📊" },
      { href: "/dashboard/seller/analytics", label: "Visitantes", icon: "🗺️" },
    ],
  },
  {
    id: "marketing", label: "Marketing", icon: "📧",
    items: [
      { href: "/dashboard/seller/marketing", label: "Email Marketing", icon: "📧" },
      { href: "/dashboard/admin/marketing", label: "Email Marketing Admin", icon: "📣" },
    ],
  },
  {
    id: "engagement", label: "Engagement", icon: "🎮",
    items: [
      { href: "/spin-wheel", label: "Ruleta", icon: "🎰" },
      { href: "/dashboard/referrals", label: "Invitar amigos", icon: "🎁" },
      { href: "/dashboard/mascotas", label: "Mascotas", icon: "🎭" },
    ],
  },
  {
    id: "cuenta", label: "Mi Cuenta", icon: "👤",
    items: [
      { href: "/dashboard/profile/edit", label: "Editar Perfil", icon: "👤" },
      { href: "/dashboard/payment-methods", label: "Formas de pago", icon: "💳" },
    ],
  },
  {
    id: "admin", label: "Admin", icon: "🔧", adminOnly: true,
    items: [
      { href: "/dashboard/admin/orders", label: "Órdenes", icon: "🔧" },
      { href: "/dashboard/admin/sellers", label: "Vendedores", icon: "👥" },
      { href: "/dashboard/admin/plans", label: "Planes", icon: "💳" },
      { href: "/dashboard/admin/reports", label: "Reportes", icon: "📋" },
      { href: "/dashboard/admin/analytics", label: "Conversión", icon: "📊" },
      { href: "/dashboard/admin/shipping", label: "Tarifas envío", icon: "🚚" },
      { href: "/dashboard/admin/coupons", label: "Cupones", icon: "🏷️" },
    ],
  },
];

function PositionSliders({ data, onChange }) {
  const fields = [
    { key: "offsetX", label: "X", min: -50, max: 50, suffix: "%" },
    { key: "offsetY", label: "Y", min: -50, max: 50, suffix: "%" },
    { key: "scale", label: "Zoom", min: 10, max: 200, suffix: "%", isPercent: true },
  ];
  return (
    <div className="mt-3 space-y-2">
      {fields.map((f) => (
        <div key={f.key} className="flex items-center gap-3">
          <label className="text-xs text-gray-500 w-14">{f.label}:</label>
          <input
            type="range"
            min={f.min}
            max={f.max}
            value={f.isPercent ? (data[f.key] || 1) * 100 : (data[f.key] || 0)}
            onChange={(e) => onChange(f.key, f.isPercent ? Number(e.target.value) / 100 : Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-400 w-12">
            {f.isPercent ? Math.round((data[f.key] || 1) * 100) + f.suffix : (data[f.key] || 0) + f.suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CardImageUploader({ onClose }) {
  const [images, setImages] = useState({});
  const [selected, setSelected] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetch("/api/admin/card-images", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map = {};
          data.forEach((img) => {
            const key = img.itemHref ? `${img.cardId}::${img.itemHref}` : img.cardId;
            map[key] = img;
          });
          setImages(map);
        }
      })
      .catch(() => {});
  }, []);

  const makeKey = (cardId, itemHref) => itemHref ? `${cardId}::${itemHref}` : cardId;

  const toggleExpand = (catId) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const selectTarget = (cardId, itemHref = null, label) => {
    setSelected({ cardId, itemHref, label });
  };

  const handleUpload = useCallback(async (cardId, file, itemHref = null) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        const key = makeKey(cardId, itemHref);
        const current = images[key] || {};
        setImages((prev) => ({
          ...prev,
          [key]: { ...current, cardId, itemHref, imageUrl: data.url },
        }));
      }
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setUploading(false);
    }
  }, [images]);

  const handleSave = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const key = makeKey(selected.cardId, selected.itemHref);
      const img = images[key];
      if (!img) return;
      const res = await fetch("/api/admin/card-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cardId: selected.cardId,
          itemHref: selected.itemHref,
          imageUrl: img.imageUrl,
          offsetX: img.offsetX || 0,
          offsetY: img.offsetY || 0,
          scale: img.scale || 1,
        }),
      });
      if (res.ok) {
        toast.success("Imagen guardada");
        onClose();
      } else {
        toast.error("Error al guardar");
      }
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }, [selected, images, onClose]);

  const handleDelete = useCallback(async () => {
    if (!selected) return;
    try {
      const params = new URLSearchParams({ cardId: selected.cardId });
      if (selected.itemHref) params.set("itemHref", selected.itemHref);
      const res = await fetch(`/api/admin/card-images?${params}`, { method: "DELETE", credentials: "include" });
      const key = makeKey(selected.cardId, selected.itemHref);
      setImages((prev) => { const n = { ...prev }; delete n[key]; return n; });
      if (res.ok) {
        toast.success("Imagen eliminada");
      } else {
        toast.error("Error al eliminar");
      }
    } catch (e) {
      console.error("Delete error:", e);
      toast.error("Error de conexión");
    }
  }, [selected]);

  const updatePosition = (key, field, value) => {
    setImages((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const sel = selected ? images[makeKey(selected.cardId, selected.itemHref)] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Personalizar imágenes del Dashboard</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 p-3 space-y-0.5 overflow-y-auto shrink-0">
            {CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => { toggleExpand(cat.id); selectTarget(cat.id, null, cat.label); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition text-left ${
                    selected?.cardId === cat.id && !selected?.itemHref
                      ? "bg-green-50 text-green-700 font-medium border border-green-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="flex-1">{cat.label}</span>
                  {images[cat.id] && <span className="w-2 h-2 rounded-full bg-green-400" />}
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${expandedCats[cat.id] ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedCats[cat.id] && (
                  <div className="ml-4 pl-3 border-l border-gray-200 space-y-0.5 pb-1">
                    {cat.items.map((item) => {
                      const itemKey = makeKey(cat.id, item.href);
                      return (
                        <button
                          key={item.href}
                          onClick={() => selectTarget(cat.id, item.href, item.label)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition text-left ${
                            selected?.cardId === cat.id && selected?.itemHref === item.href
                              ? "bg-green-50 text-green-700 font-medium border border-green-200"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {images[itemKey] && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selected ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-sm">Selecciona un card o submenú para personalizar su imagen</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-semibold text-gray-900">
                    {selected.itemHref ? `${selected.label}` : `${selected.label}`}
                  </span>
                  {selected.itemHref && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {selected.itemHref}
                    </span>
                  )}
                  {!selected.itemHref && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      Card level
                    </span>
                  )}
                </div>

                {/* Image upload area */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {selected.itemHref ? "Imagen del submenú" : "Imagen del Card"}
                  </h3>
                  <div
                    className={`relative w-full h-40 rounded-xl overflow-hidden cursor-pointer transition ${
                      sel?.imageUrl
                        ? "bg-gray-900"
                        : "bg-gray-100 border-2 border-dashed border-gray-300 hover:border-green-400"
                    }`}
                    onClick={() => fileRef.current?.click()}
                  >
                    {sel?.imageUrl ? (
                      <img
                        src={sel.imageUrl}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          transform: `translate(${sel.offsetX || 0}%, ${sel.offsetY || 0}%) scale(${sel.scale || 1})`,
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">{uploading ? "Subiendo..." : "Click para subir imagen"}</span>
                      </div>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUpload(selected.cardId, e.target.files?.[0], selected.itemHref)}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Recomendado: {selected.itemHref ? "800×500px" : "800×400px"}, formato JPG/PNG, máximo 2MB
                  </p>

                  {sel?.imageUrl && (
                    <PositionSliders
                      data={sel}
                      onChange={(field, value) => updatePosition(makeKey(selected.cardId, selected.itemHref), field, value)}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !sel?.imageUrl}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-40 transition"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  {sel?.imageUrl && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
