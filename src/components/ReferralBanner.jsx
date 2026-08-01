"use client";

import { useState, useEffect } from "react";

export default function ReferralBanner() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function copyLink() {
    if (!data?.referralLink) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = data.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 h-48" />
    );
  }

  if (!data?.sellerCode) return null;

  return (
    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">Invita amigos y gana S/10 por cada uno</h3>
          <p className="text-green-100 text-sm mt-1">Comparte tu enlace y obtén recompensas</p>
        </div>
        <span className="text-3xl">🎁</span>
      </div>

      <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 mb-4">
        <p className="text-xs text-green-100 uppercase tracking-wide mb-1">Tu código</p>
        <p className="text-2xl font-mono font-bold tracking-wider">{data.sellerCode}</p>
      </div>

      <button
        onClick={copyLink}
        className="w-full py-2.5 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition text-sm"
      >
        {copied ? "✓ Copiado" : "Copiar enlace de referido"}
      </button>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{data.referralCount}</p>
          <p className="text-xs text-green-100">Referidos</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">S/{data.rewards}</p>
          <p className="text-xs text-green-100">Ganado</p>
        </div>
      </div>
    </div>
  );
}
