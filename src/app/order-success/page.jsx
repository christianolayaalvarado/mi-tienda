"use client"

import Link from "next/link"

export default function OrderSuccessPage() {

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">

      <div className="text-green-600 text-5xl mb-6">
        ✓
      </div>

      <h1 className="text-3xl font-bold mb-4">
        ¡Pedido confirmado!
      </h1>

      <p className="text-gray-600 mb-8">
        Gracias por tu compra. Tu pedido ha sido registrado correctamente.
      </p>

      <div className="space-x-4">

        <Link
          href="/"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Volver a la tienda
        </Link>

        <Link
          href="/cart"
          className="border px-6 py-3 rounded-lg hover:bg-gray-100"
        >
          Ver carrito
        </Link>

      </div>

    </div>
  )
}