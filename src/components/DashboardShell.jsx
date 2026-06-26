"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/products", label: "Productos", icon: "📦" },
  { href: "/dashboard/orders", label: "Mis Órdenes", icon: "🧾" },
  { href: "/dashboard/seller/orders", label: "Ventas", icon: "💰" },
  { href: "/dashboard/seller/reviews", label: "Reseñas", icon: "⭐" },
  { href: "/dashboard/seller/shipping", label: "Envíos", icon: "🚚" },
  { href: "/dashboard/payment-methods", label: "Formas de pago", icon: "📍" },
  { href: "/dashboard/profile/edit", label: "Editar Perfil", icon: "👤" },
];

export default function DashboardShell({ children, userName, userEmail }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-4 flex flex-col justify-between h-full transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Dashboard</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white p-1"
              aria-label="Cerrar menú"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {userName ? (
            <p className="text-sm mb-1 font-medium break-all">{userName}</p>
          ) : null}
          <p className="text-xs mb-4 text-gray-300 break-all">{userEmail}</p>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`px-3 py-2.5 rounded transition text-sm min-h-[44px] flex items-center gap-2 ${
                  pathname === item.href
                    ? "bg-gray-700 text-white font-medium"
                    : "hover:bg-gray-700 text-gray-300"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            <div className="mt-auto pt-4 border-t border-gray-700">
              <LogoutButton />
            </div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
        </div>

        <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
