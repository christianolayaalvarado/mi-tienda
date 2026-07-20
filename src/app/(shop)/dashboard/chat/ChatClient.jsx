"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Hoy";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export default function ChatClient() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cargar conversaciones
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) setConversations(data);
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar mensajes de una conversación
  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`);
      const data = await res.json().catch(() => null);
      if (data?.messages) {
        setMessages(data.messages);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
      inputRef.current?.focus();
    }
  }, [activeConv?.id]);

  // Polling para nuevos mensajes (cada 10s)
  useEffect(() => {
    if (!activeConv) return;
    const interval = setInterval(() => {
      fetchMessages(activeConv.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeConv?.id]);

  // Enviar mensaje
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv || sending) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeConv.id, text }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error");

      if (data?.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(scrollToBottom, 100);

        // Actualizar la conversación en la lista
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConv.id
              ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      toast.error(err?.message || "Error enviando mensaje");
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  // Seleccionar conversación
  const selectConversation = (conv) => {
    setActiveConv(conv);
    setMessages([]);
    // Limpiar unread count
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Eliminar conversación
  const handleDeleteConversation = async (conv) => {
    if (!window.confirm("¿Eliminar esta conversación? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/chat/conversations?id=${conv.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error");
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      if (activeConv?.id === conv.id) {
        setActiveConv(null);
        setMessages([]);
      }
      toast.success("Conversación eliminada");
    } catch {
      toast.error("No se pudo eliminar la conversación");
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Chat
          {totalUnread > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
              {totalUnread}
            </span>
          )}
        </h1>
      </div>

      <div className="bg-white border rounded-lg shadow-sm flex" style={{ height: "calc(100vh - 220px)" }}>
        {/* Lista de conversaciones */}
        <div className="w-80 border-r flex flex-col">
          <div className="p-3 border-b">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">Conversaciones</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                No tienes conversaciones aún
              </div>
            ) : (
              conversations.map((conv) => {
                const other = conv.otherUser;
                const isActive = activeConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    className={`relative group border-b hover:bg-gray-50 transition ${
                      isActive ? "bg-green-50 border-l-2 border-l-green-500" : ""
                    }`}
                  >
                    <button
                      onClick={() => selectConversation(conv)}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 font-semibold text-sm">
                            {(other?.name || other?.email || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {other?.name || other?.email || "Usuario"}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatDate(conv.lastMessageAt)}
                            </span>
                          </div>
                          {conv.product && (
                            <p className="text-xs text-green-600 truncate mt-0.5">
                              {conv.product.title}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-400 truncate">
                              {conv.lastMessage || "Sin mensajes"}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Eliminar conversación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-semibold text-sm">
                    {(activeConv.otherUser?.name || activeConv.otherUser?.email || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {activeConv.otherUser?.name || activeConv.otherUser?.email || "Usuario"}
                  </p>
                  {activeConv.product && (
                    <p className="text-xs text-green-600">{activeConv.product.title}</p>
                  )}
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    Inicia la conversación
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-xs lg:max-w-md">
                        {!isMine && msg.sender && (
                          <p className="text-xs text-gray-500 mb-1 ml-2 font-medium">
                            {msg.sender.name || msg.sender.email}
                          </p>
                        )}
                        <div className={`px-4 py-2 rounded-2xl ${
                          isMine
                            ? "bg-green-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={`text-xs mt-1 ${isMine ? "text-green-200" : "text-gray-400"}`}>
                            {formatTime(msg.createdAt)}
                            {isMine && msg.read && (
                              <span className="ml-1">✓✓</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 text-sm"
                  >
                    {sending ? (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    Enviar
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg font-medium">Selecciona una conversación</p>
                <p className="text-sm mt-1">para empezar a chatear</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
