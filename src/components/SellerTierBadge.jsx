"use client";

import { getSellerTierInfo } from "@/lib/commissionTiers";

const TIER_COLORS = {
  "Nuevo": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", icon: "🌱" },
  "En crecimiento": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", icon: "📈" },
  "Establecido": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", icon: "👑" },
};

export default function SellerTierBadge({ createdAt, showDetails = false }) {
  if (!createdAt) return null;

  const info = getSellerTierInfo(createdAt);
  const colors = TIER_COLORS[info.currentTier.name] || TIER_COLORS["Nuevo"];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{colors.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-bold ${colors.text}`}>{info.currentTier.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
              {info.commissionPct} comisión
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {info.monthsActive} {info.monthsActive === 1 ? "mes" : "meses"} activo
          </p>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3">
          {/* Benefits */}
          <div>
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Beneficios actuales:</h5>
            <ul className="space-y-1">
              {info.currentTier.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Next tier */}
          {info.nextTier && (
            <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Siguiente nivel</p>
                  <p className="text-sm font-semibold text-gray-700">{info.nextTier.name}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  En {info.monthsToNext} {info.monthsToNext === 1 ? "mes" : "meses"}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-orange-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((3 - info.monthsToNext) / 3) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
