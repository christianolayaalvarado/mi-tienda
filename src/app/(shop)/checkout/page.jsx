// src/app/(shop)/checkout/page.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PaymentMethodSelector from "../../../components/PaymentMethodSelector";
import toast from "react-hot-toast";
import { fetchSession } from "@/lib/useSessionCheck";
import Breadcrumbs from "@/components/Breadcrumbs";

/* -------------------------
   Utilidades para el carrito
   ------------------------- */
function readCartRaw() {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

function writeCartRaw(value) {
  try {
    if (value == null) {
      localStorage.removeItem("cart");
    } else {
      localStorage.setItem("cart", JSON.stringify(value));
    }
    try {
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore
    }
  } catch (err) {
    console.warn("No se pudo escribir carrito:", err);
  }
}

function removeProductsFromCart(productIdsToRemove = []) {
  if (!Array.isArray(productIdsToRemove) || productIdsToRemove.length === 0) return;

  const raw = readCartRaw();
  if (!raw) return;

  const normalizeItemPid = (it, idx) => {
    return it?.productId ?? it?.id ?? `unknown-${idx}`;
  };

  if (Array.isArray(raw)) {
    const filtered = raw.filter((it, idx) => {
      const pid = normalizeItemPid(it, idx);
      return !productIdsToRemove.includes(String(pid));
    });
    writeCartRaw(filtered.length ? filtered : null);
    return;
  }

  if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    const filteredItems = raw.items.filter((it, idx) => {
      const pid = normalizeItemPid(it, idx);
      return !productIdsToRemove.includes(String(pid));
    });
    if (filteredItems.length === 0) {
      writeCartRaw(null);
    } else {
      writeCartRaw({ ...raw, items: filteredItems });
    }
    return;
  }

  if (raw && typeof raw === "object" && raw.cart && Array.isArray(raw.cart.items)) {
    const filteredItems = raw.cart.items.filter((it, idx) => {
      const pid = normalizeItemPid(it, idx);
      return !productIdsToRemove.includes(String(pid));
    });
    if (filteredItems.length === 0) {
      writeCartRaw(null);
    } else {
      writeCartRaw({ ...raw, cart: { ...raw.cart, items: filteredItems } });
    }
    return;
  }

  console.warn("Formato de carrito no reconocido, no se eliminó nada.");
}

/* -------------------------
   Normalización y utilidades
   ------------------------- */
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

/* -------------------------
   Componente CheckoutPage
   ------------------------- */
