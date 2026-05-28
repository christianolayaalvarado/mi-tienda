"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SellerOrderDetailPage() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar orden
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();

      if (res.ok) {
        setOrder(data);
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // 🔥 CONFIRMAR PAGO
  const handleConfirmPayment = async (orderItemId) => {
    try {
      const res = await fetch("/api/seller/orders/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderItemId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al confirmar pago");
        return;
      }

      alert("Pago confirmado ✅");
      fetchOrder();
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  if (loading) return <p className="p-4">Cargando...</p>;
  if (!order) return <p className="p-4">Orden no encontrada</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Orden #{order.id}
      </h1>

      {order.orderItems.map((item) => (
        <div key={item.id} className="border p-4 rounded-lg">

          <h2 className="font-semibold text-lg mb-2">
            {item.store?.name}
          </h2>

          <p>
            Estado:{" "}
            <strong>{item.paymentStatus}</strong>
          </p>

          {/* 🔥 COMPROBANTE */}
          {item.order?.paymentProof && (
            <div className="mt-3">
              <p className="text-sm text-gray-500">
                Comprobante:
              </p>
              <img
                src={item.order.paymentProof}
                alt="Comprobante"
                className="w-48 mt-2 border rounded"
              />
            </div>
          )}

          {/* 🔥 BOTÓN */}
          {item.paymentStatus !== "paid" && (
            <button
              onClick={() => handleConfirmPayment(item.id)}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
            >
              Confirmar pago
            </button>
          )}
        </div>
      ))}
    </div>
  );
}