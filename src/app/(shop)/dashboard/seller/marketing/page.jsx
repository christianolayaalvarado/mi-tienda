"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmailBlockEditor, { generateEmailHTML } from "@/components/EmailBlockEditor";

const DEFAULT_BLOCKS = [
  { id: "welcome1", type: "spacer", height: 20 },
  { id: "welcome2", type: "text", content: "Hola! 👋", align: "center", color: "#16a34a", fontSize: 24, bold: true },
  { id: "welcome3", type: "text", content: "Gracias por visitar nuestra tienda. Tenemos ofertas especiales preparadas solo para ti.", align: "center", color: "#374151", fontSize: 15, bold: false },
  { id: "welcome4", type: "spacer", height: 10 },
  { id: "welcome5", type: "divider", color: "#e5e7eb", thickness: 1, style: "solid" },
  { id: "welcome6", type: "text", content: "🔥 Ofertas de la semana", align: "center", color: "#dc2626", fontSize: 18, bold: true },
  { id: "welcome7", type: "text", content: "No te pierdas nuestros mejores descuentos por tiempo limitado. Haz clic en el boton para ver todas las ofertas.", align: "center", color: "#6b7280", fontSize: 14, bold: false },
  { id: "welcome8", type: "button", label: "Ver ofertas 🔥", url: "#", bgColor: "#16a34a", textColor: "#ffffff", borderRadius: 8 },
  { id: "welcome9", type: "spacer", height: 20 },
];

export default function MarketingPage() {
  const [contacts, setContacts] = useState([]);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [emailWidth, setEmailWidth] = useState(600);
  const [subject, setSubject] = useState("Ofertas imperdibles 🔥 - Mi Tienda");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [storeName, setStoreName] = useState("Mi Tienda");
  const [mode, setMode] = useState("editor");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [sendTarget, setSendTarget] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/product-viewers?days=90", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()).catch(() => null),
    ])
      .then(([viewData, userData]) => {
        setContacts(viewData.contacts || []);
        setContactCount(viewData.contactCount || 0);
        if (userData?.storeName) setStoreName(userData.storeName);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sendCampaign = async () => {
    if (!subject.trim() || blocks.length === 0) return;
    setSending(true);
    setResult(null);
    try {
      const html = generateEmailHTML(blocks, emailWidth, storeName);
      const body = { subject, html };
      if (sendTarget === "selected" && selectedEmails.length > 0) {
        body.targetEmails = selectedEmails;
      }
      const res = await fetch("/api/seller/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Error de red" });
    }
    setSending(false);
  };

  const toggleEmail = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const toggleAll = () => {
    if (selectedEmails.length === contacts.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(contacts.map((c) => c.email).filter(Boolean));
    }
  };

  const targetCount = sendTarget === "selected" ? selectedEmails.length : Math.min(contactCount, 100);

  const exportHTML = () => {
    const html = generateEmailHTML(blocks, emailWidth, storeName);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-email.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Email Marketing</h1>
          <p className="text-sm text-gray-500">Disena y envia campañas a tus visitantes</p>
        </div>
        <Link href="/dashboard" className="text-sm text-green-600 hover:underline">← Dashboard</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Contactos</p>
          <p className="text-xl font-bold text-green-600">{contactCount}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Bloques</p>
          <p className="text-xl font-bold text-blue-600">{blocks.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Ancho</p>
          <p className="text-xl font-bold text-purple-600">{emailWidth}px</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Limite Gmail</p>
          <p className="text-xl font-bold text-gray-400">500/dia</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setMode("editor")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "editor" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          🎨 Editor visual
        </button>
        <button onClick={() => setMode("html")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${mode === "html" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          {"</>"} HTML directo
        </button>
      </div>

      {mode === "editor" ? (
        <>
          {/* Subject */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Asunto del correo</label>
            <input
              type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Asunto del email..."
            />
          </div>

          {/* Block editor */}
          <EmailBlockEditor
            blocks={blocks}
            onChange={setBlocks}
            width={emailWidth}
            onWidthChange={setEmailWidth}
            storeName={storeName}
          />
        </>
      ) : (
        /* HTML mode */
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Asunto</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">HTML del correo</label>
            <textarea
              value={generateEmailHTML(blocks, emailWidth, storeName)}
              readOnly
              rows={20}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono bg-gray-50"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={sendCampaign}
          disabled={sending || !subject.trim() || blocks.length === 0 || targetCount === 0}
          className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {sending ? "Enviando..." : `Enviar a ${targetCount} contactos`}
        </button>
        <button
          onClick={exportHTML}
          className="px-4 py-2.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition"
        >
          📥 Descargar HTML
        </button>
        <a
          href={"/api/seller/product-viewers?days=90&export=csv"}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
        >
          📋 Exportar CSV para Mailchimp
        </a>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-4 mt-4 ${result.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
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

      {/* Contact selector */}
      {contacts.length > 0 && (
        <div className="mt-6">
          {/* Target selector */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Enviar a:</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSendTarget("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sendTarget === "all" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Todos ({contactCount})
              </button>
              <button
                onClick={() => setSendTarget("selected")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  sendTarget === "selected" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Seleccionados ({selectedEmails.length})
              </button>
            </div>
            {sendTarget === "selected" && selectedEmails.length > 0 && (
              <button onClick={() => setSelectedEmails([])} className="text-xs text-red-500 hover:text-red-700">
                Limpiar seleccion
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={selectedEmails.length === contacts.length && contacts.length > 0}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Email</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Ciudad</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Visitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contacts.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedEmails.includes(c.email)}
                          onChange={() => toggleEmail(c.email)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-800">{c.email}</td>
                      <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{c.city || "—"}</td>
                      <td className="px-4 py-2 text-right font-medium text-green-700">{c.viewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
