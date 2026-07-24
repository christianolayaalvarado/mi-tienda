"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import EmailBlockEditor, { generateEmailHTML } from "@/components/EmailBlockEditor";

const DEFAULT_BLOCKS = [
  { id: "w1", type: "spacer", height: 20 },
  { id: "w2", type: "text", content: "Hola! 👋", align: "center", color: "#16a34a", fontSize: 24, bold: true },
  { id: "w3", type: "text", content: "Gracias por visitar nuestra tienda. Tenemos ofertas especiales preparadas solo para ti.", align: "center", color: "#374151", fontSize: 15, bold: false },
  { id: "w4", type: "spacer", height: 10 },
  { id: "w5", type: "divider", color: "#e5e7eb", thickness: 1, style: "solid" },
  { id: "w6", type: "text", content: "🔥 Ofertas de la semana", align: "center", color: "#dc2626", fontSize: 18, bold: true },
  { id: "w7", type: "text", content: "No te pierdas nuestros mejores descuentos por tiempo limitado.", align: "center", color: "#6b7280", fontSize: 14, bold: false },
  { id: "w8", type: "button", label: "Ver ofertas 🔥", url: "#", bgColor: "#16a34a", textColor: "#ffffff", borderRadius: 8 },
  { id: "w9", type: "spacer", height: 20 },
];

const SEASONS = [
  { id: "navidad", label: "Navidad", icon: "🎄" },
  { id: "black-friday", label: "Black Friday", icon: "🖤" },
  { id: "verano", label: "Verano", icon: "☀️" },
  { id: "san-valentin", label: "San Valentin", icon: "💝" },
  { id: "dia-madre", label: "Dia de la Madre", icon: "👩" },
  { id: "cyber-monday", label: "Cyber Monday", icon: "💻" },
  { id: "inicio-ano", label: "Inicio de Ano", icon: "🎉" },
];

