// src/app/(shop)/dashboard/orders/[id]/page.jsx
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

function StarRating({ rating, onRate, disabled }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onRate(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`text-2xl transition ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          {star <= (hover || rating) ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, orderId, onReviewCreated }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Selecciona una calificación");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, orderId, rating, comment }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Error");

      toast.success("Reseña enviada");
      setRating(0);
      setComment("");
      onReviewCreated?.();
    } catch (err) {
      toast.error(err?.message || "Error enviando reseña");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
      <p className="text-sm font-semibold text-gray-700 mb-2">Dejar reseña</p>
      <StarRating rating={rating} onRate={setRating} disabled={submitting} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Cuéntanos tu experiencia (opcional)"
        rows={2}
        disabled={submitting}
        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
      />
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition"
      >
        {submitting ? "Enviando..." : "Enviar reseña"}
      </button>
    </form>
  );
}

function ReviewDisplay({ review }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-yellow-500">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
        <span className="text-xs text-gray-500">por {review.user?.name || "Anónimo"}</span>
      </div>
      {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
    </div>
  );
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
  const [reviews, setReviews] = useState({});

  const fetchOrder = async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { credentials: "include" });
      if (!res.ok) {
        setOrder(null);
        toast.error("Orden no encontrada o no autorizada");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const src = data.order || data;
      const normalized = {
        id: src.id || src._id || null,
        orderNumber: src.orderNumber || null,
        createdAt: src.createdAt || null,
        total: src.total || 0,
        status: src.status || "pending",
        paymentStatus: src.paymentStatus || "unpaid",
        customerName: src.customerName || "",
        customerEmail: src.customerEmail || "",
        documentNumber: src.documentNumber || null,
        paymentProof: src.paymentProof || null,
        paymentProofMime: src.paymentProofMime || null,
        orderItems: src.orderItems || [],
        deletedAt: src.deletedAt || null,
        currency: src.currency || "USD",
      };

      const stores = (normalized.orderItems || []).map((oi) => ({
        id: oi.storeId || oi.store?.id || null,
        name: oi.store?.name || oi.storeName || `Tienda ${oi.storeId || ""}`,
        items: oi.items || [],
      }));

      setOrder({ ...normalized, stores });

      // Cargar reseñas existentes
      if (normalized.paymentStatus === "paid") {
        fetchReviews(normalized.orderItems);
      }
    } catch (err) {
      console.error("fetchOrder error:", err);
      toast.error("Error cargando orden");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (orderItems) => {
    const productIds = (orderItems || []).flatMap((oi) =>
      (oi.items || []).map((it) => it.productId).filter(Boolean)
    );

    const reviewsMap = {};
    for (const pid of productIds) {
      try {
        const res = await fetch(`/api/reviews?productId=${pid}`);
        const data = await res.json().catch(() => null);
        if (data?.reviews) {
          const myReview = data.reviews.find((r) => r.orderId === orderId);
          if (myReview) reviewsMap[pid] = myReview;
        }
      } catch {}
    }
    setReviews(reviewsMap);
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleFileChange = (e) => {
    setProofFile(e.target.files?.[0] || null);
  };

  const handleUploadProof = async (e) => {
    e?.preventDefault?.();
    if (!proofFile) {
      toast.error("Selecciona un archivo");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 8 * 1024 * 1024;
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
        credentials: "include",
        body: formData,
      });

      const text = await res.text().catch(() => null);
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (!res.ok) {
        const message = (json && json.error) || text || "Error subiendo comprobante";
        throw new Error(message);
      }

      toast.dismiss(loadingToast);
      toast.success("Comprobante enviado para verificación");
      setProofFile(null);
      await fetchOrder();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err?.message || "Error al subir comprobante");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteOrder = async (mode = "soft", confirmFlag = false) => {
    const confirmMsg =
      mode === "hard"
        ? "¿Eliminar físicamente esta orden? Esto restaurará stock y no se podrá recuperar."
        : "¿Eliminar esta orden? Se restaurará el stock y la orden quedará marcada como eliminada.";
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    const loadingToast = toast.loading("Eliminando orden...");

    try {
      const body = { mode, confirm: confirmFlag };
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text().catch(() => null);
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (!res.ok) {
        const message = (json && (json.error || json.message)) || text || "Error eliminando orden";
        throw new Error(message);
      }

      toast.dismiss(loadingToast);
      toast.success("Orden eliminada");
      router.push("/dashboard/orders");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err?.message || "Error eliminando orden");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-4 text-gray-600">Cargando orden...</div>;

  if (!order) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Orden no encontrada</h2>
        <p className="text-sm text-gray-600">No se pudo cargar la orden o no tienes permisos para verla.</p>
      </div>
    );
  }

  const isDeleted = order?.status === "deleted" || order?.status === "cancelled" || Boolean(order?.deletedAt);
  const isPaid = order?.paymentStatus === "paid" || order?.paymentStatus === "completed";
  const disableActions = isDeleted || isPaid;

  // Collect all product IDs for review section
  const allProducts = (order.orderItems || []).flatMap((oi) =>
    (oi.items || []).map((it) => ({
      productId: it.productId,
      title: it.product?.title || it.title || it.productName || "Producto",
    })).filter((p) => p.productId)
  );

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Orden #{order.orderNumber || order.id}</h1>
          <p className="text-gray-600 mt-1">Fecha: <strong>{formatDate(order.createdAt)}</strong></p>
          <p className="text-gray-600 mt-1">Cliente: <strong>{order.customerName || order.customerEmail}</strong></p>
          <p className="text-gray-600 mt-1">Total: <strong>S/ {Number(order.total || 0).toFixed(2)}</strong></p>
          <p className="text-sm mt-1">
            Estado pago:{" "}
            <span className={isPaid ? "text-green-600" : order.paymentStatus === "pending_verification" ? "text-blue-600" : "text-yellow-600"}>
              {order.paymentStatus || "unpaid"}
            </span>
          </p>
        </div>
        <div className="text-right">
          {isDeleted && <p className="text-sm text-red-600">Orden {order.status === "cancelled" ? "cancelada" : "eliminada"}</p>}
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex flex-wrap gap-3 items-center">
        <p className="text-sm text-gray-600">
          La confirmación de pago debe realizarse desde la sección <strong>Ventas</strong>.
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => handleDeleteOrder("soft", true)}
            disabled={deleting || disableActions}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>

          {/* Chat con vendedor */}
          {order.orderItems?.[0]?.storeId && (
            <button
              onClick={async () => {
                try {
                  const storeRes = await fetch(`/api/stores/${order.orderItems[0].storeId}`);
                  const storeData = await storeRes.json().catch(() => null);
                  const sellerId = storeData?.store?.userId;
                  if (!sellerId) { toast.error("No se pudo identificar al vendedor"); return; }
                  const chatRes = await fetch("/api/chat/conversations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sellerId, productId: order.orderItems?.[0]?.items?.[0]?.productId }),
                  });
                  const chatData = await chatRes.json().catch(() => null);
                  if (chatRes.ok) { window.location.href = "/dashboard/chat"; }
                  else { toast.error(chatData?.error || "Error abriendo chat"); }
                } catch { toast.error("Error abriendo chat"); }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Chat con vendedor
            </button>
          )}

          {/* WhatsApp al vendedor */}
          {order.orderItems?.[0]?.store?.user?.phone ? (
            <a
              href={`https://wa.me/${order.orderItems[0].store.user.phone.replace(/[^0-9]/g, "").length === 9 ? "51" : ""}${order.orderItems[0].store.user.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi orden ${order.orderNumber || order.id}...`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-4 py-2 rounded font-medium hover:bg-green-600 transition flex items-center gap-2"
            >
              WhatsApp al vendedor
            </a>
          ) : (
            <span className="text-xs text-gray-400 self-center" title="El vendedor no registró teléfono">
              WhatsApp no disponible (sin teléfono)
            </span>
          )}
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

      {/* Estado de envío */}
      {isPaid && order.shippingStatus && order.shippingStatus !== "none" && (
        <div className="border p-4 rounded bg-blue-50">
          <p className="font-semibold mb-2">Estado del envío:</p>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              order.shippingStatus === "delivered" ? "bg-green-100 text-green-700" :
              order.shippingStatus === "in_transit" ? "bg-yellow-100 text-yellow-700" :
              order.shippingStatus === "shipped" ? "bg-blue-100 text-blue-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {order.shippingStatus === "shipped" ? "Enviado" :
               order.shippingStatus === "in_transit" ? "En tránsito" :
               order.shippingStatus === "delivered" ? "Entregado" : "Pendiente"}
            </span>
            {order.trackingNumber && (
              <span className="text-sm text-gray-600">
                Tracking: <strong>{order.trackingNumber}</strong>
                {order.shippingCarrier && ` (${order.shippingCarrier})`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Dirección de envío */}
      {order.shippingAddress && (
        <div className="border p-4 rounded bg-gray-50">
          <p className="font-semibold mb-1">Dirección de envío:</p>
          <p className="text-sm text-gray-600">{order.shippingAddress}</p>
          <p className="text-sm text-gray-600">{[order.shippingCity, order.shippingDepartment].filter(Boolean).join(", ")}</p>
        </div>
      )}

      {/* SUBIR COMPROBANTE */}
      {!isPaid && (
        <div className="border p-4 rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Enviar comprobante de pago</h2>
          <form onSubmit={handleUploadProof} className="mb-4">
            <div className="flex items-center gap-3">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} disabled={uploading || disableActions} />
              <button type="submit" disabled={uploading || disableActions} className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50">
                {uploading ? "Subiendo..." : "Enviar comprobante"}
              </button>
            </div>
          </form>
          {!order.paymentProof && <p className="text-sm text-gray-500">No se ha subido comprobante aún.</p>}
        </div>
      )}

      {/* Items */}
      <div className="space-y-4">
        {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
          order.orderItems.map((oi) => (
            <div key={oi.id} className="border p-4 rounded">
              <h2 className="font-semibold">{oi.store?.name || oi.storeId || "Tienda"}</h2>
              <div className="mt-3 space-y-2">
                {Array.isArray(oi.items) && oi.items.length > 0 ? (
                  oi.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <div>
                        <div className="font-medium">{it.product?.title || it.title || it.productName || "Producto"}</div>
                        <div className="text-gray-500 text-xs">S/ {Number(it.price || 0).toFixed(2)} x {it.quantity || 1}</div>
                      </div>
                      <div className="text-right font-semibold">
                        S/ {(Number(it.price || 0) * Number(it.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No hay productos listados</div>
                )}
              </div>

              {/* Reseñas por producto */}
              {isPaid && oi.items?.map((it) => {
                if (!it.productId) return null;
                const existingReview = reviews[it.productId];
                return (
                  <div key={`review-${it.id}`}>
                    {existingReview ? (
                      <ReviewDisplay review={existingReview} />
                    ) : (
                      <ReviewForm
                        productId={it.productId}
                        orderId={order.id}
                        onReviewCreated={() => fetchReviews(order.orderItems)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500">No hay items en esta orden</div>
        )}
      </div>
    </div>
  );
}
