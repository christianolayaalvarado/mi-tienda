"use client";

import { useEffect, useState } from "react";

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch("/api/seller/orders");
      const data = await res.json();

      setOrders(data.orders || []);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Cargando ventas...</p>;

  if (orders.length === 0) {
    return <p>No tienes ventas aún</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ventas de mi tienda</h1>

      {orders.map((order) => (
        <div key={order.id} className="border p-4 rounded">

          <p className="text-sm text-gray-500">
            Cliente: {order.user?.email}
          </p>

          {order.orderItems.map((item) => (
            <div key={item.id} className="mt-3 border-t pt-3">

              <p className="font-semibold">
                Estado: {item.paymentStatus}
              </p>

              {item.items.map((prod) => (
                <div key={prod.id} className="text-sm">
                  {prod.product.title} x {prod.quantity}
                </div>
              ))}

            </div>
          ))}

        </div>
      ))}
    </div>
  );
}