"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export const dynamic = "force-dynamic";

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
  // Acepta varias formas: { id, order, orderNumber } o el objeto order directo
  const raw = data?.order ? data.order : data;
  const id = raw?.id || raw?._id || data?.id || data?.orderId || data?.orderNumber || null;
  const paymentProof = raw?.paymentProof || null;
  return {
    id,
    orderNumber: raw?.orderNumber || data?.orderNumber || null,
    createdAt: raw?.createdAt || raw?.created_at || null,
    total: raw?.total || 0,
    paymentStatus: raw?.paymentStatus || "unpaid",
    paymentMethod: raw?.paymentMethod || "",
    customerName: raw?.customerName || raw?.customer?.name || "",
    customerEmail: raw?.customerEmail || raw?.customer?.email || "",
    documentNumber: raw?.documentNumber || null,
    paymentProof,
    paymentProofMime: raw?.paymentProofMime || null,
    // Convertir orderItems en "stores" para mantener la UI actual
    stores: (raw?.orderItems || []).map((oi) => ({
      id: oi.storeId || oi.store?.id || oi.id,
      name: oi.store?.name || oi.storeName || `Tienda ${oi.storeId || ""}`,
      paymentStatus: oi.paymentStatus || raw?.paymentStatus || "unpaid",
      items: (oi.items || []).map((it) => ({
        id: it.id || it._id,
        productId: it.productId,
        product: it.product || { title: it.productTitle || "Producto" },
        quantity: it.quantity,
        price: it.price,
      })),
    })),
  };
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

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
      const data = await res.json();
      const normalized = normalizeOrderResponse(data);
      setOrder(normalized);
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

  // seleccionar archivo
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
  };

  // subir comprobante
  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Selecciona un archivo");
      return;
    }

    // Cliente: validaciones rápidas (coinciden con servidor)
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 8 * 1024 * 1024; // 8MB
    if (!allowed.includes(proofFile.type)) {
      toast.error("Tipo de archivo no permitido. Usa JPG, PNG o WEBP.");
      return;
    }
    if (proofFile.size > maxBytes) {
      toast.error("Archivo demasiado grande. Máximo 8 MB.");
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading("Subiendo comprobante...");
    try {
      const formData = new FormData();
      formData.append("file", proofFile);

      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/upload-proof`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text().catch(() => null);
      // Intentar parsear JSON si existe
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        console.error("Upload proof failed:", res.status, text);
        const message = (json && json.error) || text || "Error subiendo comprobante";
        throw new Error(message);
      }

      // Si el endpoint devuelve url en JSON, actualizar estado local para mostrar enlace
      const returnedUrl = (json && (json.url || (json.order && json.order.paymentProof))) || null;

      toast.dismiss(loadingToast);
      toast.success("Comprobante enviado correctamente");

      // Limpiar input
      setProofFile(null);

      // Si recibimos URL, actualizar order en UI sin recargar
      if (returnedUrl) {
        setOrder((prev) => ({ ...prev, paymentProof: returnedUrl, paymentStatus: "pending_verification" }));
      } else {
        // fallback: recargar orden desde servidor
        await fetchOrder();
      }
    } catch (err) {
      console.error("Upload proof error:", err);
      toast.dismiss(loadingToast);
      toast.error(err?.message || "Error subiendo comprobante");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      {/* HEADER */}
      <div className="text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-bold mb-2">¡Pedido confirmado!</h1>
        <p className="text-gray-600">Completa tu pago para procesar la orden.</p>
        <p className="text-sm text-gray-500 mt-2">
          Orden #{order.orderNumber || order.id}
        </p>
      </div>

      {/* STORES (MULTI-TIENDA) */}
      {Array.isArray(order.stores) && order.stores.map((store) => (
        <div key={store.id} className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">{store.name}</h2>
          <p className="text-gray-600">
            Estado:{" "}
            <span className={store.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}>
              {store.paymentStatus}
            </span>
          </p>

          {/* Si ya existe comprobante global en la orden, mostrarlo */}
          {order.paymentProof && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 font-medium">Comprobante enviado</p>
              <div className="flex items-center gap-3 mt-2">
                <a
                  href={order.paymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 underline break-all"
                >
                  Ver comprobante
                </a>
                {/* Miniatura si es imagen */}
                {order.paymentProofMime && order.paymentProofMime.startsWith("image") && (
                  <a href={order.paymentProof} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 overflow-hidden rounded">
                    <img src={order.paymentProof} alt="Comprobante" className="object-cover w-full h-full" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* YAPE: mostrar formulario solo si la tienda no está marcada como pagada */}
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
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
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

          {/* Lista de productos de esta tienda */}
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

      {/* ACCIONES */}
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

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<p className="p-6 text-gray-600">Cargando...</p>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
