"use client";

import { useState, useEffect } from "react";

export default function PriceDropNotification() {
  const [drops, setDrops] = useState([]);
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try {
      const raw = localStorage.getItem("dismissedPriceDrops");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetch("/api/price-history?recent=true", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const fresh = (d.drops || []).filter((drop) => !dismissed.includes(drop.id));
        if (fresh.length > 0) {
          setDrops(fresh);
          setShow(true);
        }
      })
      .catch(() => {});
  }, [dismissed]);

  const dismiss = (id) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem("dismissedPriceDrops", JSON.stringify(newDismissed));

    if (current < drops.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setShow(false);
      setCurrent(0);
    }
  };

  const dismissAll = () => {
    const allIds = drops.map((d) => d.id);
    const newDismissed = [...dismissed, ...allIds];
    localStorage.setItem("dismissedPriceDrops", JSON.stringify(newDismissed));
    setShow(false);
    setCurrent(0);
  };

  if (!show || drops.length === 0) return null;

  const drop = drops[current];
  const savings = drop.oldPrice - drop.newPrice;
  const pct = Math.round((savings / drop.oldPrice) * 100);
  const product = drop.product;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeInScale_0.3s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-orange-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-white font-bold text-lg">¡Bajó de precio!</span>
          </div>
          <button
            onClick={dismissAll}
            className="text-white/80 hover:text-white text-sm underline"
          >
            Cerrar todo
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex gap-4">
            {product?.images?.[0] && (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-20 h-20 object-cover rounded-xl border"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 text-sm truncate">
                {product?.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {product?.store?.name}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-gray-400 line-through text-sm">
                  S/ {drop.oldPrice.toFixed(2)}
                </span>
                <span className="text-green-600 font-bold text-lg">
                  S/ {drop.newPrice.toFixed(2)}
                </span>
              </div>
              <span className="inline-block mt-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                -{pct}% • Ahorras S/ {savings.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Progress dots */}
          {drops.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {drops.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "bg-orange-500 w-4" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => dismiss(drop.id)}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
            >
              {current < drops.length - 1 ? "Siguiente" : "Ver ahora"}
            </button>
            <button
              onClick={() => dismiss(drop.id)}
              className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
