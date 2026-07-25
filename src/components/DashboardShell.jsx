"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PendingOrdersModal from "@/components/PendingOrdersModal";
import MascotWelcomeModal from "@/components/MascotWelcomeModal";
import WelcomeBenefits from "@/components/WelcomeBenefits";

export default function DashboardShell({ children, userName, userEmail, userRole, userPlan }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const router = useRouter();
  const isAdmin = userRole === "admin" || userRole === "ADMIN";
  const isFull = userPlan === "full" || isAdmin;

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("mi_tienda_cart");
    localStorage.removeItem("mi_tienda_cart_last_update");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col min-h-0 overflow-x-hidden">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Dashboard</h1>
          {isAdmin && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          )}
          {!isFull && !isAdmin && (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              FREE
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{userName || "Usuario"}</p>
            <p className="text-xs text-gray-500 truncate max-w-[180px]">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-red-600 transition px-2 py-1 rounded hover:bg-red-50"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-auto">
        {children}
      </main>

      <PendingOrdersModal />
      <MascotWelcomeModal />

      {!isFull && !bannerDismissed && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
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
