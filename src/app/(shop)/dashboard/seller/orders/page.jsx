"use client";

import { useEffect, useState } from "react";
import ReasonModal from "@/components/ReasonModal";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function OrderItemProducts({ orderItem, orderId, fetchOrderDetail }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Array.isArray(orderItem.items) && orderItem.items.length > 0) {
      setItems(orderItem.items);
      return;
    }
    let cancel = false;
    setLoading(true);
    fetchOrderDetail(orderId).then((detail) => {
      if (cancel) return;
      if (detail?.orderItems) {
        const matched = detail.orderItems.find((oi) => oi.id === orderItem.id || oi.storeId === orderItem.storeId);
        setItems(matched?.items || []);
      } else {
        setItems([]);
      }
      setLoading(false);
    }).catch(() => {
      setItems([]);
      setLoading(false);
    });
    return () => { cancel = true; };
  }, [orderItem.id, orderItem.storeId, orderId]);

  if (loading) return <div className="text-xs text-gray-400">Cargando productos...</div>;
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {items.map((prod) => (
        <div
          key={prod.id || `${orderItem.id}-${prod.productId || Math.random()}`}
          className="flex items-start justify-between gap-2 text-sm"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{prod.product?.title || prod.product?.name || prod.productName || "Producto"}</div>
            <div className="text-gray-500 text-xs">
              S/ {Number(prod.price || 0).toFixed(2)} x {Number(prod.quantity || 0)}
            </div>
          </div>
          <div className="text-right shrink-0 font-semibold">
            S/ {(Number(prod.price || 0) * Number(prod.quantity || 1)).toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const normalize = (rawOrders = []) =>
    (rawOrders || []).map((o) => ({
      id: o.id || o._id || o.order?.id || o.order?._id,
      orderNumber: o.orderNumber || o.order?.orderNumber || o.orderNumber,
      createdAt: o.createdAt || o.order?.createdAt || o.order?.created_at,
      total: o.total || o.order?.total || 0,
      paymentStatus: o.paymentStatus || o.order?.paymentStatus || "unknown",
      paymentMethod: o.paymentMethod || o.order?.paymentMethod || "",
      customerName: o.customerName || o.order?.customerName || o.customer?.name || "",
      customerEmail: o.customerEmail || o.order?.customerEmail || o.customer?.email || "",
      documentNumber: o.documentNumber || o.order?.documentNumber || null,
      orderItems: o.orderItems || o.order?.orderItems || [],
      paymentProof: o.paymentProof || o.order?.paymentProof || null,
      deleted: o.deleted || o.order?.deleted || false,
      deletedReason: o.deletedReason || o.order?.deletedReason || null,
      deletedAt: o.deletedAt || o.order?.deletedAt || null,
      deletedBy: o.deletedBy || o.order?.deletedBy || null,
    }));

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (meRes.ok) {
          const meData = await meRes.json();
          setSession(meData?.user ? { user: meData.user } : null);
        }
        const res = await fetch("/api/seller/orders");
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setOrders(normalize(data.orders || data || []));
      } catch (err) {
        console.error("Error cargando ventas:", err);
        setError("No se pudieron cargar las ventas.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const refreshOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seller/orders");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setOrders(normalize(data.orders || data || []));
    } catch (err) {
      console.error("Error refrescando:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (orderId) => {
    if (!confirm("Marcar esta orden como pagada?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markPaid" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Error");
      alert("Orden marcada como pagada");
      await refreshOrders();
    } catch (err) {
      alert(err?.message || "No se pudo marcar como pagado");
    }
  };

  const handleMarkStorePaid = async (orderId, storeId) => {
    if (!confirm("Marcar esta tienda como pagada?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markStorePaid", storeId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Error");
      alert("Pago de tienda marcado");
      await refreshOrders();
    } catch (err) {
      alert(err?.message || "No se pudo marcar");
    }
  };

  const fetchOrderDetail = async (orderId) => {
    if (detailCache[orderId]) return detailCache[orderId];
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) return null;
      const detail = data.order || data;
      setDetailCache((prev) => ({ ...prev, [orderId]: detail }));
      return detail;
    } catch {
      return null;
    }
  };

  const handleDeleteOrder = async (orderId, reason) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "", mode: "soft" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Error eliminando");
      setDeleteTarget(null);
      await refreshOrders();
      alert("Orden eliminada");
    } catch (err) {
      alert(err?.message || "No se pudo eliminar");
    }
  };

  if (loading) return <p className="p-4 sm:p-6 text-gray-600">Cargando ventas...</p>;
  if (error) return <p className="p-4 sm:p-6 text-red-600">{error}</p>;
  if (!orders || orders.length === 0) return <p className="p-4 sm:p-6 text-gray-600">No tienes ventas aún</p>;

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Ventas de mi tienda</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
            {/* Header de la orden */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">#{order.orderNumber || order.id?.slice(-8)}</p>
                <a href={`/dashboard/orders/${order.id}`} className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded-lg shrink-0">
                  Ver detalle
                </a>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Fecha</span>
                  <p className="text-gray-800">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-xs">Total</span>
                  <p className="font-bold text-green-700 text-lg">S/ {Number(order.total || 0).toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 text-xs">Cliente</span>
                  <p className="text-gray-800 truncate">{order.customerName || "—"}</p>
                  <p className="text-gray-500 text-xs truncate">{order.customerEmail || "—"}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Estado</span>
                  <p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                      order.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                      order.paymentStatus === "pending_verification" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Documento</span>
                  <p className="text-gray-800">{order.documentNumber || "No emitido"}</p>
                </div>
              </div>
            </div>

            {/* Items por tienda */}
            {order.orderItems?.length > 0 && (
              <div className="border-t divide-y">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.paymentStatus === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {item.paymentStatus === "paid" ? "Pagada" : "Pendiente"}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        Tienda: {item.store?.name || item.storeId || "—"}
                      </span>
                    </div>

                    <OrderItemProducts orderItem={item} orderId={order.id} fetchOrderDetail={fetchOrderDetail} />

                    <div className="flex flex-wrap gap-2 mt-3">
                      <a href={`/api/orders/${order.id}/proof`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-green-600 underline py-1">Ver comprobante</a>
                      <button onClick={() => handleMarkStorePaid(order.id, item.storeId)} disabled={item.paymentStatus === "paid"}
                        className={`text-xs px-2.5 py-1 rounded-lg ${
                          item.paymentStatus === "paid" ? "bg-gray-100 text-gray-500" : "bg-yellow-500 text-white hover:bg-yellow-600"
                        }`}>
                        {item.paymentStatus === "paid" ? "Tienda pagada" : "Marcar pagada"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Acciones de la orden */}
            <div className="border-t p-4 flex flex-wrap gap-2">
              <button onClick={() => setDeleteTarget({ orderId: order.id })} disabled={!!order.deleted}
                className={`text-xs px-3 py-1.5 rounded-lg ${
                  order.deleted ? "bg-gray-100 text-gray-500" : "bg-red-600 text-white hover:bg-red-700"
                }`}>
                Eliminar
              </button>
              {session?.user?.role === "admin" && (
                <button onClick={() => handleMarkPaid(order.id)} disabled={order.paymentStatus === "paid"}
                  className={`text-xs px-3 py-1.5 rounded-lg ${
                    order.paymentStatus === "paid" ? "bg-gray-100 text-gray-500" : "bg-green-600 text-white hover:bg-green-700"
                  }`}>
                  {order.paymentStatus === "paid" ? "Pagado" : "Marcar pagado"}
                </button>
              )}
              {order.deleted && (
                <span className="text-xs text-red-500 self-center">Eliminada: {order.deletedReason || "—"}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <ReasonModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={(reason) => { if (deleteTarget) handleDeleteOrder(deleteTarget.orderId, reason); }} />
    </div>
  );
}
