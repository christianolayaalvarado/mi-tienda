"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PendingOrdersModal from "@/components/PendingOrdersModal";
import MascotWelcomeModal from "@/components/MascotWelcomeModal";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: "🏠", plan: "free" },
  { href: "/dashboard/products", label: "Productos", icon: "📦", plan: "free" },
  { href: "/dashboard/orders", label: "Mis Órdenes", icon: "🧾", plan: "free" },
  { href: "/dashboard/favorites", label: "Favoritos", icon: "❤️", plan: "free" },
  { href: "/dashboard/seller/orders", label: "Ventas", icon: "💰", plan: "full" },
  { href: "/dashboard/seller/sold-products", label: "Productos vendidos", icon: "📊", plan: "full" },
  { href: "/dashboard/seller/analytics", label: "Visitantes", icon: "🗺️", plan: "full" },
  { href: "/dashboard/seller/marketing", label: "Email Marketing", icon: "📧", plan: "full" },
  { href: "/dashboard/seller/reviews", label: "Reseñas", icon: "⭐", plan: "full" },
  { href: "/dashboard/payment-methods", label: "Formas de pago", icon: "📍", plan: "free" },
  { href: "/dashboard/referrals", label: "Invitar amigos", icon: "🎁", plan: "free" },
  { href: "/spin-wheel", label: "Ruleta", icon: "🎰", plan: "free" },
  { href: "/dashboard/profile/edit", label: "Editar Perfil", icon: "👤", plan: "free" },
  { href: "/dashboard/mascotas", label: "Mascotas", icon: "🎭", plan: "full" },
];

const ADMIN_ITEMS = [
  { href: "/dashboard/admin/orders", label: "Ordenes admin", icon: "🔧" },
  { href: "/dashboard/admin/sellers", label: "Vendedores", icon: "👥" },
  { href: "/dashboard/admin/reports", label: "Reportes", icon: "📋" },
  { href: "/dashboard/admin/analytics", label: "Conversion", icon: "📊" },
  { href: "/dashboard/admin/shipping", label: "Tarifas envio", icon: "🚚" },
  { href: "/dashboard/admin/coupons", label: "Cupones", icon: "🏷️" },
  { href: "/dashboard/admin/marketing", label: "Email Marketing", icon: "📧" },
];

export default function DashboardShell({ children, userName, userEmail, userRole, userPlan }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pathname = usePathname();
  const isAdmin = userRole === "admin" || userRole === "ADMIN";
  const isFull = userPlan === "full" || isAdmin;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.plan === "free") return true;
    if (item.plan === "full" && isFull) return true;
    return false;
  });

  useEffect(() => {
    fetch("/api/seller/pending-count", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPendingCount(d?.pendingCount || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col shrink-0 w-64 bg-gray-900 text-white p-4 h-full overflow-y-auto">
        <div className="mb-3">
          <h2 className="text-xl font-bold">Dashboard</h2>
        </div>

        {userName ? (
          <p className="text-sm mb-1 font-medium break-all">{userName}</p>
        ) : null}
        <p className="text-xs mb-3 text-gray-300 break-all">{userEmail}</p>

        <nav className="flex flex-col gap-0.5 flex-1">
          {visibleItems.map((item) => (
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
              {item.href === "/dashboard/seller/orders" && pendingCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          ))}

          {!isFull && (
            <>
              <div className="border-t border-gray-700 my-1.5" />
              <Link
                href="/upgrade"
                className="px-3 py-2 rounded transition text-sm flex items-center gap-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
              >
                <span>🚀</span>
                <span>Upgrade a Full</span>
              </Link>
            </>
          )}

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

      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white p-4 flex flex-col h-full overflow-y-auto transform transition-transform duration-200 ${
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
          {visibleItems.map((item) => (
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
              {item.href === "/dashboard/seller/orders" && pendingCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          ))}

          {!isFull && (
            <>
              <div className="border-t border-gray-700 my-1.5" />
              <Link
                href="/upgrade"
                onClick={() => setSidebarOpen(false)}
                className="px-3 py-2 rounded transition text-sm flex items-center gap-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
              >
                <span>🚀</span>
                <span>Upgrade a Full</span>
              </Link>
            </>
          )}

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

      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
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

      <PendingOrdersModal />
      <MascotWelcomeModal />
    </div>
  );
}
