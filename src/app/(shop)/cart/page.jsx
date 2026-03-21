"use client"

// ---------------- IMPORTACIONES ----------------
// Contexto del carrito
import { useCart } from "@/context/CartContext"

// Componentes de Next.js
import Image from "next/image"
import Link from "next/link"

// Componente de productos recomendados
import RecommendedProducts from "@/components/RecommendedProducts"


export default function CartPage() {

  // ---------------- ESTADO DEL CARRITO ----------------
  // Funciones y datos que vienen del CartContext
const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = useCart()

  // ---------------- CALCULO DEL PRECIO TOTAL ----------------
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // ---------------- CALCULO DE UNIDADES TOTALES ----------------
  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  // ---------------- PRODUCTOS RECOMENDADOS (DEMO) ----------------
  // Luego estos podrían venir de una API o base de datos
  const recommended = [
    { id: 1, title: "Producto recomendado 1", price: 45 },
    { id: 2, title: "Producto recomendado 2", price: 30 },
    { id: 3, title: "Producto recomendado 3", price: 55 },
    { id: 4, title: "Producto recomendado 4", price: 25 }
  ]

  // ---------------- SI EL CARRITO ESTA VACIO ----------------
  if (cartItems.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-4">Tu carrito</h1>
        <p className="text-gray-500">El carrito está vacío.</p>
      </div>
    )
  }

  // ---------------- CONTENIDO PRINCIPAL DEL CARRITO ----------------
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">

      {/* TITULO */}
      <h1 className="text-2xl font-bold mb-6">
        Tu carrito
      </h1>

      {/* GRID PRINCIPAL: PRODUCTOS + RESUMEN */}
      <div className="grid md:grid-cols-3 gap-10">

        {/* ---------------- LISTA DE PRODUCTOS ---------------- */}
        <div className="md:col-span-2 space-y-6">

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border-b pb-4"
            >

              {/* IMAGEN DEL PRODUCTO */}
              <div className="w-20 h-20 relative">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover rounded"
                />
              </div>

              {/* INFORMACION DEL PRODUCTO */}
              <div className="flex-1">
                <h2 className="font-semibold">
                  {item.name}
                </h2>

                <p className="text-gray-500 text-sm">
                  S/ {item.price} × {item.quantity}
                </p>
              </div>

              {/* CONTROL DE CANTIDAD */}
              <div className="flex items-center gap-2">

                <button
                  onClick={() => decreaseQuantity(item.id)}
                  disabled={item.quantity <= 1}
                  className="px-2 py-1 border rounded disabled:opacity-40"
                >
                  -
                </button>

                <span className="w-6 text-center">
                  {item.quantity}
                </span>

                <button
                  onClick={() => increaseQuantity(item.id)}
                  disabled={item.quantity >= item.stock}
                  className="px-2 py-1 border rounded disabled:opacity-40"
                >
                  +
                </button>

              </div>

              {/* PRECIO TOTAL DEL PRODUCTO */}
              <p className="w-24 text-right font-semibold">
                S/ {(item.price * item.quantity).toFixed(2)}
              </p>

              {/* ELIMINAR PRODUCTO */}
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 text-sm"
              >
                Eliminar
              </button>

            </div>
          ))}

        </div>

        {/* ---------------- RESUMEN DEL PEDIDO ---------------- */}
        <div className="border rounded-xl p-6 h-fit sticky top-24 shadow-sm">

          <h2 className="text-lg font-semibold mb-4">
            Resumen del pedido
          </h2>

          <div className="space-y-2 text-sm">

            <div className="flex justify-between">
              <span>Productos</span>
              <span>{totalItems}</span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>S/ {totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-gray-500">
              <span>Envío</span>
              <span>Calculado en el checkout</span>
            </div>

          </div>

          <div className="border-t mt-4 pt-4 flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-green-700">
              S/ {totalPrice.toFixed(2)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="mt-5 block w-full text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
          >
            Proceder al pago
          </Link>

        </div>

      </div>

      {/* ---------------- ACCIONES DEL CARRITO ---------------- */}
      <div className="mt-8 border-t pt-6 flex justify-between items-center">

        <button
          onClick={clearCart}
          className="text-sm text-gray-500"
        >
          Vaciar carrito
        </button>

        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline ml-4"
        >
          Seguir comprando
        </Link>

        <div className="text-right">

          <p className="text-2xl font-bold text-green-700">
            Total: S/ {totalPrice.toFixed(2)}
          </p>

          <Link
            href="/checkout"
            className="mt-2 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Finalizar compra
          </Link>

        </div>

      </div>

      {/* ---------------- PRODUCTOS RECOMENDADOS ---------------- */}
      {/* Se coloca al final de la página del carrito */}
      <RecommendedProducts products={recommended} />

    </div>
  )
}