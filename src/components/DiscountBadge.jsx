"use client";

/**
 * DiscountBadge — Muestra badge de descuento con precio original tachado
 * 
 * Props:
 * - originalPrice: precio original
 * - discountPct: porcentaje de descuento
 * - price: precio actual
 * - size: "sm" | "md" | "lg"
 */
export default function DiscountBadge({ originalPrice, discountPct, price, size = "md" }) {
  if (!originalPrice || !price || originalPrice <= price) return null;

  const pct = discountPct || Math.round(((originalPrice - price) / originalPrice) * 100);
  const savings = originalPrice - price;

  const sizes = {
    sm: { badge: "text-xs px-1.5 py-0.5", price: "text-xs" },
    md: { badge: "text-sm px-2 py-1", price: "text-sm" },
    lg: { badge: "text-base px-3 py-1.5", price: "text-base" },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Badge de descuento */}
      <span className={`inline-flex items-center font-bold text-white bg-red-500 rounded-full ${s.badge}`}>
        -{pct}%
      </span>

      {/* Precio original tachado */}
      <span className={`text-gray-400 line-through ${s.price}`}>
        S/ {originalPrice.toFixed(2)}
      </span>

      {/* Ahorro */}
      {size !== "sm" && (
        <span className="text-xs text-green-600 font-medium">
          Ahorras S/ {savings.toFixed(2)}
        </span>
      )}
    </div>
  );
}