export default function CheckoutPage({ params }) {
  const router = useRouter();
  const paramSellerId = params?.sellerId || null;

  const [sellerId, setSellerId] = useState(paramSellerId || null);
  const [sessionUser, setSessionUser] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("loading");
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderItems, setOrderItems] = useState([]);
  const [rawCart, setRawCart] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Shipping state
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingDepartment, setShippingDepartment] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setSessionStatus("loading");
        const user = await fetchSession();
        setSessionUser(user);
        if (!user) {
          setSellerId(paramSellerId || null);
          setSessionStatus("unauthenticated");
          return;
        }

        const resolvedSellerId = paramSellerId || user.id || user._id || user.userId || null;
        setSellerId(resolvedSellerId);
        setSessionStatus("authenticated");
      } catch (err) {
        console.warn("No se pudo cargar la sesión para checkout:", err);
        setSessionUser(null);
        setSellerId(paramSellerId || null);
        setSessionStatus("unauthenticated");
      }
    };

    loadSession();
  }, [paramSellerId]);

  useEffect(() => {
    const loadCart = async () => {
      try {
        if (typeof window === "undefined") {
          setOrderItems([]);
          setRawCart(null);
          setLoading(false);
          return;
        }

        if (sessionStatus === "authenticated") {
          try {
            const res = await fetch("/api/cart", { credentials: "include", headers: { Accept: "application/json" } });
            if (res.ok) {
              const data = await res.json();
              const cartItems = data?.cart?.items || [];
              const normalized = cartItems.map((it, idx) => normalizeItem(it, idx));
              setRawCart(data);
              setOrderItems(normalized);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn("No se pudo cargar carrito desde /api/cart", err);
          }
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

    if (sessionStatus === "loading") return;
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  useEffect(() => {
    const cleanupPaidItems = async () => {
      try {
        const res = await fetch("/api/orders/paid-product-ids", { method: "GET", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const productIds = Array.isArray(data?.productIds) ? data.productIds : [];
        if (productIds.length > 0) {
          removeProductsFromCart(productIds);
          const raw = readCartRaw();
          const normalized = normalizeCart(raw || "[]");
          setRawCart(raw);
          setOrderItems(normalized);
        }
      } catch (err) {
        console.warn("No se pudo limpiar carrito automáticamente:", err);
      }
    };

    if (sessionStatus !== "loading") {
      cleanupPaidItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

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

  const grandTotal = total + shippingCost;

  const formatCurrency = (v) =>
    new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(v);

  // Calculate shipping cost
  const calculateShipping = async (department, city) => {
    if (!department || !sellerId) {
      setShippingCost(0);
      setShippingEstimate(null);
      return;
    }

    // Get storeId from first item
    const storeId = orderItems[0]?.storeId;
    if (!storeId) return;

    setCalculatingShipping(true);
    try {
      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, department, province: city }),
      });
      const data = await res.json().catch(() => null);
      if (data) {
        setShippingCost(data.shippingCost || 0);
        setShippingEstimate(data.estimatedDays ? `${data.estimatedDays} días hábiles` : null);
      }
    } catch (err) {
      console.error("Error calculating shipping:", err);
      setShippingCost(0);
      setShippingEstimate(null);
    } finally {
      setCalculatingShipping(false);
    }
  };

  /* -------------------------
     Envío de la orden (único handleSubmit)
     ------------------------- */
  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (submitting) return;

    if (!sellerId) {
      toast.error("No se pudo determinar el vendedor (sellerId).");
      return;
    }
    if (!paymentMethodId) {
      toast.error("Selecciona una forma de pago");
      return;
    }
    if (!orderItems || orderItems.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading("Creando orden...");

    // generar clientOrderId para idempotencia
    let clientOrderId = null;
    try {
      clientOrderId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `co_${Date.now()}`;
    } catch {
      clientOrderId = `co_${Date.now()}`;
    }

    try {
      const payload = {
        clientOrderId,
        items: orderItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          price: it.price,
          storeId: it.storeId,
        })),
        total: grandTotal,
        customer: {
          name: sessionUser?.name || "",
          email: sessionUser?.email || "",
        },
        paymentMethodId: paymentMethodId || null,
        sellerId: sellerId || null,
        shipping: {
          address: shippingAddress,
          city: shippingCity,
          department: shippingDepartment,
          postalCode: shippingPostalCode,
          cost: shippingCost,
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => null);
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        const message = (json && (json.error || json.message)) || text || `Error creando orden (status ${res.status})`;
        throw new Error(message);
      }

      const createdOrder = (json && (json.order || json)) || null;
      toast.dismiss(loadingToast);
      toast.success("Orden creada correctamente");

      // limpiar carrito local
      try {
        writeCartRaw(null);
      } catch (err) {
        console.warn("No se pudo limpiar carrito local:", err);
      }

      // redirigir a detalle si tenemos id
      const orderId = createdOrder?.id || createdOrder?._id || null;
      if (orderId) {
        router.push(`/dashboard/orders/${orderId}`);
      } else {
        router.push("/dashboard/orders");
      }
    } catch (err) {
      console.error("Error creando orden:", err);
      toast.dismiss(loadingToast);
      toast.error(err?.message || "Error creando orden");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------
     Render
     ------------------------- */
  if (loading) return <div className="p-4 text-gray-600">Cargando carrito...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumbs />

      <h1 className="text-2xl font-semibold mb-4 mt-4">Checkout</h1>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="mb-6">
        <h2 className="font-medium">Items</h2>
        {orderItems.length === 0 ? (
          <p className="text-sm text-gray-500">No hay items en el carrito.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {orderItems.map((it) => (
              <li key={it.productId} className="flex justify-between items-center border p-3 rounded">
                <div>
                  <div className="font-medium">{it.title}</div>
                  <div className="text-xs text-gray-500">Cantidad: {it.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{formatCurrency(it.price)}</div>
                  <div className="font-semibold">{formatCurrency(it.price * it.quantity)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-6">
        <h2 className="font-medium">Método de pago</h2>
        <PaymentMethodSelector
          sellerId={sellerId}
          value={paymentMethodId}
          onChange={(v) => setPaymentMethodId(v)}
        />
      </div>

      {/* Dirección de envío */}
      <div className="mb-6 bg-gray-50 border rounded-lg p-4">
        <h2 className="font-medium mb-3">Dirección de envío</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Dirección completa *</label>
            <input
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
              placeholder="Av. Ejemplo 123, urb. Los Olivos"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Departamento *</label>
            <select
              value={shippingDepartment}
              onChange={(e) => {
                setShippingDepartment(e.target.value);
                calculateShipping(e.target.value, shippingCity);
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            >
              <option value="">Seleccionar</option>
              <option value="Lima">Lima</option>
              <option value="Arequipa">Arequipa</option>
              <option value="Cusco">Cusco</option>
              <option value="Piura">Piura</option>
              <option value="La Libertad">La Libertad</option>
              <option value="Junín">Junín</option>
              <option value="Lambayeque">Lambayeque</option>
              <option value="Ancash">Ancash</option>
              <option value="Ica">Ica</option>
              <option value="Loreto">Loreto</option>
              <option value="San Martín">San Martín</option>
              <option value="Ucayali">Ucayali</option>
              <option value="Cajamarca">Cajamarca</option>
              <option value="Huanuco">Huánuco</option>
              <option value="Puno">Puno</option>
              <option value="Tacna">Tacna</option>
              <option value="Amazonas">Amazonas</option>
              <option value="Apurimac">Apurímac</option>
              <option value="Ayacucho">Ayacucho</option>
              <option value="Huancavelica">Huancavelica</option>
              <option value="Moquegua">Moquegua</option>
              <option value="Pasco">Pasco</option>
              <option value="Tumbes">Tumbes</option>
              <option value="Madre de Dios">Madre de Dios</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Ciudad / Provincia</label>
            <input
              type="text"
              value={shippingCity}
              onChange={(e) => {
                setShippingCity(e.target.value);
                if (shippingDepartment) calculateShipping(shippingDepartment, e.target.value);
              }}
              placeholder="Ej: Lima, Cusco"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Código postal</label>
            <input
              type="text"
              value={shippingPostalCode}
              onChange={(e) => setShippingPostalCode(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Costo de envío */}
        {shippingDepartment && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {calculatingShipping ? "Calculando envío..." : "Costo de envío:"}
            </span>
            <span className={`font-semibold ${shippingCost > 0 ? "text-green-600" : "text-gray-700"}`}>
              {calculatingShipping ? "..." : shippingCost > 0 ? formatCurrency(shippingCost) : "Gratis"}
              {shippingEstimate && !calculatingShipping && (
                <span className="text-xs text-gray-400 ml-2">({shippingEstimate})</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="text-lg font-medium">Subtotal</div>
          <div className="text-xl font-semibold">{formatCurrency(total)}</div>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between items-center text-sm mt-1">
            <div className="text-gray-600">Envío</div>
            <div className="font-medium">{formatCurrency(shippingCost)}</div>
          </div>
        )}
        <div className="flex justify-between items-center border-t mt-2 pt-2">
          <div className="text-lg font-bold">Total</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(grandTotal)}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || orderItems.length === 0 || !paymentMethodId}
            className="ml-auto bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Procesando..." : "Pagar y crear orden"}
          </button>
        </div>
      </form>
    </div>
  );
}
