"use client"

import { useCart } from "@/context/CartContext"
import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

export default function CheckoutPage() {

  const { cartItems, clearCart } = useCart()
  const router = useRouter()

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  })

  // 🔥 NUEVO: método de pago
  const [paymentMethod, setPaymentMethod] = useState("yape")

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  // 🔥 CHECKOUT REAL
  async function handleSubmit(e) {
    e.preventDefault()

    if (cartItems.length === 0) {
      toast.error("Carrito vacío")
      return
    }

    const loadingToast = toast.loading("Procesando pedido...")
    setLoading(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: cartItems,
          customer: form,
          paymentMethod // 🔥 IMPORTANTE
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.dismiss(loadingToast)
        toast.error(data.error || "Error procesando orden")
        return
      }

      toast.dismiss(loadingToast)
      toast.success("Orden creada correctamente")

      clearCart()

      // 🔥 REDIRECCIÓN CORRECTA
      router.push(`/order-success?orderId=${data.orderId}`)

    } catch (err) {
      console.error(err)
      toast.dismiss(loadingToast)
      toast.error("Error en el checkout")
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <p className="text-gray-500">
          No hay productos en el carrito.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">

      {/* FORMULARIO */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        <h1 className="text-2xl font-bold mb-4">
          Datos del cliente
        </h1>

        <input
          type="text"
          name="name"
          placeholder="Nombre completo"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-2"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-2"
          required
        />

        <input
          type="tel"
          name="phone"
          placeholder="Teléfono"
          value={form.phone}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-2"
          required
        />

        <textarea
          name="address"
          placeholder="Dirección de entrega"
          value={form.address}
          onChange={handleChange}
          className="w-full border rounded-lg px-4 py-2"
          rows={3}
          required
        />

        {/* 🔥 MÉTODO DE PAGO */}
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Método de pago</h2>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="yape"
              checked={paymentMethod === "yape"}
              onChange={() => setPaymentMethod("yape")}
            />
            Yape
          </label>

          {/* futuro */}
          <label className="flex items-center gap-2 opacity-50">
            <input type="radio" disabled />
            Tarjeta (próximamente)
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Confirmar pedido"}
        </button>

      </form>


      {/* RESUMEN DEL PEDIDO */}
      <div className="border rounded-xl p-6 h-fit">

        <h2 className="text-lg font-semibold mb-4">
          Tu pedido
        </h2>

        <div className="space-y-3">

          {cartItems.map(item => (
            <div
              key={item.id}
              className="flex justify-between text-sm"
            >
              <span>
                {item.name} × {item.quantity}
              </span>

              <span>
                S/ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}

        </div>

        <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-green-700">
            S/ {totalPrice.toFixed(2)}
          </span>
        </div>

      </div>

    </div>
  )
}