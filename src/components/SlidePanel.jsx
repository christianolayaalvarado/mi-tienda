"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SlidePanel({ open, onClose, category, cardImages = {} }) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setHoveredItem(null);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    setHoveredItem(null);
  }, [category]);

  if (!category) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Detail Panel (left of main panel) */}
      <div
        className={`fixed top-0 h-full w-full sm:w-80 bg-white shadow-2xl z-50 flex flex-col transition-all duration-300 ease-out ${
          open && hoveredItem
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-full opacity-0 pointer-events-none"
        }`}
        style={{ right: "min(24rem, 100vw)" }}
      >
        {hoveredItem && (() => {
          const itemKey = `${category.id}::${hoveredItem.href}`;
          const itemImg = cardImages[itemKey];
          const catImg = cardImages[category.id];
          const activeImg = itemImg || catImg;
          const hasCustom = activeImg?.imageUrl || activeImg?.headerUrl;
          return (
          <>
            {/* Photo area */}
            <div
              className="h-48 sm:h-56 w-full flex items-center justify-center shrink-0 relative overflow-hidden"
              style={{ background: hoveredItem.photoGradient || category.gradient }}
            >
              {hasCustom ? (
                <>
                  <img
                    src={itemImg?.imageUrl || catImg?.headerUrl}
                    alt={hoveredItem.label}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      transform: `translate(${(itemImg?.offsetX || catImg?.headerOffsetX || 0)}%, ${(itemImg?.offsetY || catImg?.headerOffsetY || 0)}%) scale(${itemImg?.scale || catImg?.headerScale || 1})`,
                    }}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.3) 100%)" }} />
                </>
              ) : (
                <>
                  <span className="text-7xl sm:text-8xl drop-shadow-lg relative z-10">
                    {hoveredItem.icon}
                  </span>
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.4)" }} />
                  <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-15" style={{ background: "rgba(255,255,255,0.3)" }} />
                  <div className="absolute top-8 right-12 w-8 h-8 rounded-full opacity-25" style={{ background: "rgba(255,255,255,0.5)" }} />
                </>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-5 overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{hoveredItem.label}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                {hoveredItem.longDescription || hoveredItem.description}
              </p>

              {/* Features list */}
              {hoveredItem.features && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Funciones</p>
                  {hoveredItem.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      <span className="text-xs text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Go button */}
              <Link
                href={hoveredItem.href}
                onClick={onClose}
                className="mt-6 block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
                style={{ background: category.gradient }}
              >
                Ir a {hoveredItem.label}
              </Link>
            </div>
          </>
          );
        })()}
      </div>

      {/* Main Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0 relative overflow-hidden"
          style={{ background: category.gradient }}
        >
          {cardImages[category.id]?.headerUrl ? (
            <>
              <img
                src={cardImages[category.id].headerUrl}
                alt={category.label}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: `translate(${cardImages[category.id].headerOffsetX || 0}%, ${cardImages[category.id].headerOffsetY || 0}%) scale(${cardImages[category.id].headerScale || 1})`,
                }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)" }} />
            </>
          ) : null}
          <div className="relative z-10">
            <span className="text-3xl block mb-1">{category.icon}</span>
            <h2 className="text-lg font-bold text-white">{category.label}</h2>
            <p className="text-xs text-white/80">{category.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition relative z-10"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {category.items.map((item) => (
            <div
              key={item.href}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all group ${
                  pathname === item.href
                    ? "bg-green-50 border-2 border-green-400 shadow-sm"
                    : hoveredItem?.href === item.href
                    ? "bg-gray-100 border-2 border-gray-300"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ background: item.gradient || category.itemGradient }}
                >
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${
                    pathname === item.href ? "text-green-700" : "text-gray-800"
                  }`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 mt-1 shrink-0 transition-transform ${
                    hoveredItem?.href === item.href ? "translate-x-1 text-gray-600" : "text-gray-300"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