function PreviewModal({ blocks, width, storeName, onClose }) {
  const html = generateEmailHTML(blocks, width, storeName);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-800">Vista previa del email</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div dangerouslySetInnerHTML={{ __html: html }} className="mx-auto" style={{ maxWidth: width }} />
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">Cerrar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CampaignHistory({ campaigns }) {
  if (!campaigns || campaigns.length === 0) return null;
  const statusColors = {
    sent: "bg-green-100 text-green-700",
    scheduled: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };
  const statusLabels = { sent: "Enviada", scheduled: "Programada", failed: "Fallida" };
  const templateLabels = {
    "we-miss-you": "Te extrañamos",
    "weekly-offers": "Ofertas semana",
    seasonal: "Temporada",
    custom: "Personalizada",
  };
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Historial de campañas</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Fecha</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Asunto</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600 hidden sm:table-cell">Tipo</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Destinatarios</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Enviados</th>
                <th className="px-4 py-2 text-center font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                    {new Date(c.sentAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-2 text-gray-800 max-w-[200px] truncate">{c.subject}</td>
                  <td className="px-4 py-2 text-gray-500 hidden sm:table-cell">{templateLabels[c.templateType] || c.templateType}</td>
                  <td className="px-4 py-2 text-right font-medium">{c.recipientCount}</td>
                  <td className="px-4 py-2 text-right font-medium text-green-700">{c.sentCount}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || "bg-gray-100 text-gray-600"}`}>
                      {statusLabels[c.status] || c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ContactFilters({ contacts, onFiltered }) {
  const [city, setCity] = useState("");
  const [minVisits, setMinVisits] = useState(0);
  const [dateRange, setDateRange] = useState("all");

  const cities = useMemo(() => {
    const set = new Set(contacts.map((c) => c.city).filter(Boolean));
    return Array.from(set).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (city && c.city !== city) return false;
      if (minVisits > 0 && c.viewCount < minVisits) return false;
      if (dateRange !== "all") {
        const days = parseInt(dateRange, 10);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        if (new Date(c.lastVisit) < cutoff) return false;
      }
      return true;
    });
  }, [contacts, city, minVisits, dateRange]);

  useEffect(() => {
    onFiltered(filtered);
  }, [filtered]);

  return (
    <div className="flex flex-wrap gap-3 mb-3">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Ciudad</label>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
          <option value="">Todas ({contacts.length})</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Min. visitas</label>
        <input type="number" min={0} value={minVisits} onChange={(e) => setMinVisits(Number(e.target.value))} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 w-20" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Ultima visita</label>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1.5">
          <option value="all">Todas</option>
          <option value="7">Ultimos 7 dias</option>
          <option value="30">Ultimos 30 dias</option>
          <option value="90">Ultimos 90 dias</option>
        </select>
      </div>
    </div>
  );
}

function MarketingInner() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
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
  const [showPreview, setShowPreview] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("10:00");
  const [campaigns, setCampaigns] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [quickSending, setQuickSending] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/product-viewers?days=90", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()).catch(() => null),
      fetch("/api/seller/marketing?limit=20", { credentials: "include" }).then((r) => r.json()).catch(() => ({ campaigns: [] })),
    ])
      .then(([viewData, userData, marketingData]) => {
        setContacts(viewData.contacts || []);
        setFilteredContacts(viewData.contacts || []);
        setContactCount(viewData.contactCount || 0);
        if (userData?.storeName) setStoreName(userData.storeName);
        setCampaigns(marketingData.campaigns || []);
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
      if (scheduled && scheduleDate) {
        body.scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }
      const res = await fetch("/api/seller/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      if (data.success && !data.scheduled) {
        const histRes = await fetch("/api/seller/marketing?limit=20", { credentials: "include" }).then((r) => r.json()).catch(() => ({ campaigns: [] }));
        setCampaigns(histRes.campaigns || []);
      }
    } catch {
      setResult({ error: "Error de red" });
    }
    setSending(false);
  };

  const sendQuickTemplate = async (templateType, season) => {
    setQuickSending(templateType);
    setResult(null);
    try {
      const body = { templateType, subject: "", html: "" };
      if (season) body.season = season;
      const res = await fetch("/api/seller/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        const histRes = await fetch("/api/seller/marketing?limit=20", { credentials: "include" }).then((r) => r.json()).catch(() => ({ campaigns: [] }));
        setCampaigns(histRes.campaigns || []);
      }
    } catch {
      setResult({ error: "Error de red" });
    }
    setQuickSending(null);
  };

  const toggleEmail = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const toggleAll = () => {
    if (selectedEmails.length === filteredContacts.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredContacts.map((c) => c.email).filter(Boolean));
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
          <p className="text-xs text-gray-500">Campanas enviadas</p>
          <p className="text-xl font-bold text-orange-600">{campaigns.filter((c) => c.status === "sent").length}</p>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Plantillas rapidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💚</span>
              <h3 className="font-semibold text-gray-800">&ldquo;Te extrañamos&rdquo;</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">Envia un email a usuarios que no se han logueado en mas de 30 dias</p>
            <button
              onClick={() => sendQuickTemplate("we-miss-you")}
              disabled={quickSending !== null}
              className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 transition"
            >
              {quickSending === "we-miss-you" ? "Enviando..." : "Enviar ahora"}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔥</span>
              <h3 className="font-semibold text-gray-800">Ofertas de la semana</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">Envia los productos con mayor descuento a todos los usuarios</p>
            <button
              onClick={() => sendQuickTemplate("weekly-offers")}
              disabled={quickSending !== null}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {quickSending === "weekly-offers" ? "Enviando..." : "Enviar ahora"}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎉</span>
              <h3 className="font-semibold text-gray-800">Email de temporada</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">Envia una campaña tematica segun la temporada del ano</p>
            <div className="flex gap-2">
              <select id="season-select" className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5">
                {SEASONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  const sel = document.getElementById("season-select");
                  sendQuickTemplate("seasonal", sel.value);
                }}
                disabled={quickSending !== null}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {quickSending === "seasonal" ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
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
        <button onClick={() => setShowHistory(!showHistory)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${showHistory ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          📋 Historial ({campaigns.length})
        </button>
      </div>

      {/* Campaign History */}
      {showHistory && <CampaignHistory campaigns={campaigns} />}

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

      {/* Schedule toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mt-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScheduled(!scheduled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${scheduled ? "bg-green-600" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${scheduled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">{scheduled ? "Programar envio" : "Enviar ahora"}</p>
            <p className="text-xs text-gray-500">{scheduled ? "Elige fecha y hora para el envio automatico" : "El email se envia inmediatamente"}</p>
          </div>
        </div>
        {scheduled && (
          <div className="flex gap-3 mt-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Fecha</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hora</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={sendCampaign}
          disabled={sending || !subject.trim() || blocks.length === 0 || targetCount === 0}
          className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {sending ? "Enviando..." : scheduled ? `Programar para ${targetCount} contactos` : `Enviar a ${targetCount} contactos`}
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="px-4 py-2.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition"
        >
          👁 Vista previa
        </button>
        <button
          onClick={exportHTML}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
        >
          📥 Descargar HTML
        </button>
        <a
          href={"/api/seller/product-viewers?days=90&export=csv"}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
        >
          📋 Exportar CSV
        </a>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-4 mt-4 ${result.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
          {result.error ? (
            <p className="text-sm text-red-700">{result.error}</p>
          ) : (
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">
                {result.scheduled ? "Campana programada" : "Campana enviada"}
              </p>
              <p className="text-sm text-green-600">{result.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Contact selector */}
      {contacts.length > 0 && (
        <div className="mt-6">
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

          {/* Filters */}
          <ContactFilters contacts={contacts} onFiltered={setFilteredContacts} />

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={selectedEmails.length === filteredContacts.length && filteredContacts.length > 0}
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
                  {filteredContacts.map((c, i) => (
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

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal blocks={blocks} width={emailWidth} storeName={storeName} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

export default function MarketingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando...</div>}>
      <MarketingInner />
    </Suspense>
  );
}
