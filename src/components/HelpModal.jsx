"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/context/AuthProvider";
import MascotAvatar from "@/components/MascotAvatar";

const FAQ_ITEMS = [
  {
    q: "¿Cómo creo mi tienda?",
    a: "Regístrate, ve a tu dashboard y crea productos. Tu tienda se genera automáticamente con un código único.",
  },
  {
    q: "¿Cómo realizo una compra?",
    a: "Agrega productos al carrito, ve a checkout, completa tus datos de envío y elige un método de pago.",
  },
  {
    q: "¿Cómo subo mi comprobante de pago?",
    a: "Después de crear la orden, ve a 'Mis Órdenes' y sube tu comprobante de pago en la orden correspondiente.",
  },
  {
    q: "¿Cómo edito mi perfil?",
    a: "Ve a Dashboard > Editar Perfil. Puedes cambiar tu nombre, dirección, teléfono y foto.",
  },
  {
    q: "¿Cómo cambio mi mascota?",
    a: "Ve a Dashboard > Mascotas. Ahí puedes ver todas las mascotas disponibles y seleccionar la que más te guste.",
  },
  {
    q: "¿Cómo vendo mis productos?",
    a: "Crea productos en Dashboard > Productos. Cuando un cliente compre, recibirás una notificación.",
  },
  {
    q: "¿Cómo configuro envíos?",
    a: "Ve a Dashboard > Envíos y configura tus zonas de envío con costos y tiempos estimados.",
  },
  {
    q: "¿Cómo agrego formas de pago?",
    a: "Ve a Dashboard > Formas de pago. Puedes subir una imagen de tu código QR o datos de transferencia.",
  },
  {
    q: "¿Cómo desbloqueo nuevas mascotas?",
    a: "Las mascotas se desbloquean automáticamente al alcanzar logros: primera compra, 10 ventas, 5 reseñas, etc.",
  },
  {
    q: "¿Cómo contacto soporte?",
    a: "Haz clic en el botón de messenger en esta ventana o escríbenos a soporte@mitienda.com.",
  },
];

const GUIDES = [
  {
    id: "buy",
    title: "Cómo realizar compras",
    icon: "🛒",
    steps: [
      "Explora el catálogo en la página principal",
      "Haz clic en un producto para ver detalles",
      "Selecciona cantidad y agrega al carrito",
      "Ve al carrito y haz clic en 'Ir a checkout'",
      "Completa tus datos de envío",
      "Elige método de pago y sube comprobante",
      "Confirma tu orden y espera aprobación",
    ],
  },
  {
    id: "profile",
    title: "Cómo editar tu perfil",
    icon: "👤",
    steps: [
      "Ve a Dashboard > Editar Perfil",
      "Modifica tu nombre, dirección o teléfono",
      "Haz clic en 'Guardar cambios'",
    ],
  },
  {
    id: "payment",
    title: "Cómo realizar pagos",
    icon: "💳",
    steps: [
      "Al llegar al checkout, elige un método de pago",
      "Escanea el código QR o transfiere al número indicado",
      "Sube tu comprobante de pago",
      "La tienda verificará y confirmará tu pago",
    ],
  },
  {
    id: "mascot",
    title: "Cómo cambiar tu mascota",
    icon: "🎭",
    steps: [
      "Ve a Dashboard > Mascotas",
      "Explora la galería de mascotas disponibles",
      "Las mascotas bloqueadas muestran el requisito",
      "Haz clic en una mascota desbloqueada para seleccionarla",
      "Tu mascota aparecerá en la barra lateral derecha",
    ],
  },
  {
    id: "sell",
    title: "Cómo vender productos",
    icon: "📦",
    steps: [
      "Ve a Dashboard > Productos > Nuevo Producto",
      "Completa nombre, descripción, precio y stock",
      "Sube fotos del producto",
      "Selecciona categoría y publica",
      "Tu producto aparecerá en el catálogo",
    ],
  },
  {
    id: "shipping",
    title: "Cómo configurar envíos",
    icon: "🚚",
    steps: [
      "Ve a Dashboard > Envíos",
      "Agrega una zona de envío",
      "Selecciona departamento y provincia",
      "Define costo y días estimados",
      "Activa la zona",
    ],
  },
];

const BOT_RESPONSES = {
  "compra": "Para comprar: 1) Explora productos, 2) Agrega al carrito, 3) Ve a checkout, 4) Sube comprobante de pago. ¡Es muy fácil! 🛒",
  "vender": "Para vender: Ve a Dashboard > Productos > Nuevo Producto. Completa los datos, sube fotos y publica. ¡Tu tienda está lista! 📦",
  "pago": "Aceptamos transferencias bancarias y pagos con QR. Sube tu comprobante en 'Mis Órdenes' y el vendedor lo verificará. 💳",
  "envío": "Configura tus zonas de envío en Dashboard > Envíos. Define costos y tiempos por departamento/provincia. 🚚",
  "mascota": "Cambia tu mascota en Dashboard > Mascotas. Desbloquea nuevas al alcanzar logros como primera compra o 10 ventas. 🎭",
  "perfil": "Edita tu perfil en Dashboard > Editar Perfil. Puedes cambiar nombre, dirección y teléfono. 👤",
  "cuenta": "Tu cuenta se crea al registrarte. Usa tu email y contraseña para iniciar sesión. Si olvidaste tu contraseña, usa 'Olvidé mi contraseña'. 🔐",
  "producto": "Para ver productos, navega por categorías en la página principal o usa el buscador. Haz clic en uno para ver detalles. 🔍",
  "default": "Puedo ayudarte con: compras, ventas, pagos, envíos, mascotas, perfil y más. ¡Pregúntame lo que necesites! 😊",
};

