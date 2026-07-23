"use client";

import { useState, useEffect } from "react";
import SpinWheel from "@/components/SpinWheel";

const PRIZE_TYPES = {
  percentage_discount: { icon: "🏷️", color: "text-green-600" },
  fixed_discount: { icon: "💰", color: "text-blue-600" },
  free_shipping: { icon: "🚚", color: "text-purple-600" },
  no_prize: { icon: "😅", color: "text-gray-500" },
};

export default function SpinWheelPage() {
  const [user, setUser] = useState(null);
  const [canSpin, setCanSpin] = useState(false);
  const [cooldownHours, setCooldownHours] = useState(0);
  const [prizes, setPrizes] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [spinRes, meRes] = await Promise.all([
        fetch("/api/spin-wheel", { credentials: "include" }),
        fetch("/api/users/me", { credentials: "include" }).catch(() => null),
      ]);
      const spinData = await spinRes.json();
      setPrizes(spinData.prizes || []);
      setCanSpin(spinData.canSpin || false);
      setCooldownHours(spinData.cooldownHours || 0);
      if (meRes?.ok) {
        const meData = await meRes.json();
        setUser(meData.user || meData);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSpinResult = async (prizeInfo) => {
    try {
      const res = await fetch("/api/spin-wheel", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.prize) {
        setResult(data.prize);
        fetchData();
      }
    } catch {}
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-green-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <p className="text-2xl mb-3">🎰</p>
          <p className="text-lg font-semibold text-gray-800">Inicia sesion para girar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Ruleta de Premios</h1>
        <p className="text-center text-gray-500 text-sm mb-8">Gira una vez al dia y gana descuentos</p>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando...</div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex justify-center">
              <SpinWheel
                onSpinResult={handleSpinResult}
                canSpin={canSpin}
                spinning={false}
              />
            </div>

            {!canSpin && cooldownHours > 0 && (
              <p className="text-center text-sm text-gray-500 mb-6">
                Puedes girar de nuevo en {cooldownHours}h
              </p>
            )}

            {result && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
                <p className="text-3xl mb-2">{PRIZE_TYPES[result.type]?.icon || "🎁"}</p>
                <p className="text-lg font-bold text-gray-900 mb-1">Ganaste: {result.label}</p>
                {result.type !== "no_prize" && result.code && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Tu codigo:</p>
                    <p className="text-xl font-mono font-bold text-green-600 bg-green-50 px-4 py-2 rounded-lg inline-block">
                      {result.code}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Vence: {new Date(result.expiresAt).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setResult(null)}
                  className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition"
                >
                  Cerrar
                </button>
              </div>
            )}

            {prizes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Tus premios recientes</h2>
                <div className="space-y-2">
                  {prizes.slice(0, 10).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-lg">{PRIZE_TYPES[p.prizeType]?.icon || "?"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">
                          {p.prizeType === "percentage_discount" && `${p.prizeValue}% descuento`}
                          {p.prizeType === "fixed_discount" && `S/.${p.prizeValue} descuento`}
                          {p.prizeType === "free_shipping" && "Envio gratis"}
                          {p.prizeType === "no_prize" && "Sin premio"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString("es-PE")}
                          {p.used ? " · Usado" : p.code ? ` · ${p.code}` : ""}
                        </p>
                      </div>
                      {!p.used && p.code && (
                        <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded">
                          {p.code}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
