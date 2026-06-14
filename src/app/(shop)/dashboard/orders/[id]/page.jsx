// app/(shop)/dashboard/orders/[id]/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", {
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proofFile, setProofFile] = useState(null);

  // Métodos de pago por tienda: { [storeId]: [methods] }
  const [paymentMethodsByStore, setPaymentMethodsByStore] = useState({});

  // Cargar métodos de pago de un seller (storeId)
  const fetchPaymentMethods = async (storeId) => {
    if (!storeId) return;
    try {
      const res = await fetch(`/api/sellers/${encodeURIComponent(storeId)}/payment-methods`);
      if (!res.ok) {
        setPaymentMethodsByStore((prev) => ({ ...prev, [storeId]: [] }));
        return;
      }
      const data = await res.json();
      setPaymentMethodsByStore((prev) => ({ ...prev, [storeId]: data || [] }));
    } catch (err) {
      console.error("Error cargando métodos de pago:", err);
      setPaymentMethodsByStore((prev) => ({ ...prev, [storeId]: [] }));
    }
  };

  // Cargar orden
  const fetchOrder = async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("GET order error:", res.status, text);
        setOrder(null);
        toast.error("Orden no encontrada o no autorizada");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Normalizar por seguridad: asegurar que orderItems existe
      const normalized = {
        id: data.id || data._id || data.order?.id || data.order?._id,
        orderNumber: data.orderNumber || data.order?.orderNumber || null,
        createdAt: data.createdAt || data.order?.createdAt,
        total: data.total || data.order?.total || 0,
        paymentStatus: data.paymentStatus || data.order?.paymentStatus || "unpaid",
        paymentMethod: data.paymentMethod || data.order?.paymentMethod || "",
        customerName: data.customerName || data.order?.customerName || "",
        customerEmail: data.customerEmail || data.order?.customerEmail || "",
        documentNumber: data.documentNumber || data.order?.documentNumber || null,
        paymentProof: data.paymentProof || data.order?.paymentProof || null,
        paymentProofMime: data.paymentProofMime || data.order?.paymentProofMime || null,
        orderItems: data.orderItems || data.order?.orderItems || [],
      };

      // Convertir orderItems a stores (si tu UI espera stores)
      const stores = (normalized.orderItems || []).map((oi) => ({
        id: oi.storeId || oi.store?.id || oi.id,
        name: oi.store?.name || oi.storeName || `Tienda ${oi.storeId || ""}`,
        paymentStatus: oi.paymentStatus || normalized.paymentStatus || "unpaid",
        items: oi.items || [],
      }));

      const finalOrder = { ...normalized, stores };
      setOrder(finalOrder);

      // Cargar métodos de pago de cada tienda (no bloquear la UI)
      if (Array.isArray(stores)) {
        stores.forEach((store) => {
          if (store?.id) fetchPaymentMethods(store.id);
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error cargando orden");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // seleccionar archivo
  const handleFileChange = (e) => {
    setProofFile(e.target.files?.[0] || null);
  };

  // subir comprobante (global por orden)
  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Selecciona un archivo");
      return;
    }

    // Validaciones cliente
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

      const res = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text().catch(() => null);
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

      const returnedUrl = (json && (json.url || (json.order && json.order.paymentProof))) || null;

      toast.dismiss(loadingToast);
      toast.success("Comprobante enviado para verificación");

      setProofFile(null);

      if (returnedUrl) {
        setOrder((prev) => ({ ...prev, paymentProof: returnedUrl, paymentStatus: "pending_verification" }));
      } else {
        await fetchOrder();
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(err?.message || "Error al subir comprobante");
    } finally {
      setUploading(false);
    }
  };

  // confirmar pago (manual - ADMIN / VENDEDOR)
  const handleConfirmPayment = async () => {
    if (!confirm("¿Confirmar que el pago fue recibido?")) return;

    setConfirming(true);
    const loadingToast = toast.loading("Confirmando pago...");

    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || "Error confirmando pago");
      }

      toast.dismiss(loadingToast);
      toast.success("Pago confirmado correctamente");
      fetchOrder();
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("Error confirmando pago");
    } finally {
      setConfirming(false);
    }
  };

  // eliminar orden
  const handleDeleteOrder = async () => {
    if (!confirm("¿Eliminar esta orden? Se restaurará el stock.")) return;

    setDeleting(true);
    const loadingToast = toast.loading("Eliminando orden...");

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || "Error eliminando orden");
      }

      toast.dismiss(loadingToast);
      toast.success("Orden eliminada");
      router.push("/dashboard/orders");
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("Error eliminando");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="p-4 text-gray-600">Cargando orden...</p>;
  if (!order) return <p className="p-4 text-red-500">Orden no encontrada</p>;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">
            Orden #{order.orderNumber || order.id}
          </h1>

          <p className="text-gray-600 mt-1">
            Fecha: <strong>{formatDate(order.createdAt)}</strong>
          </p>

          <p className="text-gray-600 mt-1">
            Cliente: <strong>{order.customerName || order.customerEmail}</strong>
          </p>

          <p className="text-gray-600 mt-1">
            Documento: <strong>{order.documentNumber || "No emitido"}</strong>
          </p>

          <p className="text-gray-600 mt-1">
            Total: <strong>S/ {Number(order.total || 0).toFixed(2)}</strong>
          </p>

          <p className="text-sm mt-1">
            Estado pago:{" "}
            <span
              className={
                order.paymentStatus === "paid"
                  ? "text-green-600"
                  : order.paymentStatus === "pending_verification"
                  ? "text-blue-600"
                  : "text-yellow-600"
              }
            >
              {order.paymentStatus || "unpaid"}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          {order.paymentStatus !== "paid" && (
            <button
              onClick={handleConfirmPayment}
              disabled={confirming}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {confirming ? "Confirmando..." : "✅ Confirmar pago"}
            </button>
          )}

          <button
            onClick={handleDeleteOrder}
            disabled={deleting}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            {deleting ? "Eliminando..." : "🗑 Eliminar"}
          </button>
        </div>
      </div>

      {/* COMPROBANTE */}
      {order.paymentProof && (
        <div className="border p-4 rounded bg-green-50">
          <p className="font-semibold mb-2">Comprobante enviado:</p>
          <a href={order.paymentProof} target="_blank" rel="noreferrer" className="text-blue-600 underline">
            Ver comprobante
          </a>
        </div>
      )}

      {/* PAGO dinámico por tienda (reemplaza Yape hardcodeado) */}
      {order.paymentStatus !== "paid" && (
        <div className="space-y-4">
          {Array.isArray(order.stores) && order.stores.length > 0 ? (
            order.stores.map((store) => (
              <div key={store.id} className="border p-4 rounded bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{store.name}</h3>
                  <span className={store.paymentStatus === "paid" ? "text-green-600" : "text-yellow-600"}>
                    {store.paymentStatus}
                  </span>
                </div>

                {paymentMethodsByStore[store.id] === undefined ? (
                  <p className="text-sm text-gray-500">Cargando métodos de pago...</p>
                ) : paymentMethodsByStore[store.id]?.length > 0 ? (
                  paymentMethodsByStore[store.id].map((pm) => (
                    <div key={pm.id} className="mb-3 border rounded p-3">
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

                {/* SUBIR COMPROBANTE (global por orden) */}
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
            ))
          ) : (
            <div className="border p-4 rounded bg-gray-50">
              <p className="text-sm text-gray-500">No se encontraron tiendas en la orden.</p>
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
        </div>
      )}

      {/* PRODUCTOS por orderItem (tienda) */}
      <div className="space-y-4">
        {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
          order.orderItems.map((oi) => (
            <div key={oi.id} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{oi.store?.name || oi.storeId || "Tienda"}</h2>
                <p className="text-sm text-gray-500">Estado: {oi.paymentStatus}</p>
              </div>

              <div className="mt-3 space-y-2">
                {Array.isArray(oi.items) && oi.items.length > 0 ? (
                  oi.items.map((it) => (
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
          ))
        ) : (
          <div className="text-sm text-gray-500">No hay items en esta orden</div>
        )}
      </div>
    </div>
  );
}
