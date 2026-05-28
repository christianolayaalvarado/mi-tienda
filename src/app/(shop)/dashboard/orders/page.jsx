"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

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

      // 🔥 FIX REAL (evita orders.map error SIEMPRE)
      const ordersArray = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
        ? data.orders
        : [];

      setOrders(ordersArray);
      setSelectedOrders([]);

    } catch (err) {
      console.error(err);
      toast.error("Error cargando órdenes");
      setOrders([]); // 🔥 evita crash UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔹 selección individual
  const toggleSelect = (id) => {
    setSelectedOrders((prev) =>
      prev.includes(id)
        ? prev.filter((o) => o !== id)
        : [...prev, id]
    );
  };

  // 🔹 seleccionar todos
  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o.id));
    }
  };

  // 🔥 eliminar múltiples órdenes
  const handleDeleteSelected = async () => {
    if (selectedOrders.length === 0) return;

    const confirmDelete = confirm(
      `¿Eliminar ${selectedOrders.length} orden(es)?`
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
        body: JSON.stringify({ ids: selectedOrders }),
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

      // 🔥 mejora UX: mostrar cantidad eliminada
      toast.success(`Eliminadas ${data.count || selectedOrders.length} órdenes`);

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

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
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
              selectedOrders.length === orders.length
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
          {orders.map((order) => (
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
                />

                <div>
                  <p className="font-semibold">
                    Orden #{order.id}
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

              <Link href={`/dashboard/orders/${order.id}`}>
                <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                  Ver detalle
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}