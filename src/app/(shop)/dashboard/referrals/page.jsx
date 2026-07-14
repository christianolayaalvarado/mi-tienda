"use client";

import { useState, useEffect } from "react";

export default function ReferralsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/user/referral")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getShareLink() {
    if (!data?.code) return "";
    return `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.code}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function shareWhatsApp() {
    const link = getShareLink();
    const text = `¡Únete a Mi Tienda! 🛒 Usa mi código ${data?.code} y gana beneficios al registrarte: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.code) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-gray-500 text-center">No se pudo cargar tu código de referido.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Invita amigos</h1>
        <p className="text-gray-500 text-sm mt-1">Comparte tu código y gana recompensas por cada amigo que se registre</p>
      </div>

      {/* Código y link */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Tu código de referido</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-3xl font-mono font-bold text-green-800 tracking-wider">{data.code}</span>
            <button
              onClick={copyLink}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition"
            >
              {copied ? "✓ Copiado" : "Copiar link"}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={shareWhatsApp}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            📱 Compartir por WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="px-4 py-2.5 border border-green-300 text-green-700 font-bold rounded-xl hover:bg-green-100 transition"
          >
            📋 Copiar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{data.referralCount}</p>
          <p className="text-xs text-gray-500 mt-1">Amigos invitados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-500">{data.referralCount * 100}</p>
          <p className="text-xs text-gray-500 mt-1">Monedas ganadas</p>
        </div>
      </div>

      {/* Beneficios */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-gray-900">¿Cómo funciona?</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <p className="text-sm text-gray-600">Comparte tu código con amigos por WhatsApp, redes o en persona</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <p className="text-sm text-gray-600">Tu amigo se registra usando tu código y gana <strong>50 monedas + envío gratis</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <p className="text-sm text-gray-600">Tú ganas <strong>100 monedas</strong> por cada amigo registrado 🎉</p>
          </div>
        </div>
      </div>

      {/* Lista de referidos */}
      {data.referredUsers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Tus referidos</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.referredUsers.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(r.date).toLocaleDateString("es-PE")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