function getBotResponse(input) {
  const lower = input.toLowerCase();
  for (const [key, response] of Object.entries(BOT_RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return response;
  }
  if (lower.includes("hola") || lower.includes("hey")) return "¡Hola! 👋 Soy tu asistente de Mi Tienda. ¿En qué puedo ayudarte?";
  if (lower.includes("gracias")) return "¡De nada! 😊 Si necesitas algo más, aquí estaré.";
  return BOT_RESPONSES.default;
}

export default function HelpModal() {
  const { user } = useAuthContext() || {};
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedGuide, setExpandedGuide] = useState(null);
  const [botMessages, setBotMessages] = useState([
    { role: "bot", text: "¡Hola! 👋 Soy tu asistente de Mi Tienda. ¿En qué puedo ayudarte?" },
  ]);
  const [botInput, setBotInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ category: "bug", description: "", email: "" });
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const botEndRef = useRef(null);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-help-modal", handler);
    return () => window.removeEventListener("open-help-modal", handler);
  }, []);

  useEffect(() => {
    if (botEndRef.current) {
      botEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [botMessages]);

  const toggle = () => setIsOpen((v) => !v);

  const sendBotMessage = () => {
    if (!botInput.trim()) return;
    const userMsg = botInput.trim();
    setBotMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setBotInput("");
    setIsTyping(true);
    setTimeout(() => {
      setBotMessages((prev) => [...prev, { role: "bot", text: getBotResponse(userMsg) }]);
      setIsTyping(false);
    }, 800);
  };

  const submitReport = async () => {
    if (!reportForm.description.trim() || reportForm.description.trim().length < 5) return;
    setReportSending(true);
    try {
      const res = await fetch("/api/support-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...reportForm,
          url: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (res.ok) {
        setReportSent(true);
        setReportForm({ category: "bug", description: "", email: "" });
      }
    } catch {}
    setReportSending(false);
  };

  const filteredFaq = FAQ_ITEMS.filter(
    (item) =>
      !searchQuery ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = GUIDES.filter(
    (g) =>
      !searchQuery ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabs = [
    { id: "home", label: "Inicio", icon: HomeIcon },
    { id: "messages", label: "Mensajes", icon: MessagesIcon },
    { id: "help", label: "Ayuda", icon: HelpIcon },
    { id: "tasks", label: "Tareas", icon: TasksIcon },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={toggle}
        className={`fixed bottom-5 left-5 sm:left-auto sm:right-5 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen ? "bg-gray-700 rotate-90" : "bg-green-600 hover:bg-green-700"
        }`}
        aria-label={isOpen ? "Cerrar ayuda" : "Abrir ayuda"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed bottom-24 left-5 sm:left-auto sm:right-5 z-[60] w-[360px] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: "min(560px, calc(100vh - 120px))" }}>
          {/* Header */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MascotAvatar type={user?.selectedMascot || "box"} size={32} animate={false} />
                <span className="font-bold text-sm">Mi Tienda</span>
              </div>
              <button onClick={toggle} className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h2 className="text-xl font-bold">
              ¡Hola{user?.name ? ` ${user.name}` : ""}!
            </h2>
            <p className="text-gray-300 text-sm">¿Cómo podemos ayudarte?</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* HOME TAB */}
            {activeTab === "home" && (
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar ayuda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => { setActiveTab("help"); setExpandedGuide("buy"); }}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                  >
                    <span className="text-xl">🛒</span>
                    <span className="text-xs font-medium text-gray-700">Cómo comprar</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab("help"); setExpandedGuide("sell"); }}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                  >
                    <span className="text-xl">📦</span>
                    <span className="text-xs font-medium text-gray-700">Cómo vender</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab("help"); setExpandedGuide("payment"); }}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                  >
                    <span className="text-xl">💳</span>
                    <span className="text-xs font-medium text-gray-700">Pagos</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab("help"); setExpandedGuide("mascot"); }}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                  >
                    <span className="text-xl">🎭</span>
                    <span className="text-xs font-medium text-gray-700">Mascotas</span>
                  </button>
                </div>

                {/* FAQ */}
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Preguntas frecuentes</h3>
                <div className="space-y-1">
                  {filteredFaq.slice(0, 5).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                    >
                      <span className="text-sm text-gray-700 pr-2">{item.q}</span>
                      <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ))}
                </div>
                {expandedFaq !== null && filteredFaq[expandedFaq] && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-gray-700">
                    {filteredFaq[expandedFaq].a}
                  </div>
                )}

                {/* Bot CTA */}
                <button
                  onClick={() => setActiveTab("tasks")}
                  className="w-full mt-4 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                >
                  <MascotAvatar type={user?.selectedMascot || "box"} size={36} animate />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-green-800">¿Necesitas ayuda personalizada?</p>
                    <p className="text-xs text-green-600">Habla con nuestro asistente IA</p>
                  </div>
                </button>

                {/* Reportar problema */}
                <button
                  onClick={() => { setShowReport(!showReport); setReportSent(false); }}
                  className="w-full mt-2 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition"
                >
                  <span className="text-xl">🐛</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-red-800">¿Tienes problemas?</p>
                    <p className="text-xs text-red-600">Reporta un error y lo resolveremos</p>
                  </div>
                </button>

                {showReport && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {reportSent ? (
                      <div className="text-center py-4">
                        <p className="text-2xl mb-2">✅</p>
                        <p className="text-sm font-medium text-green-700">Reporte enviado</p>
                        <p className="text-xs text-gray-500 mt-1">Nuestro equipo lo revisará pronto</p>
                        <button onClick={() => { setShowReport(false); setReportSent(false); }} className="mt-3 text-xs text-green-600 hover:underline">Cerrar</button>
                      </div>
                    ) : (
                      <>
                        <select
                          value={reportForm.category}
                          onChange={(e) => setReportForm((f) => ({ ...f, category: e.target.value }))}
                          className="w-full mb-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="bug">🐛 Bug / Error</option>
                          <option value="suggestion">💡 Sugerencia</option>
                          <option value="complaint">⚠️ Queja</option>
                          <option value="other">📝 Otro</option>
                        </select>
                        <textarea
                          placeholder="Describe el problema... (mínimo 5 caracteres)"
                          value={reportForm.description}
                          onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
                          className="w-full mb-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm resize-none"
                          rows={3}
                        />
                        <input
                          type="email"
                          placeholder="Tu email (opcional)"
                          value={reportForm.email}
                          onChange={(e) => setReportForm((f) => ({ ...f, email: e.target.value }))}
                          className="w-full mb-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                        <button
                          onClick={submitReport}
                          disabled={reportSending || reportForm.description.trim().length < 5}
                          className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          {reportSending ? "Enviando..." : "Enviar reporte"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === "messages" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Mensajes</h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <div>
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm text-gray-500">No hay mensajes nuevos</p>
                    <p className="text-xs text-gray-400 mt-1">Las notificaciones de tu tienda aparecerán aquí</p>
                  </div>
                </div>
              </div>
            )}

            {/* HELP TAB */}
            {activeTab === "help" && (
              <div className="p-4">
                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar guías..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Guías de uso</h3>
                <div className="space-y-2">
                  {filteredGuides.map((guide) => (
                    <div key={guide.id}>
                      <button
                        onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                      >
                        <span className="text-xl">{guide.icon}</span>
                        <span className="text-sm font-medium text-gray-700 flex-1">{guide.title}</span>
                        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandedGuide === guide.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedGuide === guide.id && (
                        <div className="mt-2 ml-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                          <ol className="space-y-2">
                            {guide.steps.map((step, si) => (
                              <li key={si} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="w-5 h-5 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                  {si + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-semibold text-gray-500 uppercase mt-6 mb-3">Preguntas frecuentes</h3>
                <div className="space-y-1">
                  {filteredFaq.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                    >
                      <span className="text-sm text-gray-700 pr-2">{item.q}</span>
                      <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ))}
                </div>
                {expandedFaq !== null && filteredFaq[expandedFaq] && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-gray-700">
                    {filteredFaq[expandedFaq].a}
                  </div>
                )}
              </div>
            )}

            {/* TASKS/BOT TAB */}
            {activeTab === "tasks" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {botMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-green-600 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={botEndRef} />
                </div>

                {/* Quick suggestions */}
                {botMessages.length <= 1 && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                    {["¿Cómo compro?", "¿Cómo vendo?", "Formas de pago", "Configurar envíos", "Cambiar mascota"].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setBotInput(s); setTimeout(sendBotMessage, 50); }}
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendBotMessage(); }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={botInput}
                      onChange={(e) => setBotInput(e.target.value)}
                      placeholder="Escribe tu pregunta..."
                      className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="submit"
                      disabled={!botInput.trim()}
                      className="w-9 h-9 bg-green-600 text-white rounded-lg flex items-center justify-center hover:bg-green-700 disabled:opacity-40 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Tabs */}
          <div className="border-t bg-white flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition ${
                  activeTab === tab.id ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <tab.icon active={activeTab === tab.id} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function HomeIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-green-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function MessagesIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-green-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function HelpIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-green-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function TasksIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-green-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 2.5 : 2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}
