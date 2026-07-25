"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import PendingOrdersModal from "@/components/PendingOrdersModal";
import MascotWelcomeModal from "@/components/MascotWelcomeModal";
import WelcomeBenefits from "@/components/WelcomeBenefits";

const MENU_CATEGORIES = [
  {
    id: "nav",
    label: "Navegación",
    icon: "📌",
    plan: "free",
    items: [
      { href: "/dashboard", label: "Inicio", icon: "🏠" },
      { href: "/dashboard/favorites", label: "Favoritos", icon: "❤️" },
    ],
  },
  {
    id: "tienda",
    label: "Tienda",
    icon: "🛍️",
    plan: "free",
    items: [
      { href: "/dashboard/products", label: "Productos", icon: "📦" },
      { href: "/dashboard/orders", label: "Mis Órdenes", icon: "🧾" },
      { href: "/dashboard/seller/reviews", label: "Reseñas", icon: "⭐", plan: "full" },
    ],
  },
  {
    id: "ventas",
    label: "Ventas",
    icon: "💰",
    plan: "full",
    items: [
      { href: "/dashboard/seller/orders", label: "Ventas", icon: "💰", badge: "pendingCount" },
      { href: "/dashboard/seller/sold-products", label: "Productos vendidos", icon: "📊" },
      { href: "/dashboard/seller/analytics", label: "Visitantes", icon: "🗺️" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: "📧",
    plan: "full",
    items: [
      { href: "/dashboard/seller/marketing", label: "Email Marketing", icon: "📧" },
    ],
  },
  {
    id: "engagement",
    label: "Engagement",
    icon: "🎮",
    plan: "free",
    items: [
      { href: "/spin-wheel", label: "Ruleta", icon: "🎰" },
      { href: "/dashboard/referrals", label: "Invitar amigos", icon: "🎁" },
      { href: "/dashboard/mascotas", label: "Mascotas", icon: "🎭", plan: "full" },
    ],
  },
  {
    id: "cuenta",
    label: "Mi Cuenta",
    icon: "👤",
    plan: "free",
    items: [
      { href: "/dashboard/profile/edit", label: "Editar Perfil", icon: "👤" },
      { href: "/dashboard/payment-methods", label: "Formas de pago", icon: "📍" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: "🔧",
    adminOnly: true,
    items: [
      { href: "/dashboard/admin/orders", label: "Órdenes", icon: "🔧" },
      { href: "/dashboard/admin/sellers", label: "Vendedores", icon: "👥" },
      { href: "/dashboard/admin/plans", label: "Planes", icon: "💳" },
      { href: "/dashboard/admin/reports", label: "Reportes", icon: "📋" },
      { href: "/dashboard/admin/analytics", label: "Conversión", icon: "📊" },
      { href: "/dashboard/admin/shipping", label: "Tarifas envío", icon: "🚚" },
      { href: "/dashboard/admin/coupons", label: "Cupones", icon: "🏷️" },
      { href: "/dashboard/admin/marketing", label: "Email Marketing", icon: "📧" },
    ],
  },
];

function getCategoryForPath(pathname) {
  for (const cat of MENU_CATEGORIES) {
    if (cat.items.some((i) => i.href === pathname)) return cat.id;
  }
  return null;
}

function SidebarNav({ pathname, expandedCategories, toggleCategory, pendingCount, isFull, isAdmin, onClickLink }) {
  const visibleCategories = useMemo(() => {
    return MENU_CATEGORIES.filter((cat) => {
      if (cat.adminOnly && !isAdmin) return false;
      if (cat.plan === "full" && !isFull) return false;
      return true;
    });
  }, [isFull, isAdmin]);

  return (
    <nav className="flex flex-col gap-0.5 flex-1">
      {visibleCategories.map((cat) => {
        const isExpanded = expandedCategories.includes(cat.id);
        const hasActive = cat.items.some((i) => i.href === pathname);
        const visibleItems = cat.items.filter(
          (i) => !i.plan || i.plan === "free" || isFull
        );

        return (
          <div key={cat.id}>
            <button
              onClick={() => toggleCategory(cat.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                hasActive
                  ? "text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              <span>{cat.icon}</span>
              <span className="flex-1 text-left">{cat.label}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-90" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {isExpanded && (
              <div className="ml-3 border-l border-gray-700 pl-2 mt-0.5 space-y-0.5">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClickLink}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
                      pathname === item.href
                        ? "bg-gray-700 text-white font-medium"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {item.badge === "pendingCount" && pendingCount > 0 && (
                      <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold">
                        {pendingCount > 99 ? "99+" : pendingCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {!isFull && (
        <>
          <div className="border-t border-gray-700 my-1.5" />
          <Link
            href="/upgrade"
            onClick={onClickLink}
            className="px-3 py-2 rounded transition text-sm flex items-center gap-2 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
          >
            <span>🚀</span>
            <span>Upgrade a Full</span>
          </Link>
        </>
      )}
    </nav>
  );
}

export default function DashboardShell({ children, userName, userEmail, userRole, userPlan }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = userRole === "admin" || userRole === "ADMIN";
  const isFull = userPlan === "full" || isAdmin;

  const [expandedCategories, setExpandedCategories] = useState(() => {
    const active = getCategoryForPath(pathname);
    return active ? [active] : ["nav"];
  });

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    );
  };

  useEffect(() => {
    const active = getCategoryForPath(pathname);
    if (active && !expandedCategories.includes(active)) {
      setExpandedCategories((prev) => [...prev, active]);
    }
  }, [pathname]);

  useEffect(() => {
    fetch("/api/seller/pending-count", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPendingCount(d?.pendingCount || 0))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-full overflow-hidden">
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

        <SidebarNav
          pathname={pathname}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          pendingCount={pendingCount}
          isFull={isFull}
          isAdmin={isAdmin}
        />
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

        <SidebarNav
          pathname={pathname}
          expandedCategories={expandedCategories}
          toggleCategory={toggleCategory}
          pendingCount={pendingCount}
          isFull={isFull}
          isAdmin={isAdmin}
          onClickLink={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-x-hidden">
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

      {!isFull && !bannerDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg md:ml-64">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">🚀</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Desbloquea tu tienda Full</p>
              <p className="text-xs text-blue-100 truncate">Crea tu tienda, email marketing, analytics y mas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-3 sm:px-4 py-2 bg-white text-blue-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-50 transition whitespace-nowrap"
            >
              Ver beneficios
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 text-blue-200 hover:text-white transition"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <WelcomeBenefits
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          router.push("/upgrade");
        }}
        userName={userName}
      />
    </div>
  );
}
