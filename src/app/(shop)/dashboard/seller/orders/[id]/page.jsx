"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import toast from "react-hot-toast"

export default function SellerOrderDetailPage() {
  const params = useParams()
  const orderId = params.id

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // 🔹 cargar orden
  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()

      if (!res.ok) throw new Error()

      setOrder(data)
    } catch (err) {
      console.error(err)
      toast.error("Error cargando orden")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) fetchOrder()
  }, [orderId])

  // ✅ aprobar pago
  const handleApprove = async () => {
    const confirmAction = confirm("¿Aprobar este pago?")
    if (!confirmAction) return

    setProcessing(true)
    const loadingToast = toast.loading("Aprobando pago...")

    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      toast.dismiss(loadingToast)
      toast.success("Pago aprobado")

      fetchOrder()

    } catch (err) {
      console.error(err)
      toast.dismiss(loadingToast)
      toast.error("Error aprobando pago")
    } finally {
      setProcessing(false)
    }
  }

  // ❌ rechazar pago
  const handleReject = async () => {
    const confirmAction = confirm("¿Rechazar este pago?")
    if (!confirmAction) return

    setProcessing(true)
    const loadingToast = toast.loading("Rechazando pago...")

    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      toast.dismiss(loadingToast)
      toast.success("Pago rechazado")

      fetchOrder()

    } catch (err) {
      console.error(err)
      toast.dismiss(loadingToast)
      toast.error("Error rechazando pago")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return <p className="p-4">Cargando orden...</p>
  }

  if (!order) {
    return <p className="p-4 text-red-500">Orden no encontrada</p>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">
        Orden #{order.id}
      </h1>

      <p>
        Estado:{" "}
        <span className="font-semibold">
          {order.paymentStatus}
        </span>
      </p>

      {/* 🔥 COMPROBANTE */}
      {order.paymentProof ? (
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">
            Comprobante de pago
          </h2>

          <img
            src={order.paymentProof}
            alt="Comprobante"
            className="w-full max-w-md rounded"
          />
        </div>
      ) : (
        <p className="text-gray-500">
          No hay comprobante subido
        </p>
      )}

      {/* 🔥 BOTONES */}
      {order.paymentStatus === "pending_verification" && (
        <div className="flex gap-4">

          <button
            onClick={handleApprove}
            disabled={processing}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ✅ Aprobar
          </button>

          <button
            onClick={handleReject}
            disabled={processing}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            ❌ Rechazar
          </button>

        </div>
      )}

    </div>
  )
}