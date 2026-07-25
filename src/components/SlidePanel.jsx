"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SlidePanel({ open, onClose, category }) {
  const panelRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

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

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{ background: category.gradient }}
        >
          <div>
            <span className="text-3xl block mb-1">{category.icon}</span>
            <h2 className="text-lg font-bold text-white">{category.label}</h2>
            <p className="text-xs text-white/80">{category.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
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
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-start gap-3 p-3 rounded-xl transition-all group ${
                pathname === item.href
                  ? "bg-green-50 border-2 border-green-400 shadow-sm"
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
                <p className={`text-sm font-semibold ${pathname === item.href ? "text-green-700" : "text-gray-800"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
              <svg
                className={`w-4 h-4 mt-1 shrink-0 transition-transform group-hover:translate-x-1 ${
                  pathname === item.href ? "text-green-500" : "text-gray-300"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
