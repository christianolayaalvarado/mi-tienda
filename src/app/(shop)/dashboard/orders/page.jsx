"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import EmptyState from "@/components/EmptyState";
import Breadcrumbs from "@/components/Breadcrumbs";
import { OrderItemSkeleton } from "@/components/Skeletons";

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

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagadas" },
  { value: "processing", label: "Procesando" },
  { value: "shipped", label: "Enviadas" },
  { value: "delivered", label: "Entregadas" },
  { value: "cancelled", label: "Canceladas" },
];

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  pending_verification: "bg-orange-100 text-orange-800 border-orange-200",
};

const PAYMENT_COLORS = {
  paid: "bg-green-100 text-green-800",
  unpaid: "bg-red-100 text-red-800",
  pending_verification: "bg-yellow-100 text-yellow-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Error en API");
      const data = await res.json();
      let ordersArray = Array.isArray(data) ? data : Array.isArray(data.orders) ? data.orders : [];
      ordersArray = ordersArray.map((o) => {
        const nested = o.order || {};
        return {
          ...o,
          orderNumber: o.orderNumber || nested.orderNumber || null,
          deleted: typeof o.deleted !== "undefined" ? o.deleted : !!nested.deleted,
          deletedReason: o.deletedReason || nested.deletedReason || null,
          deletedAt: o.deletedAt || nested.deletedAt || null,
        };
      });
      setOrders(ordersArray);
      setSelectedOrders([]);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando órdenes");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = useMemo(() => {
    if (!statusFilter) return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {};
    orders.forEach((o) => {
      if (!o.deleted) counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const toggleSelect = (id) => {
    const ord = orders.find((o) => o.id === id);
    if (!ord || ord.deleted) return;
    setSelectedOrders((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const selectable = filteredOrders.filter((o) => !o.deleted).map((o) => o.id);
    if (selectedOrders.length === selectable.length && selectable.length > 0) setSelectedOrders([]);
    else setSelectedOrders(selectable);
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedOrders.length} orden(es)?`)) return;
    setDeleting(true);
    try {
      for (const id of selectedOrders) {
        await fetch("/api/orders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: id }) });
      }
      toast.success("Órdenes eliminadas");
      fetchOrders();
    } catch { toast.error("Error eliminando órdenes"); }
    finally { setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <Breadcrumbs />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <OrderItemSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <Breadcrumbs />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 mt-4">
        <h1 className="text-xl sm:text-2xl font-bold">Mis Órdenes</h1>
        <button onClick={handleDeleteSelected} disabled={selectedOrders.length === 0 || deleting}
          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${selectedOrders.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}>
          {deleting ? "Eliminando..." : `🗑 Eliminar (${selectedOrders.length})`}
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
        <button onClick={() => setStatusFilter("")}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${!statusFilter ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
          Todas ({orders.length})
        </button>
        {STATUS_TABS.filter(t => t.value).map((tab) => (
          <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${statusFilter === tab.value ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
            {tab.label} ({statusCounts[tab.value] || 0})
          </button>
        ))}
      </div>

      <div className="mb-3 flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={filteredOrders.length > 0 && filteredOrders.filter((o) => !o.deleted).length > 0 && selectedOrders.length === filteredOrders.filter((o) => !o.deleted).length} onChange={toggleSelectAll} />
          Seleccionar todas ({filteredOrders.length})
        </label>
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState icon="order" title="No hay órdenes" description={statusFilter ? `No hay órdenes con estado "${statusFilter}".` : "Cuando los clientes realicen pedidos, aparecerán aquí."} />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const displayNumber = order.orderNumber || order.order?.orderNumber || order.id;
            const isDeleted = !!(order.deleted || order.order?.deleted);
            const deletedReason = order.deletedReason || order.order?.deletedReason || null;
            const itemCount = order.orderItems?.length || 0;

            return (
              <div key={order.id} className={`bg-white border rounded-lg p-4 transition hover:shadow-sm ${selectedOrders.includes(order.id) ? "ring-2 ring-red-500 border-red-300" : "border-gray-200"} ${isDeleted ? "opacity-60" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelect(order.id)} disabled={isDeleted} className="mt-1" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">Orden #{displayNumber}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {order.status}
                        </span>
                        {order.paymentStatus && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_COLORS[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                            {order.paymentStatus}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{formatDate(order.createdAt)}</span>
                        <span>{itemCount} producto{itemCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-9 sm:ml-0">
                    <p className="font-bold text-green-700 text-lg whitespace-nowrap">S/ {typeof order.total === "number" ? order.total.toFixed(2) : "0.00"}</p>
                    {isDeleted ? (
                      <span className="text-xs text-red-600">Eliminada: {deletedReason || "—"}</span>
                    ) : (
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium">Ver detalle</button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
