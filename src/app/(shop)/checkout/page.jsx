// src/app/(shop)/checkout/page.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PaymentMethodSelector from "../../../components/PaymentMethodSelector";
import toast from "react-hot-toast";

/**
 * CheckoutPage
 * - Lee carrito desde localStorage ("cart") o fallback /api/cart
 * - Normaliza items y calcula total
 * - Envía orden a POST /api/orders
 * - Limpia carrito y redirige a /orders/[id] o /orders tras crear la orden
 */

export default function CheckoutPage({ params }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const paramSellerId = params?.sellerId || null;
  const sellerId = paramSellerId || session?.user?.id || null;

  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [rawCart, setRawCart] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const parsePrice = (p) => {
    if (p == null) return 0;
    if (typeof p === "number") return p;
    if (typeof p === "string") {
      const cleaned = p.replace(/[^\d.,-]/g, "").replace(",", ".");
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    if (typeof p === "object") {
      if (p.amount != null) return parsePrice(p.amount);
      if (p.value != null) return parsePrice(p.value);
      if (p.price != null) return parsePrice(p.price);
    }
    return 0;
  };

  const normalizeItem = (it, idx) => {
    const price = parsePrice(it.price ?? it.unitPrice ?? it.priceAmount ?? it.amount ?? it.rawPrice);
    const quantity = Number(it.quantity ?? it.qty ?? 1) || 1;
    return {
      productId: it.productId ?? it.id ?? `unknown-${idx}`,
      title: it.title ?? it.name ?? it.productName ?? "",
      price,
      quantity,
      storeId: it.storeId ?? it.store ?? null,
      raw: it,
    };
  };

  const normalizeCart = (raw) => {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === "object" && parsed.cart && Array.isArray(parsed.cart.items)) {
        return parsed.cart.items.map((it, idx) => normalizeItem(it, idx));
      }
      if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
        return parsed.items.map((it, idx) => normalizeItem(it, idx));
      }
      if (Array.isArray(parsed)) {
        return parsed.map((it, idx) => normalizeItem(it, idx));
      }
      return [];
    } catch (err) {
      console.error("normalizeCart parse error:", err, raw);
      return [];
    }
  };

  useEffect(() => {
    const loadCart = async () => {
      try {
        if (typeof window === "undefined") {
          setOrderItems([]);
          setRawCart(null);
          setLoading(false);
          return;
        }

        const raw = localStorage.getItem("cart");
        try {
          setRawCart(raw ? JSON.parse(raw) : raw);
        } catch {
          setRawCart(raw);
        }

        if (raw) {
          const normalized = normalizeCart(raw);
          setOrderItems(normalized);
          setLoading(false);
          return;
        }

        // Fallback opcional a /api/cart
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            setRawCart(data);
            const normalized = normalizeCart(data);
            setOrderItems(normalized);
            setLoading(false);
            return;
          }
        } catch (err) {
          // ignore fallback error
        }

        setOrderItems([]);
        setLoading(false);
      } catch (err) {
        console.error("Error loading cart in checkout:", err);
        setOrderItems([]);
        setRawCart(null);
        setError("No se pudo cargar el carrito");
        setLoading(false);
      }
    };

    if (status === "loading") return;
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    setPaymentMethodId(null);
  }, [sellerId]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "cart") return;
      try {
        setRawCart(e.newValue ? JSON.parse(e.newValue) : null);
      } catch {
        setRawCart(e.newValue);
      }
      const normalized = normalizeCart(e.newValue || "[]");
      setOrderItems(normalized);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  }, []);

  const total = useMemo(
    () => orderItems.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0),
    [orderItems]
  );

  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v);

  const handleSubmit = async () => {
    if (!sellerId) {
      toast.error("No se pudo determinar el vendedor (sellerId).");
      return;
    }
    if (!paymentMethodId) {
      toast.error("Selecciona una forma de pago");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          customer: { name: session?.user?.name || "Cliente", email: session?.user?.email || "" },
          paymentMethodId,
          total,
        }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const message = (data && data.error) || `Error creando orden (status ${res.status})`;
        throw new Error(message);
      }

      // Éxito: limpiar carrito y redirigir
      try {
        localStorage.removeItem("cart");
      } catch (e) {
        console.warn("No se pudo limpiar localStorage:", e);
      }

      toast.success("Orden creada correctamente");

      // Intentar obtener id o orderNumber del body
      const orderId = data?.id || data?.order?.id || data?.orderNumber || null;
      if (orderId) {
        router.push(`/orders/${orderId}`);
        return;
      }
      router.push("/orders");
    } catch (err) {
      console.error("Error creando orden:", err);
      toast.error(err?.message || "Error creando orden");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6">Cargando checkout…</p>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      {!sellerId ? (
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-sm text-yellow-800">No se pudo determinar el vendedor. Inicia sesión o revisa la ruta.</p>
        </div>
      ) : (
        <>
          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Formas de pago disponibles</h3>
            <PaymentMethodSelector sellerId={sellerId} onSelect={setPaymentMethodId} />
            {!paymentMethodId && <p className="text-sm text-gray-500 mt-2">Selecciona una forma de pago para continuar.</p>}
          </section>

          <div className="mb-6">
            <h3 className="text-lg font-semibold">Resumen</h3>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <p className="text-sm text-gray-600">Items: {orderItems.length}</p>
            <p className="text-sm text-gray-600">Total: {formatCurrency(total)}</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!paymentMethodId || orderItems.length === 0 || submitting}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Procesando..." : "Confirmar pedido"}
          </button>
        </>
      )}
    </div>
  );
}
