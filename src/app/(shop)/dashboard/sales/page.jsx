"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SalesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  // 🔹 cargar ventas
  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/orders");
      const data = await res.json();

      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando ventas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // 🔥 CONFIRMAR PAGO DESDE VENTAS
  const handleConfirmPayment = async (orderId) => {
    const confirmAction = confirm("¿Confirmar que el pago fue recibido?");
    if (!confirmAction) return;

    const loadingToast = toast.loading("Confirmando pago...");
    setConfirmingId(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
      });

      if (!res.ok) throw new Error();

      toast.dismiss(loadingToast);
      toast.success("Pago confirmado");

      // 🔥 refrescar lista
      fetchSales();

    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("Error confirmando pago");
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-600">Cargando ventas...</p>;
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Ventas de mi tienda
      </h1>

      {orders.length === 0 && (
        <p className="text-gray-500">No tienes ventas aún.</p>
      )}

      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded-xl p-5 shadow-sm space-y-4"
        >

          {/* HEADER */}
          <div className="flex justify-between items-start">

            <div>
              <p className="font-semibold">
                Orden #{order.id}
              </p>

              <p className="text-sm text-gray-600">
                Cliente: {order.user?.email || "N/A"}
              </p>

              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>

            {/* ESTADO */}
            <div className="text-right">
              <p
                className={`font-semibold ${
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {order.paymentStatus === "paid"
                  ? "Pagado"
                  : "Pendiente"}
              </p>
            </div>
          </div>

          {/* PRODUCTOS */}
          {order.orderItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-gray-50"
            >

              <p className="font-medium mb-2">
                {item.store?.name || "Tienda"}
              </p>

              {item.items.map((prod) => (
                <div
                  key={prod.id}
                  className="flex justify-between text-sm"
                >
                  <span>{prod.product.title}</span>
                  <span>
                    {prod.quantity} × S/ {prod.price.toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="text-right font-semibold mt-2">
                Total: S/{" "}
                {item.items
                  .reduce(
                    (sum, i) => sum + i.price * i.quantity,
                    0
                  )
                  .toFixed(2)}
              </div>

            </div>
          ))}

          {/* 🔥 ACCIONES */}
          <div className="flex justify-end gap-3">

            {/* 🔥 BOTÓN CONFIRMAR */}
            {order.paymentStatus !== "paid" && (
              <button
                onClick={() => handleConfirmPayment(order.id)}
                disabled={confirmingId === order.id}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {confirmingId === order.id
                  ? "Confirmando..."
                  : "✅ Confirmar pago"}
              </button>
            )}

            <Link href={`/dashboard/orders/${order.id}`}>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Ver detalle
              </button>
            </Link>

          </div>

        </div>
      ))}
    </div>
  );
}