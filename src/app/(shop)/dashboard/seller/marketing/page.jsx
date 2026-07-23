"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const TEMPLATES = [
  {
    id: "welcome",
    name: "Bienvenida",
    subject: "Bienvenido a Mi Tienda - Ofertas exclusivas",
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#16a34a">Bienvenido! 🎉</h2>
  <p>Gracias por visitar nuestra tienda. Tenemos ofertas especiales para ti.</p>
  <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0">
    <p style="margin:0;font-weight:bold;color:#16a34a">Usa el codigo BIENVENIDO10 por 10% de descuento</p>
  </div>
  <a href="#" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Ver ofertas</a>
</div>`,
  },
  {
    id: "promo",
    name: "Promocion",
    subject: "Ofertas imperdibles 🔥 - Mi Tienda",
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#dc2626">Ofertas de la semana 🔥</h2>
  <p>No te pierdas nuestras mejores ofertas por tiempo limitado.</p>
  <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #fecaca">
    <p style="margin:0;font-weight:bold;color:#dc2626">Hasta 30% de descuento en productos seleccionados</p>
  </div>
  <a href="#" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Comprar ahora</a>
</div>`,
  },
  {
    id: "reminder",
    name: "Recordatorio",
    subject: "Te estuvimos extrañando 💚 - Mi Tienda",
    body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#16a34a">Hola de nuevo! 💚</h2>
  <p>Hace tiempo que no nos visitas. Preparamos ofertas especiales solo para ti.</p>
  <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0">
    <p style="margin:0;font-weight:bold;color:#16a34a">Codigo REGRESA15 por 15% de descuento</p>
  </div>
  <a href="#" style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Volver a la tienda</a>
</div>`,
  },
  {
    id: "custom",
    name: "Personalizado",
    subject: "",
    body: "",
  },
];

export default function MarketingPage() {
  const [contacts, setContacts] = useState([]);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState("welcome");
  const [subject, setSubject] = useState(TEMPLATES[0].subject);
  const [body, setBody] = useState(TEMPLATES[0].body);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch("/api/seller/product-viewers?days=90", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setContacts(d.contacts || []);
        setContactCount(d.contactCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectTemplate = (id) => {
    setTemplate(id);
    const t = TEMPLATES.find((t) => t.id === id);
    if (t) {
      setSubject(t.subject);
      setBody(t.body);
    }
  };

  const sendCampaign = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/seller/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subject, html: body }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Error de red" });
    }
    setSending(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Email Marketing</h1>
          <p className="text-sm text-gray-500">Envia campañas a tus visitantes</p>
        </div>
        <Link href="/dashboard" className="text-sm text-green-600 hover:underline">← Dashboard</Link>
      </div>

      {/* Contact stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Contactos con email</p>
          <p className="text-2xl font-bold text-green-600">{contactCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Limite Gmail</p>
          <p className="text-2xl font-bold text-gray-400">500/dia</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Enviables (max 100)</p>
          <p className="text-2xl font-bold text-blue-600">{Math.min(contactCount, 100)}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando contactos...</div>
      ) : contactCount === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg mb-2">Sin contactos todavia</p>
          <p className="text-gray-400 text-sm">Los emails se capturan cuando visitantes logueados ven tus productos</p>
          <Link href="/dashboard/seller/analytics" className="mt-4 inline-block text-sm text-green-600 hover:underline">Ver visitantes →</Link>
        </div>
      ) : (
        <>
          {/* Templates */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Plantilla</h2>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    template === t.id ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Asunto del email..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo (HTML)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="<h1>Hola!</h1>..."
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={sendCampaign}
                disabled={sending || !subject.trim() || !body.trim()}
                className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {sending ? "Enviando..." : `Enviar a ${Math.min(contactCount, 100)} contactos`}
              </button>
              <a
                href={"/api/seller/product-viewers?days=90&export=csv"}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Exportar CSV para Mailchimp
              </a>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 mb-6 ${result.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
              {result.error ? (
                <p className="text-sm text-red-700">{result.error}</p>
              ) : (
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Campana enviada</p>
                  <p className="text-sm text-green-600">{result.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Preview contacts */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Contactos ({contacts.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Ciudad</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Visitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contacts.slice(0, 50).map((c, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-gray-800">{c.email}</td>
                        <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{c.city || "—"}</td>
                        <td className="px-4 py-2 text-right font-medium text-green-700">{c.viewCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {contacts.length > 50 && (
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                  Mostrando 50 de {contacts.length} contactos
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
