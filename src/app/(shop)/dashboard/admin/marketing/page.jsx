"use client";

import { useState } from "react";

const SEASONS = [
  { value: "black-friday", label: "🖤 Black Friday" },
  { value: "navidad", label: "🎄 Navidad" },
  { value: "verano", label: "☀️ Verano" },
  { value: "san-valentin", label: "💕 San Valentín" },
  { value: "dia-madre", label: "💐 Día de la Madre" },
  { value: "cyber-monday", label: "💻 Cyber Monday" },
  { value: "inicio-ano", label: "🎉 Inicio de Año" },
];

export default function MarketingPage() {
  const [loading, setLoading] = useState(null);
  const [result, setResult] = useState(null);
  const [season, setSeason] = useState("navidad");

  async function sendCampaign(type, extra = {}) {
    setLoading(type);
    setResult(null);
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...extra }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: "Error de red" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
        <p className="text-gray-500 text-sm mt-1">Envía campañas de email a tus usuarios</p>
      </div>

      {result && (
        <div className={`p-4 rounded-xl text-sm ${result.error ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <div>
              <p className="font-bold">✓ Campaña enviada</p>
              <p className="mt-1">
                {result.sent} emails enviados de {result.total}
                {result.errors > 0 && ` (${result.errors} errores)`}
              </p>
              {result.productsCount && <p>Productos con descuento: {result.productsCount}</p>}
              {result.season && <p>Temporada: {result.season}</p>}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {/* Te extrañamos */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">💚 "Te extrañamos"</h3>
            <p className="text-xs text-gray-500 mt-1">Envía un email a usuarios que no se han logueado en más de 30 días</p>
          </div>
          <button
            onClick={() => sendCampaign("we-miss-you")}
            disabled={loading === "we-miss-you"}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition"
          >
            {loading === "we-miss-you" ? "Enviando..." : "Enviar ahora"}
          </button>
        </div>

        {/* Ofertas semanales */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">🔥 Ofertas de la semana</h3>
            <p className="text-xs text-gray-500 mt-1">Envía los productos con mayor descuento a todos los usuarios</p>
          </div>
          <button
            onClick={() => sendCampaign("weekly-offers")}
            disabled={loading === "weekly-offers"}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition"
          >
            {loading === "weekly-offers" ? "Enviando..." : "Enviar ahora"}
          </button>
        </div>

        {/* Email estacional */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">🎉 Email de temporada</h3>
            <p className="text-xs text-gray-500 mt-1">Envía una campaña temática según la temporada del año</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
            >
              {SEASONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={() => sendCampaign("seasonal", { season })}
              disabled={loading === "seasonal"}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition"
            >
              {loading === "seasonal" ? "Enviando..." : "Enviar ahora"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
