"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/Breadcrumbs";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // 🔹 cargar órdenes
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");

      if (!res.ok) throw new Error("Error en API");

      const data = await res.json();

      // Normalizar la respuesta para que la UI siempre encuentre los campos esperados
      let ordersArray = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : [];

      ordersArray = ordersArray.map((o) => {
        const nested = o.order || {};
        return {
          // conservar propiedades originales
          ...o,
          // normalizaciones/fallbacks
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

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔹 selección individual (ignora órdenes ya eliminadas)
  const toggleSelect = (id) => {
    const ord = orders.find((o) => o.id === id);
    if (!ord || ord.deleted) return; // no permitir seleccionar eliminadas

    setSelectedOrders((prev) =>
      prev.includes(id)
        ? prev.filter((o) => o !== id)
        : [...prev, id]
    );
  };

  // 🔹 seleccionar todos (solo no eliminadas)
  const toggleSelectAll = () => {
    const selectable = orders.filter((o) => !o.deleted).map((o) => o.id);
    if (selectedOrders.length === selectable.length && selectable.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(selectable);
    }
  };

  // 🔥 eliminar múltiples órdenes (mantengo comportamiento actual)
  const handleDeleteSelected = async () => {
    const toDelete = selectedOrders.slice();
    if (toDelete.length === 0) return;

    const confirmDelete = confirm(
      `¿Eliminar ${toDelete.length} orden(es)?`
    );
    if (!confirmDelete) return;

    const loadingToast = toast.loading("Eliminando órdenes...");
    setDeleting(true);

    try {
      const res = await fetch("/api/orders/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: toDelete }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        toast.dismiss(loadingToast);
        toast.error(data.error || "Error eliminando");
        return;
      }

      toast.dismiss(loadingToast);
      toast.success(`Eliminadas ${data.count || toDelete.length} órdenes`);
      await fetchOrders();

    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("Error eliminando órdenes");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="p-4 text-gray-600">Cargando órdenes...</p>;
  }

  return (
    <div className="p-6">
      <Breadcrumbs />

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 mt-4">
        <h1 className="text-2xl font-bold">Mis Órdenes</h1>

        <button
          onClick={handleDeleteSelected}
          disabled={selectedOrders.length === 0 || deleting}
          className={`px-4 py-2 rounded text-white transition ${
            selectedOrders.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {deleting
            ? "Eliminando..."
            : `🗑 Eliminar (${selectedOrders.length})`}
        </button>
      </div>

      {/* SELECT ALL */}
      <div className="mb-4 flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={
              orders.length > 0 &&
              orders.filter((o) => !o.deleted).length > 0 &&
              selectedOrders.length === orders.filter((o) => !o.deleted).length
            }
            onChange={toggleSelectAll}
          />
          Seleccionar todos
        </label>

        {selectedOrders.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedOrders.length} seleccionadas
          </span>
        )}
      </div>

      {/* LISTADO */}
      {orders.length === 0 ? (
        <p>No tienes órdenes</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            // Mostrar orderNumber si existe, si no fallback a id
            const displayNumber = order.orderNumber || order.order?.orderNumber || order.id;

            // Normalizar campos de eliminación (ya hechos en fetchOrders, pero mantenemos fallback)
            const isDeleted = !!(order.deleted || order.order?.deleted);
            const deletedReason = order.deletedReason || order.order?.deletedReason || null;
            const deletedAt = order.deletedAt || order.order?.deletedAt || null;

            return (
              <div
                key={order.id}
                className={`border p-4 rounded flex justify-between items-center transition ${
                  selectedOrders.includes(order.id)
                    ? "ring-2 ring-red-500"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">

                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => toggleSelect(order.id)}
                    disabled={isDeleted}
                  />

                  <div>
                    <p className="font-semibold">
                      Orden #{displayNumber}
                    </p>

                    <p className="text-sm text-gray-600">
                      Total: S/{" "}
                      {typeof order.total === "number"
                        ? order.total.toFixed(2)
                        : "0.00"}
                    </p>

                    <p className="text-sm">
                      Estado:{" "}
                      <span
                        className={
                          order.status === "paid"
                            ? "text-green-600"
                            : order.status === "cancelled"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }
                      >
                        {order.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Área de acciones / detalle a la derecha */}
                <div className="flex items-center gap-4">
                  {/* Si la orden está eliminada, mostrar detalle aquí (misma línea) */}
                  {isDeleted ? (
                    <div className="text-sm text-red-600 mr-2">
                      <strong>Orden eliminada</strong> • Razón: {deletedReason || "—"} • Fecha:{" "}
                      {deletedAt ? formatDate(deletedAt) : "—"}
                    </div>
                  ) : null}

                  <Link href={`/dashboard/orders/${order.id}`}>
                    <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Ver detalle
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
