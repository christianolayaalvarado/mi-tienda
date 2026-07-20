"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(Number(value || 0));
  } catch {
    return `S/ ${Number(value || 0).toFixed(2)}`;
  }
}

const statusColors = {
  unpaid: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Sin pago" },
  pending_verification: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Verificando pago" },
  paid: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Pagado" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Cancelado" },
};

export default function SellerOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [updatingShipping, setUpdatingShipping] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`);
      setOrder(data.order || data);
    } catch (err) {
      console.error("fetchOrder:", err);
      toast.error("Error cargando orden");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  const handleApprove = async () => {
    if (!confirm("¿Aprobar este pago?")) return;
    setProcessing(true);
    const t = toast.loading("Aprobando pago...");
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.message || "Error");
      toast.success("Pago aprobado. Emails enviados.");
      await fetchOrder();
    } catch (err) {
      toast.error(err?.message || "Error aprobando");
    } finally {
      toast.dismiss(t);
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("¿Rechazar este pago?")) return;
    setProcessing(true);
    const t = toast.loading("Rechazando pago...");
    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.message || "Error");
      toast.success("Pago rechazado");
      await fetchOrder();
    } catch (err) {
      toast.error(err?.message || "Error rechazando");
    } finally {
      toast.dismiss(t);
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Debes ingresar un motivo de cancelación");
      return;
    }
    setProcessing(true);
    const t = toast.loading("Cancelando orden...");
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.message || "Error");
      toast.success(data?.message || "Orden cancelada");
      setShowCancelModal(false);
      setCancelReason("");
      await fetchOrder();
    } catch (err) {
      toast.error(err?.message || "Error cancelando");
    } finally {
      toast.dismiss(t);
      setProcessing(false);
    }
  };

  const handleUpdateShipping = async (status) => {
    setUpdatingShipping(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingStatus: status,
          trackingNumber: trackingNumber || undefined,
          shippingCarrier: shippingCarrier || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error");
      toast.success("Estado de envío actualizado");
      await fetchOrder();
    } catch (err) {
      toast.error(err?.message || "Error actualizando envío");
    } finally {
      setUpdatingShipping(false);
    }
  };

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

  if (!order) {
    return <p className="p-6 text-center text-red-500">Orden no encontrada</p>;
  }

  const orderNumber = order.orderNumber || order.id;
  const ps = statusColors[order.paymentStatus] || statusColors.unpaid;
  const isCancelled = order.status === "cancelled";
  const hasPayment = order.paymentStatus === "paid" || order.paymentStatus === "pending_verification";
  const canCancel = !isCancelled && (order.paymentStatus !== "paid");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orden #{orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {order.customerName && `Cliente: ${order.customerName}`}
            {order.customerEmail && ` · ${order.customerEmail}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCancelled && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              Cancelada
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ps.bg} ${ps.text} border ${ps.border}`}>
            {ps.label}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(order.total)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha</p>
          <p className="text-sm font-medium text-gray-700 mt-1">
            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Estado de pago</p>
          <p className="text-sm font-medium text-gray-700 mt-1">{ps.label}</p>
        </div>
      </div>

      {/* Cancelación info */}
      {isCancelled && order.deletedReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800 mb-1">Motivo de cancelación:</p>
          <p className="text-sm text-red-700">{order.deletedReason}</p>
          {order.deletedAt && (
            <p className="text-xs text-red-500 mt-2">
              Cancelada el {new Date(order.deletedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      )}

      {/* Productos */}
      {order.orderItems && order.orderItems.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-700">Productos</h2>
          </div>
          <div className="divide-y">
            {order.orderItems.flatMap((oi) =>
              (oi.items || []).map((it) => (
                <div key={it.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{it.product?.title || it.product?.name || it.productName || "Producto"}</p>
                    <p className="text-sm text-gray-500">Cantidad: {it.quantity}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(it.price)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Comprobante de pago */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Comprobante de pago</h2>
        {order.paymentProof ? (
          <div className="space-y-3">
            {!imgError ? (
              <div className="relative">
                <img
                  src={order.paymentProof}
                  alt="Comprobante de pago"
                  className="w-full max-w-lg rounded-lg border shadow-sm"
                  onError={() => setImgError(true)}
                />
                <a
                  href={order.paymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow transition"
                  title="Abrir en nueva pestaña"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm font-medium">No se pudo cargar la imagen del comprobante</p>
                <a
                  href={order.paymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline mt-1 inline-block"
                >
                  Abrir enlace directo ↗
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 mt-2">El comprador aún no ha subido comprobante</p>
          </div>
        )}
      </div>

      {/* Dirección de envío */}
      {(order.shippingAddress || order.shippingCity || order.shippingDepartment) && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Dirección de envío</h2>
          <div className="text-sm text-gray-600 space-y-1">
            {order.shippingAddress && <p>{order.shippingAddress}</p>}
            <p>{[order.shippingCity, order.shippingDepartment].filter(Boolean).join(", ")}{order.shippingPostalCode ? ` - ${order.shippingPostalCode}` : ""}</p>
          </div>
        </div>
      )}

      {/* Gestión de envío */}
      {hasPayment && !isCancelled && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Gestión de envío</h2>

          {/* Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Número de tracking</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ej: TK123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Transportista</label>
              <input
                type="text"
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                placeholder="Ej: Olva, Shakir, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>

          {/* Botones de estado */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleUpdateShipping("shipped")}
              disabled={updatingShipping}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Marcar como enviado
            </button>
            <button
              onClick={() => handleUpdateShipping("in_transit")}
              disabled={updatingShipping}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition"
            >
              En tránsito
            </button>
            <button
              onClick={() => handleUpdateShipping("delivered")}
              disabled={updatingShipping}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              Marcar como entregado
            </button>
          </div>
        </div>
      )}

      {/* Acciones */}
      {!isCancelled && (
        <div className="flex flex-wrap gap-3">
          {order.paymentStatus === "pending_verification" && (
            <>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Aprobar pago
              </button>
              <button
                onClick={handleReject}
                disabled={processing}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Rechazar pago
              </button>
            </>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={processing}
              className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-60 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancelar orden
            </button>
          )}

          {/* Chat con comprador */}
          {order.customerEmail && (
            <button
              onClick={async () => {
                try {
                  const buyerRes = await fetch(`/api/users/by-email?email=${encodeURIComponent(order.customerEmail)}`);
                  const buyerData = await buyerRes.json().catch(() => null);
                  const buyerId = buyerData?.user?.id;
                  if (!buyerId) { toast.error("No se pudo identificar al comprador"); return; }
                  const chatRes = await fetch("/api/chat/conversations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sellerId: buyerId, productId: order.orderItems?.[0]?.items?.[0]?.productId }),
                  });
                  const chatData = await chatRes.json().catch(() => null);
                  if (chatRes.ok) { window.location.href = "/dashboard/chat"; }
                  else { toast.error(chatData?.error || "Error abriendo chat"); }
                } catch { toast.error("Error abriendo chat"); }
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Chat con comprador
            </button>
          )}

          {/* WhatsApp al comprador */}
          {order.customerPhone ? (
            <a
              href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "").length === 9 ? "51" : ""}${order.customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola ${order.customerName || ""}, sobre tu orden ${orderNumber}...`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2"
            >
              WhatsApp al comprador
            </a>
          ) : (
            <span className="text-xs text-gray-400 self-center" title="El comprador no registró teléfono">
              WhatsApp no disponible (sin teléfono)
            </span>
          )}
        </div>
      )}

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar orden #{orderNumber}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasPayment
                ? "Esta orden tiene un pago registrado. Al cancelar, se iniciará el proceso de reembolso."
                : "Esta acción no se puede deshacer."}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cancelación *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                required
                placeholder="Ej: Producto fuera de stock, solicitud del cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                disabled={processing}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                No cancelar
              </button>
              <button
                onClick={handleCancel}
                disabled={processing || !cancelReason.trim()}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {processing ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
