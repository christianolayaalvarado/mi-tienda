"use client";

export default function FeaturedBadge({ plan }) {
  const config = {
    basic: { label: "Destacado", color: "bg-blue-500", icon: "⭐" },
    boost: { label: "Boost", color: "bg-purple-500", icon: "🚀" },
    premium: { label: "Premium", color: "bg-amber-500", icon: "👑" },
  };
  const c = config[plan] || config.basic;
  return (
    <span className={`${c.color} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow`}>
      {c.icon} {c.label}
    </span>
  );
}
