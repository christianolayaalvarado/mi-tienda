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
  const [proofFile, setProofFile] = useState(null);

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

      const normalized = {
        id: data.id || data._id || data.order?.id || data.order?._id,
        orderNumber: data.orderNumber || data.order?.orderNumber || null,
        createdAt: data.createdAt || data.order?.createdAt,
        total: data.total || data.order?.total || 0,
        status: data.status || data.order?.status || "pending",
        paymentStatus: data.paymentStatus || data.order?.paymentStatus || "unpaid",
        customerName: data.customerName || data.order?.customerName || "",
        customerEmail: data.customerEmail || data.order?.customerEmail || "",
        documentNumber: data.documentNumber || data.order?.documentNumber || null,
        paymentProof: data.paymentProof || data.order?.paymentProof || null,
        paymentProofMime: data.paymentProofMime || data.order?.paymentProofMime || null,
        orderItems: data.orderItems || data.order?.orderItems || [],
        deletedAt: data.deletedAt || data.order?.deletedAt || null,
      };

      const stores = (normalized.orderItems || []).map((oi) => ({
        id: oi.storeId || oi.store?.id || oi.id,
        name: oi.store?.name || oi.storeName || `Tienda ${oi.storeId || ""}`,
        items: oi.items || [],
      }));

      const finalOrder = { ...normalized, stores };
      setOrder(finalOrder);
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

  const isDeleted = order?.status === "deleted" || Boolean(order?.deletedAt);
  const isPaid = order?.paymentStatus === "paid" || order?.paymentStatus === "completed";
  const disableActions = isDeleted || isPaid;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Orden #{order.orderNumber || order.id}</h1>

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

        <div className="text-right">
          {isDeleted && <p className="text-sm text-red-600">Orden eliminada</p>}
        </div>
      </div>

      {/* ACCIONES PRINCIPALES: quitar Confirmar pago aquí; confirmación debe hacerse desde Ventas */}
      <div className="flex gap-2 items-center">
        <p className="text-sm text-gray-600">
          La confirmación de pago debe realizarse desde la sección <strong>Ventas</strong>. Aquí solo puedes subir el comprobante o eliminar la orden.
        </p>

        <button
          onClick={handleDeleteOrder}
          disabled={deleting || disableActions}
          className="ml-auto bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "🗑 Eliminar"}
        </button>
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

      {/* SUBIR COMPROBANTE (global por orden) */}
      <div className="border p-4 rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Enviar comprobante de pago</h2>
        <form onSubmit={handleUploadProof} className="mb-4">
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={uploading || disableActions}
            />
            <button
              type="submit"
              disabled={uploading || disableActions}
              className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "Enviar comprobante"}
            </button>
          </div>
        </form>

        {!order.paymentProof && <p className="text-sm text-gray-500">No se ha subido comprobante aún.</p>}
      </div>

      {/* Mostrar tiendas sin estado de pago */}
      {order.stores && order.stores.length > 0 && (
        <div className="space-y-4">
          {order.stores.map((store) => (
            <div key={store.id} className="border p-4 rounded bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{store.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">Items en esta tienda:</p>
              <ul className="list-disc pl-5 text-sm">
                {Array.isArray(store.items) && store.items.length > 0 ? (
                  store.items.map((it, idx) => (
                    <li key={idx} className="mb-1">
                      {it.product?.title || it.title || it.productName || "Producto"} — S/ {Number(it.price || 0).toFixed(2)} x {it.quantity || 1}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No hay items en esta tienda.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCTOS por orderItem (tienda) - sin repetir estado de pago */}
      <div className="space-y-4">
        {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
          order.orderItems.map((oi) => (
            <div key={oi.id} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{oi.store?.name || oi.storeId || "Tienda"}</h2>
              </div>

              <div className="mt-3 space-y-2">
                {Array.isArray(oi.items) && oi.items.length > 0 ? (
                  oi.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <div>
                        <div className="font-medium">{it.product?.title || it.title || it.productName || "Producto"}</div>
                        <div className="text-gray-500 text-xs">
                          Precio unitario: S/ {Number(it.price || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>{it.quantity} x</div>
                        <div className="font-semibold">
                          S/ {(Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)}
                        </div>
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
