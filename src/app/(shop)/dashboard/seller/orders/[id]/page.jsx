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

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`);
      // La API devuelve { order: { ... } }, extraemos el objeto order
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
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${ps.bg} ${ps.text} border ${ps.border}`}>
          {ps.label}
        </span>
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

      {/* Acciones */}
      {order.paymentStatus === "pending_verification" && (
        <div className="flex gap-4">
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
        </div>
      )}
    </div>
  );
}
