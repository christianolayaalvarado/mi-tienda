"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"

export const dynamic = "force-dynamic";

// 🔹 Componente con toda la lógica
function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("orderId")

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [proofFile, setProofFile] = useState(null)

  useEffect(() => {
    if (!orderId) {
      router.push("/")
      return
    }
    fetchOrder()
  }, [orderId])

  // 🔹 cargar orden
  const fetchOrder = async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error("Error cargando orden")
        return
      }
      setOrder(data)
    } catch (err) {
      console.error(err)
      toast.error("Error cargando orden")
    } finally {
      setLoading(false)
    }
  }

  if (!orderId) return <p className="p-6 text-gray-600">Esperando ID de orden...</p>
  if (loading) return <p className="p-6 text-gray-600">Cargando orden...</p>
  if (!order) return <p className="p-6 text-red-500">Orden no encontrada</p>

  // 🔹 seleccionar archivo
  const handleFileChange = (e) => {
    setProofFile(e.target.files[0])
  }

  // 🔹 subir comprobante
  const handleUploadProof = async (e) => {
    e.preventDefault()
    if (!proofFile) {
      toast.error("Selecciona un archivo")
      return
    }
    const loadingToast = toast.loading("Subiendo comprobante...")
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", proofFile)
      const res = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error()
      toast.dismiss(loadingToast)
      toast.success("Comprobante enviado")
      setProofFile(null)
      fetchOrder()
    } catch (err) {
      console.error(err)
      toast.dismiss(loadingToast)
      toast.error("Error subiendo comprobante")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      {/* HEADER */}
      <div className="text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-2">¡Pedido confirmado!</h1>
        <p className="text-gray-600">Completa tu pago para procesar la orden.</p>
        <p className="text-sm text-gray-500 mt-2">Orden #{order.id}</p>
      </div>

      {/* 🔥 STORES (MULTI-TIENDA) */}
      {order.stores?.map((store) => (
        <div key={store.id} className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">{store.name}</h2>
          <p className="text-gray-600">
            Estado:{" "}
            <span
              className={
                store.paymentStatus === "paid"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {store.paymentStatus}
            </span>
          </p>

          {/* 🔥 YAPE */}
          {store.paymentStatus !== "paid" && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Pagar con Yape</h3>
              <p className="text-sm mb-2">Escanea el QR o paga al número:</p>
              <p className="font-bold text-lg">+51 959 502168</p>
              <img src="/images/yape-qr.png" alt="QR Yape" className="w-40 mt-2" />

              {/* SUBIR COMPROBANTE */}
              <form onSubmit={handleUploadProof} className="mt-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  className="mb-2"
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-purple-600 text-white px-4 py-2 rounded w-full"
                >
                  {uploading ? "Subiendo..." : "Enviar comprobante"}
                </button>
              </form>
            </div>
          )}
        </div>
      ))}

      {/* ACCIONES */}
      <div className="flex justify-center gap-4">
        <Link
          href="/"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Seguir comprando
        </Link>
        <Link
          href="/dashboard/orders"
          className="border px-6 py-3 rounded-lg hover:bg-gray-100"
        >
          Ver mis órdenes
        </Link>
      </div>
    </div>
  )
}

// 🔹 Envolver en Suspense para useSearchParams
export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-600">Cargando...</p>}>
      <OrderSuccessContent />
    </Suspense>
  )
}
