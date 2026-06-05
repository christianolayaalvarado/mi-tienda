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

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null); // para conocer role del usuario

  // Estado para el modal de eliminación
  const [deleteTarget, setDeleteTarget] = useState(null); // { orderId }

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
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const s = await res.json();
          setSession(s);
        } else {
          setSession(null);
        }
      } catch (e) {
        console.warn("No se pudo obtener sesión en cliente:", e?.message || e);
        setSession(null);
      }
    };

    const fetchOrders = async () => {
      try {
        setLoading(true);
        await fetchSession();
        const res = await fetch("/api/seller/orders");
        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(`Error ${res.status}: ${text || res.statusText}`);
        }
        const data = await res.json();
        setOrders(normalize(data.orders || data || []));
      } catch (err) {
        console.error("Error cargando órdenes del vendedor:", err);
        setError("No se pudieron cargar las ventas. Revisa la consola.");
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
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(`Error ${res.status}: ${text || res.statusText}`);
      }
      const data = await res.json();
      setOrders(normalize(data.orders || data || []));
    } catch (err) {
      console.error("Error refrescando órdenes:", err);
      setError("No se pudieron refrescar las ventas. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (orderId) => {
    // Este botón ahora solo aparece para admin; confirmación y llamada al endpoint
    if (!confirm("Confirmar: marcar esta orden como pagada? Esta acción la realiza un administrador.")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markPaid" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || json?.message || "Error marcando como pagado");
      }
      alert("Orden marcada como pagada");
      await refreshOrders();
    } catch (err) {
      console.error("Error marcando como pagado:", err);
      alert(err?.message || "No se pudo marcar como pagado. Revisa la consola.");
    }
  };

  const handleMarkStorePaid = async (orderId, storeId) => {
    if (!confirm("Confirmar: marcar esta tienda como pagada?")) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markStorePaid", storeId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || json?.message || "Error marcando pago de tienda");
      }
      alert("Pago de la tienda marcado correctamente");
      await refreshOrders();
    } catch (err) {
      console.error("Error marcando pago de tienda:", err);
      alert(err?.message || "No se pudo marcar pago de tienda. Revisa la consola.");
    }
  };

  // Eliminar orden (soft-delete) usando la razón provista por el modal
  const handleDeleteOrder = async (orderId, reason) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "", mode: "soft" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || json?.message || "Error eliminando orden");
      }
      // cerrar modal y refrescar
      setDeleteTarget(null);
      await refreshOrders();
      alert("Orden eliminada correctamente");
    } catch (err) {
      console.error("Error eliminando orden:", err);
      alert(err?.message || "No se pudo eliminar la orden");
    }
  };

  if (loading) return <p className="p-6 text-gray-600">Cargando ventas...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!orders || orders.length === 0) return <p className="p-6 text-gray-600">No tienes ventas aún</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ventas de mi tienda</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                {/* #Orden con botón Ver detalle junto al número */}
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <strong>#Orden:</strong>
                  <span className="text-gray-800">{order.orderNumber || order.id}</span>
                  <a
                    href={`/dashboard/orders/${order.id}`}
                    className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded"
                  >
                    Ver detalle
                  </a>
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
                    <p className="font-semibold">Estado del item: {item.paymentStatus || "unknown"}</p>
                    <p className="text-sm text-gray-500">Tienda: {item.store?.name || item.storeId || "—"}</p>
                  </div>

                  <div className="mt-2 grid gap-2">
                    {Array.isArray(item.items) && item.items.length > 0 ? (
                      item.items.map((prod) => (
                        <div
                          key={prod.id || `${item.id}-${prod.productId || prod.product?.id || Math.random()}`}
                          className="flex justify-between text-sm"
                        >
                          <div>
                            <div className="font-medium">{prod.product?.title || prod.productTitle || "Producto"}</div>
                            <div className="text-gray-500 text-xs">
                              Precio unitario: S/ {Number(prod.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div>{Number(prod.quantity || 0)} x</div>
                            <div className="font-semibold">
                              S/ {(Number(prod.price || 0) * Number(prod.quantity || 1)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No hay productos listados</div>
                    )}
                  </div>

                  {/* Acciones por tienda (si corresponde) */}
                  <div className="mt-3 flex gap-2">
                    {/* Ver comprobante (controlado por servidor) */}
                    <a
                      href={`/api/orders/${order.id}/proof`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 underline"
                    >
                      Ver comprobante
                    </a>

                    {/* Botón para que el vendedor de esta tienda marque su tienda como pagada */}
                    <button
                      onClick={() => handleMarkStorePaid(order.id, item.storeId)}
                      disabled={item.paymentStatus === "paid"}
                      className={`text-sm px-3 py-1 rounded ${
                        item.paymentStatus === "paid"
                          ? "bg-gray-200 text-gray-600"
                          : "bg-yellow-600 text-white hover:bg-yellow-700"
                      }`}
                    >
                      {item.paymentStatus === "paid" ? "Tienda pagada" : "Marcar tienda como pagada"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones rápidas a nivel de orden */}
            <div className="mt-4 flex gap-2">
              {/* Botón Eliminar orden (abre modal) */}
              <button
                onClick={() => setDeleteTarget({ orderId: order.id })}
                className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar orden
              </button>

              {/* Mostrar botón de orden completa SOLO para admin */}
              {session?.user?.role === "admin" ? (
                <button
                  onClick={() => handleMarkPaid(order.id)}
                  disabled={order.paymentStatus === "paid"}
                  className={`text-sm px-3 py-1 rounded ${
                    order.paymentStatus === "paid" ? "bg-gray-200 text-gray-600" : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {order.paymentStatus === "paid" ? "Pagado" : "Marcar como pagado"}
                </button>
              ) : null}
            </div>

            {/* Si la orden está marcada como eliminada (soft-delete), mostrar razón centrada */}
            {order.deleted && (
              <div className="mt-3 text-sm text-red-600 text-center">
                <strong>Orden eliminada</strong> • Razón: {order.deletedReason || "—"} • Fecha:{" "}
                {order.deletedAt ? formatDate(order.deletedAt) : "—"}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de razón para eliminar orden */}
      <ReasonModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(reason) => {
          if (!deleteTarget) return;
          handleDeleteOrder(deleteTarget.orderId, reason);
        }}
      />
    </div>
  );
}
