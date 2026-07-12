"use client";

import { useAuthContext } from "@/context/AuthProvider";
import SellerTierBadge from "@/components/SellerTierBadge";
import ThemeSelector from "@/components/ThemeSelector";

export default function DashboardWelcome() {
  const { user } = useAuthContext() || {};

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Tier Badge */}
      {user.role === "SELLER" || user.role === "seller" || user.role === "admin" || user.role === "ADMIN" ? (
        <SellerTierBadge createdAt={user.createdAt} showDetails />
      ) : null}

      {/* Theme Selector */}
      <div className="card-theme rounded-xl border border-theme p-6">
        <ThemeSelector />
      </div>
    </div>
  );
}
