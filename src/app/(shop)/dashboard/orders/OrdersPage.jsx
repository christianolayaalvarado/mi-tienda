"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { OrderItemSkeleton } from "@/components/Skeletons";

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();

        if (res.ok) {
          setOrders(data.orders || []);
        } else {
          setError(data.error || "Error al obtener órdenes");
        }
      } catch (err) {
        console.error(err);
        setError("Error al conectarse al servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session]);

  if (!session) return <p className="p-4 text-gray-500">Debes iniciar sesión para ver tus órdenes.</p>;
  if (loading) {
    return (
      <div className="p-4 md:p-10 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderItemSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="p-4 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Mis Órdenes</h1>

      {orders.length === 0 && (
        <p>No se encontraron órdenes.</p>
      )}

      {orders.map((order) => (
        <div key={order.id} className="mb-6 border rounded-lg p-4 shadow-sm">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold">Orden ID: {order.id}</p>
            <p className="text-sm">
              Estado:{" "}
              <span
                className={
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : order.paymentStatus === "refunded"
                    ? "text-red-600"
                    : "text-yellow-600"
                }
              >
                {order.paymentStatus}
              </span>
            </p>
            
          </div>

          {/* STORES */}
          {order.stores?.map((store) => (
            <div key={store.id} className="mb-4">

              <p className="font-medium text-gray-700 mb-2">
                Tienda: {store.name}
              </p>

              {store.items.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No hay productos para mostrar
                </p>
              ) : (
                <table className="w-full text-sm border-t border-gray-200">
                  <thead>
                    <tr className="text-left">
                      <th className="py-1">Producto</th>
                      <th className="py-1">Cantidad</th>
                      <th className="py-1">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {store.items.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="py-1">
                          {item.product?.title || "Producto"}
                        </td>
                        <td className="py-1">{item.quantity}</td>
                        <td className="py-1">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          ))}

          {/* TOTAL */}
          <div className="mt-2 flex justify-between items-center">
            <span className="font-semibold text-green-600">
              Total: S/ {order.total?.toFixed(2)}
            </span>

            <Link
              href={`/dashboard/orders/${order.id}`}
              className="text-sm text-blue-600 hover:underline"
            >
              Ver detalle
            </Link>
          </div>

        </div>
      ))}
    </div>
  );
}