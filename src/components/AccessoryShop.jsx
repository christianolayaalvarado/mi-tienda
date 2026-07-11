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

export default function AccessoryShop({ onClose }) {
  const { coins, owned, equipped, accessories, buyAccessory, equipAccessory } = useMascotCoins();
  const [activeCategory, setActiveCategory] = useState("all");
  const [message, setMessage] = useState("");

  const filtered = activeCategory === "all"
    ? accessories
    : accessories.filter((a) => a.category === activeCategory);

  const handleBuy = (id) => {
    const result = buyAccessory(id);
    setMessage(result.message);
    setTimeout(() => setMessage(""), 3000);
  };

  const stopProp = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

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
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-[fadeInScale_0.3s_ease-out]"
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
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="text-white/80 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-green-100 text-green-700 text-sm text-center py-2 font-medium shrink-0">
            {message}
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

        {/* Items - scrollable */}
        <div className="p-3 overflow-y-auto flex-1 min-h-0 grid grid-cols-2 gap-2">
          {filtered.map((item) => {
            const isOwned = owned.includes(item.id);
            const isEquipped = equipped[item.category] === item.id;
            const canAfford = coins >= item.price;

            return (
              <div
                key={item.id}
                className={`border rounded-xl p-3 transition-all ${
                  isEquipped
                    ? "border-purple-400 bg-purple-50"
                    : isOwned
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:border-purple-300"
                }`}
              >
                <div className="text-center mb-2">
                  <span className="text-3xl">{item.emoji}</span>
                </div>
                <p className="text-xs font-medium text-center text-gray-800 mb-1">{item.name}</p>
                <p className="text-[10px] text-gray-500 text-center mb-2">🪙 {item.price}</p>

                {isEquipped ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); equipAccessory(item.id); }}
                    className="w-full text-[10px] bg-purple-500 text-white rounded-lg py-1 font-medium"
                  >
                    ✓ Equipado
                  </button>
                ) : isOwned ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); equipAccessory(item.id); }}
                    className="w-full text-[10px] bg-green-500 text-white rounded-lg py-1 font-medium"
                  >
                    Equipar
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBuy(item.id); }}
                    disabled={!canAfford}
                    className={`w-full text-[10px] rounded-lg py-1 font-medium ${
                      canAfford
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {canAfford ? "Comprar" : "Sin monedas"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
