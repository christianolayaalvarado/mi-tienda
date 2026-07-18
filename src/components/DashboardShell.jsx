"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: "🏠" },
  { href: "/dashboard/products", label: "Productos", icon: "📦" },
  { href: "/dashboard/orders", label: "Mis Órdenes", icon: "🧾" },
  { href: "/dashboard/favorites", label: "Favoritos", icon: "❤️" },
  { href: "/dashboard/seller/orders", label: "Ventas", icon: "💰" },
  { href: "/dashboard/seller/reviews", label: "Reseñas", icon: "⭐" },
  { href: "/dashboard/seller/shipping", label: "Envíos", icon: "🚚" },
  { href: "/dashboard/payment-methods", label: "Formas de pago", icon: "📍" },
  { href: "/dashboard/referrals", label: "Invitar amigos", icon: "🎁" },
  { href: "/dashboard/profile/edit", label: "Editar Perfil", icon: "👤" },
  { href: "/dashboard/mascotas", label: "Mascotas", icon: "🎭" },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/admin/orders", label: "Órdenes admin", icon: "🔧" },
  { href: "/dashboard/admin/marketing", label: "Email Marketing", icon: "📧" },
];

export default function DashboardShell({ children, userName, userEmail, userRole }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = userRole === "admin" || userRole === "ADMIN";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col shrink-0 w-64 bg-gray-900 text-white p-4 h-full">
        <div className="mb-3">
          <h2 className="text-xl font-bold">Dashboard</h2>
        </div>

        {userName ? (
          <p className="text-sm mb-1 font-medium break-all">{userName}</p>
        ) : null}
        <p className="text-xs mb-3 text-gray-300 break-all">{userEmail}</p>

        <nav className="flex flex-col gap-0.5 flex-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded transition text-sm flex items-center gap-2 ${
                pathname === item.href
                  ? "bg-gray-700 text-white font-medium"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="border-t border-gray-700 my-1.5" />
              <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Admin</p>
              {ADMIN_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded transition text-sm flex items-center gap-2 ${
                    pathname === item.href
                      ? "bg-gray-700 text-white font-medium"
                      : "hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="pt-3 border-t border-gray-700">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-4 flex flex-col h-full transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Dashboard</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white p-1"
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
        <p className="text-xs mb-3 text-gray-300 break-all">{userEmail}</p>

        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`px-3 py-2 rounded transition text-sm flex items-center gap-2 ${
                pathname === item.href
                  ? "bg-gray-700 text-white font-medium"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="border-t border-gray-700 my-1.5" />
              <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Admin</p>
              {ADMIN_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`px-3 py-2 rounded transition text-sm flex items-center gap-2 ${
                    pathname === item.href
                      ? "bg-gray-700 text-white font-medium"
                      : "hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="shrink-0 pt-3 border-t border-gray-700">
          <LogoutButton />
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

        <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
