"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CartPage() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();

  const total = (cartItems || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
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

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || "Error al crear orden");
        return;
      }

      clearCart();
      router.push(`/order-success?orderId=${data.orderId}`);
    } catch (error) {
      console.error("Error en checkout:", error);
      alert("Error procesando la compra");
    }
  };

  if (!cartItems || cartItems.length === 0) {
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
        {cartItems.map((item) => {
          const imgSrc =
            item.product?.image ||
            item.image ||
            item.productImage ||
            item.thumbnail ||
            "/images/placeholder.png";
      
                            // leer localStorage para usar nombre si el servidor no lo trae
const localRaw = (() => {
  try {
    const raw = localStorage.getItem("mi_tienda_cart");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
})();

const findLocalName = (pid) => {
  if (!localRaw || !Array.isArray(localRaw)) return null;
  const found = localRaw.find((x) => String(x.productId ?? x.id) === String(pid));
  return found ? (found.name || found.title || null) : null;
};

const displayName =
  item.title ||
  item.product?.title ||
  item.name ||
  findLocalName(item.productId ?? item.id) ||
  `Producto #${item.productId ?? item.id}`;


          return (
            <div
              key={item.id || `${item.productId}-${item.variantId || 0}`}
              className="flex items-center justify-between border p-4 rounded"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={imgSrc}
                    alt={item.title || item.product?.title || "Producto"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/images/placeholder.png";
                    }}
                  />
                </div>

                <div>
                  

<h2 className="font-semibold">{displayName}</h2>



                  <p className="text-sm text-gray-500">Cantidad: {Number(item.quantity || 0)}</p>
                  <p className="text-sm text-gray-500">
                    Precio unitario: S/ {Number(item.price || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-gray-700 font-semibold">
                  S/ {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 text-sm"
                    aria-label={`Eliminar ${item.title || item.product?.title || "producto"}`}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔹 Total y acciones */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">Total: S/ {total.toFixed(2)}</h2>

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
