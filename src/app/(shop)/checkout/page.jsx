"use client";

import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { cartItems, clearCart } = useCart();
  const router = useRouter();

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // método de pago
  const [paymentMethod, setPaymentMethod] = useState("yape");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // CHECKOUT REAL
  async function handleSubmit(e) {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error("Carrito vacío");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Procesando pedido...");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          customer: form,
          paymentMethod,
          total: totalPrice,
        }),
      });

      // Si no OK, intentar leer mensaje de error y mostrarlo
      if (!res.ok) {
        let errText = "Error procesando orden";
        try {
          const errJson = await res.json();
          errText = errJson?.error || JSON.stringify(errJson) || errText;
        } catch {
          try {
            errText = await res.text();
          } catch {}
        }
        toast.dismiss(loadingToast);
        toast.error(errText);
        setLoading(false);
        return;
      }

      // Parsear respuesta segura
      const data = await res.json();

      // Extraer orderId de varias formas posibles
      const orderId =
        data?.id ||
        data?.order?.id ||
        data?.order?._id ||
        data?.orderId ||
        data?.order?._id?.toString() ||
        data?.orderNumber; // fallback a orderNumber si no hay id

      toast.dismiss(loadingToast);
      toast.success("Orden creada correctamente");

      // Limpiar carrito local y backend (clearCart maneja backend internamente)
      try {
        await clearCart();
      } catch (err) {
        // clearCart ya muestra warnings si falla; no bloqueamos la navegación
        console.warn("Warning: clearCart falló", err);
      }

      // Redirigir: si tenemos orderId, ir a página de éxito con id; si no, a lista de órdenes
      if (orderId) {
        // Si orderId parece un orderNumber (no ObjectId), igualmente lo pasamos
        router.push(`/order-success?orderId=${encodeURIComponent(orderId)}`);
      } else {
        router.push("/dashboard/orders");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.dismiss(loadingToast);
      toast.error("Error en el checkout");
    } finally {
      setLoading(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <p className="text-gray-500">No hay productos en el carrito.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold mb-4">Datos del cliente</h1>

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

        {/* MÉTODO DE PAGO */}
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
        <h2 className="text-lg font-semibold mb-4">Tu pedido</h2>

        <div className="space-y-3">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.title || item.name || item.productTitle || "Producto"} × {item.quantity}
              </span>

              <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-green-700">S/ {totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
