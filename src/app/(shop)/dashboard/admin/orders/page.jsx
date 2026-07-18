"use client";

import { useEffect, useState } from "react";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS = {
  unpaid: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-red-100 text-red-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterPayment) params.set("paymentStatus", filterPayment);
      const qs = params.toString();
      const res = await fetch(`/api/admin/orders${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error cargando órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus, filterPayment]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Error");
      fetchOrders();
    } catch (err) {
      alert("Error al actualizar estado");
    }
  };

  if (loading) return <p className="p-4">Cargando órdenes...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Órdenes Admin</h1>
        <p className="text-sm text-gray-500">Gestiona todas las órdenes de la plataforma</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Todos los pagos</option>
          <option value="unpaid">No pagado</option>
          <option value="paid">Pagado</option>
          <option value="refunded">Reembolsado</option>
        </select>
        <span className="text-sm text-gray-500 self-center">{orders.length} órdenes</span>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay órdenes</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.orderNumber || `#${order.id.slice(-6)}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.user?.name || "—"} ({order.user?.email || "—"})
                  </p>
                </div>
                <p className="text-lg font-bold text-gray-900">S/ {Number(order.total).toFixed(2)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                  {order.status}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100"}`}>
                  {order.paymentStatus}
                </span>
                {order.paymentMethod && (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {order.paymentMethod.name}
                  </span>
                )}
              </div>

              {order.orderItems?.length > 0 && (
                <div className="text-sm text-gray-600">
                  {order.orderItems.flatMap((oi) => oi.items || []).map((it, i) => (
                    <span key={i}>
                      {it.product?.name || "Producto"} ×{it.quantity}
                      {i < order.orderItems.flatMap((oi) => oi.items || []).length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {order.status === "pending" && (
                  <button
                    onClick={() => updateStatus(order.id, "confirmed")}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                  >
                    Confirmar
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button
                    onClick={() => updateStatus(order.id, "shipped")}
                    className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
                  >
                    Enviar
                  </button>
                )}
                {order.status === "shipped" && (
                  <button
                    onClick={() => updateStatus(order.id, "delivered")}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                  >
                    Entregado
                  </button>
                )}
                {order.status !== "cancelled" && order.status !== "delivered" && (
                  <button
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
