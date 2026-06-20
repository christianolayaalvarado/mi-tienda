// src/app/(shop)/order-success/OrderSuccessClient.jsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso || "";
  }
}

function normalizeOrderResponse(data) {
  const raw = data?.order ?? data ?? {};
  const id = raw?.id ?? raw?._id ?? data?.id ?? data?.orderId ?? data?.orderNumber ?? null;
  return {
    id,
    orderNumber: raw?.orderNumber ?? data?.orderNumber ?? null,
    createdAt: raw?.createdAt ?? raw?.created_at ?? null,
    total: raw?.total ?? 0,
    paymentStatus: raw?.paymentStatus ?? "unpaid",
    paymentMethod: raw?.paymentMethod ?? "",
    customerName: raw?.customerName ?? raw?.customer?.name ?? "",
    customerEmail: raw?.customerEmail ?? raw?.customer?.email ?? "",
    documentNumber: raw?.documentNumber ?? null,
    paymentProof: raw?.paymentProof ?? null,
    paymentProofMime: raw?.paymentProofMime ?? null,
    stores: (raw?.orderItems ?? []).map((oi) => ({
      id: oi.storeId ?? oi.store?.id ?? oi.id,
      name: oi.store?.name ?? oi.storeName ?? `Tienda ${oi.storeId ?? ""}`,
      paymentStatus: oi.paymentStatus ?? raw?.paymentStatus ?? "unpaid",
      items: (oi.items ?? []).map((it) => ({
        id: it.id ?? it._id,
        productId: it.productId,
        product: it.product ?? { title: it.productTitle ?? "Producto" },
        quantity: it.quantity ?? 1,
        price: it.price ?? 0,
      })),
    })),
  };
}

export default function OrderSuccessClient({ orderId }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethodsByStore, setPaymentMethodsByStore] = useState({});

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchPaymentMethods = async (storeId) => {
    if (!storeId) return;
    try {
      const res = await fetch(`/api/sellers/${encodeURIComponent(storeId)}/payment-methods`);
      if (!res.ok) {
        setPaymentMethodsByStore((prev) => ({ ...prev, [storeId]: [] }));
        return;
      }
      const data = await res.json().catch(() => []);
      setPaymentMethodsByStore((prev) => ({ ...prev, [storeId]: data || [] }));
    } catch (err) {
      console.error("Error cargando métodos de pago:", err);
      setPaymentMethodsByStore((prev) => ({ ...prev, [storeId]: [] }));
    }
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("GET /api/orders/:id failed:", res.status, text);
        toast.error("Error cargando orden");
        setOrder(null);
        return;
      }
      const data = await res.json().catch(() => null);
      if (!data) {
        toast.error("Respuesta inválida del servidor");
        setOrder(null);
        return;
      }
      const normalized = normalizeOrderResponse(data);
      setOrder(normalized);

      if (Array.isArray(normalized.stores)) {
        normalized.stores.forEach((store) => {
          if (store?.id) fetchPaymentMethods(store.id);
        });
      }
    } catch (err) {
      console.error("Fetch order error:", err);
      toast.error("Error cargando orden");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return <p className="p-6 text-gray-600">Esperando ID de orden...</p>;
  if (loading) return <p className="p-6 text-gray-600">Cargando orden...</p>;
  if (!order) return <p className="p-6 text-red-500">Orden no encontrada</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      <div className="text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-2">¡Pedido confirmado!</h1>
        <p className="text-gray-600">Completa tu pago para procesar la orden.</p>
        <p className="text-sm text-gray-500 mt-2">Orden #{order.orderNumber || order.id}</p>
      </div>

      {Array.isArray(order.stores) && order.stores.map((store) => (
        <div key={store.id} className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">{store.name}</h2>
          <p className="text-gray-600">
            Estado:{" "}
            <span className={store.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}>
              {store.paymentStatus}
            </span>
          </p>

          {order.paymentProof && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 font-medium">Comprobante enviado</p>
              <div className="flex items-center gap-3 mt-2">
                <a href={order.paymentProof} target="_blank" rel="noopener noreferrer" className="text-green-600 underline break-all">
                  Ver comprobante
                </a>
                {order.paymentProofMime && order.paymentProofMime.startsWith("image") && (
                  <a href={order.paymentProof} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 overflow-hidden rounded">
                    <img src={order.paymentProof} alt="Comprobante" className="object-cover w-full h-full" />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Formas de pago disponibles</h3>

            {paymentMethodsByStore[store.id] === undefined ? (
              <p className="text-sm text-gray-500">Cargando métodos de pago...</p>
            ) : paymentMethodsByStore[store.id]?.length > 0 ? (
              paymentMethodsByStore[store.id].map(pm => (
                <div key={pm.id} className="mb-4 border rounded p-3">
                  <p className="text-sm mb-1"><strong>Tipo:</strong> {pm.type}</p>
                  {pm.phone && <p className="text-sm"><strong>Teléfono:</strong> {pm.phone}</p>}
                  {pm.account && <p className="text-sm"><strong>Cuenta:</strong> {pm.account}</p>}
                  {pm.cci && <p className="text-sm"><strong>CCI:</strong> {pm.cci}</p>}
                  {pm.details && <p className="text-sm text-gray-600">{pm.details}</p>}
                  {pm.qrImageUrl && (
                    <div className="mt-2">
                      <img src={pm.qrImageUrl} alt={`QR ${pm.type}`} className="w-40 h-auto" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">El vendedor no configuró métodos de pago.</p>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {Array.isArray(store.items) && store.items.length > 0 ? (
              store.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{it.product?.title || "Producto"}</div>
                    <div className="text-gray-500 text-xs">Precio unitario: S/ {Number(it.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div>{it.quantity} x</div>
                    <div className="font-semibold">S/ {(Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No hay productos listados</div>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-center gap-4">
        <Link href="/" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
          Seguir comprando
        </Link>
        <Link href="/dashboard/orders" className="border px-6 py-3 rounded-lg hover:bg-gray-100">
          Ver mis órdenes
        </Link>
      </div>
    </div>
  );
}
