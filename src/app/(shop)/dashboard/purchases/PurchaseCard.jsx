"use client"

import Link from "next/link"
import { useState } from "react"
import { useNotification } from "@/context/NotificationContext"

export default function PurchaseCard({ order, showActions, onOrderCancelled }) {
  const [loadingCancel, setLoadingCancel] = useState(false)
  const { addNotification } = useNotification()

  // ❌ Cancelar ORDEN COMPLETA
  const handleCancelOrder = async () => {
    if (loadingCancel) return

    const confirmCancel = confirm("¿Seguro que deseas cancelar toda la orden?")
    if (!confirmCancel) return

    try {
      setLoadingCancel(true)

      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        addNotification(data?.error || "Error al cancelar orden", "error")
        return
      }

      addNotification("Orden cancelada correctamente", "success")

      // 🔥 actualizar TODO
      onOrderCancelled?.(order.id)

    } catch (error) {
      console.error(error)
      addNotification("Error inesperado", "error")
    } finally {
      setLoadingCancel(false)
    }
  }

  // ❌ Cancelar SOLO UNA TIENDA
  const handleCancelStore = async (orderItemId) => {
    if (loadingCancel) return

    const confirmCancel = confirm("¿Cancelar compra de esta tienda?")
    if (!confirmCancel) return

    try {
      setLoadingCancel(true)

      const res = await fetch(`/api/order-items/${orderItemId}/cancel`, {
        method: "POST",
      })

      let data = {}
      try {
        data = await res.json()
      } catch {}

      if (!res.ok) {
        addNotification(data?.error || "Error al cancelar tienda", "error")
        return
      }

      addNotification("Compra de tienda cancelada", "success")

      // 🔥 actualizar SOLO esa tienda
      onOrderCancelled?.(order.id, orderItemId)

    } catch (error) {
      console.error(error)
      addNotification("Error inesperado", "error")
    } finally {
      setLoadingCancel(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm">

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Orden #{order.id}</h2>

        <span
          className={`px-2 py-1 rounded text-white ${
            order.status === "pending"
              ? "bg-yellow-500"
              : order.status === "paid"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {order.status?.toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <p className="text-sm mb-2">
        Fecha: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
      </p>

      <p className="text-sm mb-2">
        Total: S/. {Number(order.total ?? 0).toFixed(2)}
      </p>

      {/* Sub-órdenes */}
      {order.orderItems?.map((sub) => (
        <div key={sub.id} className="pl-4 mb-3 border-l">

          <div className="flex justify-between items-center">
            <h3 className="font-medium">
              {sub.store?.name || "Tienda"}
            </h3>

            {/* ❌ Botón cancelar por tienda */}
            {sub.paymentStatus === "pending" && (
              <button
                onClick={() => handleCancelStore(sub.id)}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancelar tienda
              </button>
            )}
          </div>

          <p className="text-xs mb-1">
            Estado tienda:{" "}
            <span
              className={`font-semibold ${
                sub.paymentStatus === "paid"
                  ? "text-green-600"
                  : sub.paymentStatus === "pending"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {sub.paymentStatus || "unknown"}
            </span>
          </p>

          <ul className="list-disc pl-5">
            {sub.items?.map((item) => (
              <li key={item.id}>
                {item.quantity} x {item.product?.title || "Producto"} - S/.{" "}
                {Number(item.price ?? 0).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Acciones */}
      {showActions && (
        <div className="mt-3 flex gap-3 items-center">

          <Link
            href={`/dashboard/orders/${order.id}`}
            className="text-blue-500 hover:underline"
          >
            Ver detalle
          </Link>

          {/* ❌ Cancelar orden completa */}
          {order.status === "pending" && (
            <button
              onClick={handleCancelOrder}
              disabled={loadingCancel}
              className={`px-3 py-1 rounded text-white transition ${
                loadingCancel
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loadingCancel ? "Cancelando..." : "Cancelar orden"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}