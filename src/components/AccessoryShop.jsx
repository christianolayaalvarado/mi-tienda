"use client";

import { useState, useCallback } from "react";
import useMascotCoins from "@/hooks/useMascotCoins";

const CATEGORIES = [
  { id: "all", label: "Todos", emoji: "🎨" },
  { id: "hat", label: "Sombreros", emoji: "🎩" },
  { id: "glasses", label: "Lentes", emoji: "👓" },
  { id: "scarf", label: "Bufandas", emoji: "🧣" },
  { id: "wings", label: "Alas", emoji: "🪽" },
  { id: "effect", label: "Efectos", emoji: "✨" },
];

const CATEGORY_COLORS = {
  hat: "from-yellow-400 to-amber-500",
  glasses: "from-blue-400 to-cyan-500",
  scarf: "from-red-400 to-pink-500",
  wings: "from-purple-400 to-violet-500",
  effect: "from-green-400 to-emerald-500",
};

export default function AccessoryShop({ onClose }) {
  const { coins, owned, equipped, accessories, buyAccessory, equipAccessory, lastBonusMsg } = useMascotCoins();
  const [activeCategory, setActiveCategory] = useState("all");
  const [message, setMessage] = useState("");
  const [buyingId, setBuyingId] = useState(null);

  const filtered = activeCategory === "all"
    ? accessories
    : accessories.filter((a) => a.category === activeCategory);

  const handleBuy = (id) => {
    setBuyingId(id);
    const result = buyAccessory(id);
    setMessage(result.success ? result.message : result.message);
    setTimeout(() => { setMessage(""); setBuyingId(null); }, 2500);
  };

  const handleEquip = (id) => {
    equipAccessory(id);
    const acc = accessories.find((a) => a.id === id);
    const isEquippedNow = equipped[acc?.category] === id;
    setMessage(isEquippedNow ? `Quitaste ${acc.name}` : `¡Equipaste ${acc.name}!`);
    setTimeout(() => setMessage(""), 2000);
  };

  const stopProp = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const equippedCount = Object.keys(equipped).length;
  const hasCombo = equippedCount >= 3;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
      onMouseDown={stopProp}
      onMouseUp={stopProp}
      onTouchStart={stopProp}
      onTouchEnd={stopProp}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col animate-[fadeInScale_0.3s_ease-out]"
        onClick={stopProp}
        onMouseDown={stopProp}
        onMouseUp={stopProp}
        onTouchStart={stopProp}
        onTouchEnd={stopProp}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">🛍️ Tienda de Accesorios</h2>
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                🪙 {coins}
              </span>
              {hasCombo && (
                <span className="bg-yellow-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  🔥 COMBO x3
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="text-white/80 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
          </div>
          <p className="text-white/70 text-[11px] mt-1">
            Los accesorios dan bonificaciones reales
          </p>
        </div>

        {/* Messages */}
        {(message || lastBonusMsg) && (
          <div className={`${message.includes("¡") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"} text-sm text-center py-2 font-medium shrink-0 animate-[fadeInScale_0.2s_ease-out]`}>
            {message || lastBonusMsg}
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-1 p-2 border-b overflow-x-auto shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={(e) => { e.stopPropagation(); setActiveCategory(cat.id); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="p-3 overflow-y-auto flex-1 min-h-0 grid grid-cols-2 gap-2">
          {filtered.map((item) => {
            const isOwned = owned.includes(item.id);
            const isEquippedNow = equipped[item.category] === item.id;
            const canAfford = coins >= item.price;

            return (
              <div
                key={item.id}
                className={`border rounded-xl p-3 transition-all ${
                  isEquippedNow
                    ? "border-purple-400 bg-purple-50 shadow-md"
                    : isOwned
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:border-purple-300"
                }`}
              >
                {/* Icon */}
                <div className="text-center mb-1">
                  <span className="text-3xl">{item.emoji}</span>
                </div>

                {/* Name */}
                <p className="text-xs font-bold text-center text-gray-800 mb-0.5">{item.name}</p>

                {/* Price */}
                <p className="text-[10px] text-gray-500 text-center mb-1">🪙 {item.price}</p>

                {/* Bonus description */}
                <div className={`text-[9px] text-center mb-2 px-1 py-1 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[item.category]} text-white font-medium`}>
                  {item.bonus}
                </div>

                {/* Status badge */}
                {isEquippedNow && (
                  <div className="text-[9px] text-center text-purple-600 font-bold mb-1">
                    ✓ EQUIPADO
                  </div>
                )}

                {/* Action button */}
                {isEquippedNow ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEquip(item.id); }}
                    className="w-full text-[10px] bg-gray-400 text-white rounded-lg py-1.5 font-medium hover:bg-gray-500"
                  >
                    Quitar
                  </button>
                ) : isOwned ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEquip(item.id); }}
                    className="w-full text-[10px] bg-green-500 text-white rounded-lg py-1.5 font-medium hover:bg-green-600"
                  >
                    Equipar
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBuy(item.id); }}
                    disabled={!canAfford || buyingId === item.id}
                    className={`w-full text-[10px] rounded-lg py-1.5 font-medium transition-all ${
                      buyingId === item.id
                        ? "bg-yellow-400 text-yellow-900"
                        : canAfford
                          ? "bg-purple-500 text-white hover:bg-purple-600 active:scale-95"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {buyingId === item.id ? "¡Comprado!" : canAfford ? "Comprar" : `Faltan ${item.price - coins} 🪙`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="p-2 text-center text-[10px] text-gray-400 border-t shrink-0">
          Equipa 3+ accesorios para activar el combo 🔥
        </div>
      </div>
    </div>
  );
}
