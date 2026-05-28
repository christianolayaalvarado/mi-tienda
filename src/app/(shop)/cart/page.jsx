"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 🔥 Finalizar compra directo (sin checkout)
  const handleDirectCheckout = async () => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login?callbackUrl=/cart");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cartItems }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error al crear orden");
        return;
      }

      clearCart();
      router.push(`/order-success?orderId=${data.orderId}`);
    } catch (error) {
      console.error("Error en checkout:", error);
      alert("Error procesando la compra");
    }
  };

  if (!cartItems.length) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
        <button
          onClick={() => router.push("/")}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Ir a comprar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Carrito</h1>

      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border p-4 rounded"
          >
            <div>
              <h2 className="font-semibold">{item.title}</h2>
              <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
              <p className="text-sm text-gray-500">Precio: S/ {item.price}</p>
            </div>
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-600 text-sm"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {/* 🔹 Total y acciones */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">
          Total: S/ {total.toFixed(2)}
        </h2>

        <div className="flex gap-4">
          {/* Proceder al pago → Checkout */}
          <button
            onClick={() => router.push("/checkout")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Proceder al pago
          </button>

          {/* Finalizar compra directo */}
          <button
            onClick={handleDirectCheckout}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Finalizar compra
          </button>
        </div>
      </div>
    </div>
  );
}
