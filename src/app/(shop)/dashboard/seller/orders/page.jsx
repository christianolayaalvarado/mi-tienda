"use client";

import { useEffect, useState } from "react";

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

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/seller/orders");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text}`);
        }
        const data = await res.json();
        // Normalizar estructura por seguridad
        const normalized = (data.orders || []).map((o) => ({
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
        }));
        setOrders(normalized);
      } catch (err) {
        console.error("Error cargando órdenes del vendedor:", err);
        setError("No se pudieron cargar las ventas. Revisa la consola.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Cargando ventas...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (orders.length === 0) return <p>No tienes ventas aún</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ventas de mi tienda</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">
                  <strong>#Orden:</strong>{" "}
                  <span className="text-gray-800">{order.orderNumber || order.id}</span>
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Fecha:</strong>{" "}
                  <span className="text-gray-800">{formatDate(order.createdAt)}</span>
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Cliente:</strong>{" "}
                  <span className="text-gray-800">
                    {order.customerName ? `${order.customerName} • ` : ""}
                    {order.customerEmail || "—"}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm">
                  <strong>Total:</strong>{" "}
                  <span className="text-gray-800">S/ {Number(order.total || 0).toFixed(2)}</span>
                </p>
                <p className="text-sm">
                  <strong>Estado:</strong>{" "}
                  <span className="text-gray-800">{order.paymentStatus}</span>
                </p>
                <p className="text-sm">
                  <strong>Documento:</strong>{" "}
                  <span className="text-gray-800">{order.documentNumber || "No emitido"}</span>
                </p>
              </div>
            </div>

            {/* Items por tienda dentro de la orden */}
            <div className="mt-4 space-y-3">
              {order.orderItems.map((item) => (
                <div key={item.id} className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Estado del item: {item.paymentStatus}</p>
                    <p className="text-sm text-gray-500">Tienda: {item.store?.name || item.storeId || "—"}</p>
                  </div>

                  <div className="mt-2 grid gap-2">
                    {Array.isArray(item.items) && item.items.length > 0 ? (
                      item.items.map((prod) => (
                        <div key={prod.id} className="flex justify-between text-sm">
                          <div>
                            <div className="font-medium">{prod.product?.title || prod.productTitle || "Producto"}</div>
                            <div className="text-gray-500 text-xs">
                              Precio unitario: S/ {Number(prod.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div>{prod.quantity} x</div>
                            <div className="font-semibold">S/ {(Number(prod.price || 0) * Number(prod.quantity || 1)).toFixed(2)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No hay productos listados</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones rápidas */}
            <div className="mt-4 flex gap-2">
              <a
                href={`/dashboard/orders/${order.id}`}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
              >
                Ver detalle
              </a>

              <button
                onClick={async () => {
                  // marcar como pagado (ejemplo rápido)
                  try {
                    const res = await fetch(`/api/orders/${order.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "markPaid" }),
                    });
                    if (!res.ok) {
                      const t = await res.text();
                      throw new Error(t || "Error");
                    }
                    // refrescar lista
                    const refreshed = await fetch("/api/seller/orders");
                    const d = await refreshed.json();
                    setOrders(d.orders || []);
                  } catch (err) {
                    console.error("Error marcando como pagado:", err);
                    alert("No se pudo marcar como pagado. Revisa la consola.");
                  }
                }}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded"
              >
                Marcar como pagado
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
