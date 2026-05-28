"use client";

import { useEffect, useState } from "react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
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
  }, []);

  const confirmPayment = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Error confirmando pago");

      alert("Pago confirmado");
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error al confirmar pago");
    }
  };

  if (loading) return <p className="p-4">Cargando órdenes...</p>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Panel de Órdenes</h1>

      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4 space-y-3">
          <p className="font-medium">Orden #{order.id}</p>
          <p>
            Estado:{" "}
            <span
              className={
                order.paymentStatus === "paid"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {order.paymentStatus}
            </span>
          </p>

          {/* Mostrar comprobante si existe */}
          {order.paymentProof && (
            <div>
              <p className="text-sm mb-1">Comprobante:</p>
              <img
                src={`data:image/png;base64,${order.paymentProof}`}
                alt="Comprobante"
                className="w-40 border"
              />
            </div>
          )}

          {/* Botón confirmar */}
          {order.paymentStatus !== "paid" && (
            <button
              onClick={() => confirmPayment(order.id)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Confirmar pago
            </button>
          )}
        </div>
      ))}
    </div>
  );
}