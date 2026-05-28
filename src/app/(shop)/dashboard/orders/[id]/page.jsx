"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proofFile, setProofFile] = useState(null);

  // 🔹 Cargar orden
  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando orden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  // 🔹 seleccionar archivo
  const handleFileChange = (e) => {
    setProofFile(e.target.files[0]);
  };

  // 🔹 subir comprobante
  const handleUploadProof = async (e) => {
    e.preventDefault();

    if (!proofFile) {
      toast.error("Selecciona un archivo");
      return;
    }

    const loadingToast = toast.loading("Subiendo comprobante...");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", proofFile);

      const res = await fetch(`/api/orders/${orderId}/upload-proof`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      toast.dismiss(loadingToast);
      toast.success("Comprobante enviado para verificación");

      setProofFile(null);
      fetchOrder();

    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("Error al subir comprobante");
    } finally {
      setUploading(false);
    }
  };

  // 🔥 confirmar pago (manual - ADMIN / VENDEDOR)
  const handleConfirmPayment = async () => {
    const confirmAction = confirm("¿Confirmar que el pago fue recibido?");
    if (!confirmAction) return;

    setConfirming(true);
    const loadingToast = toast.loading("Confirmando pago...");

    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: "POST",
      });

      if (!res.ok) throw new Error();

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

  // 🔥 eliminar orden
  const handleDeleteOrder = async () => {
    const confirmDelete = confirm(
      "¿Eliminar esta orden? Se restaurará el stock."
    );

    if (!confirmDelete) return;

    const loadingToast = toast.loading("Eliminando orden...");
    setDeleting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

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

  if (loading)
    return <p className="p-4 text-gray-600">Cargando orden...</p>;

  if (!order)
    return <p className="p-4 text-red-500">Orden no encontrada</p>;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">
            Orden #{order.id}
          </h1>

          <p className="text-gray-600 mt-1">
            Total: <strong>S/ {order.total?.toFixed(2)}</strong>
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

          {/* 🔥 SOLO ADMIN/VENDEDOR */}
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

      {/* 🔥 COMPROBANTE */}
      {order.paymentProof && (
        <div className="border p-4 rounded bg-green-50">
          <p className="font-semibold mb-2">Comprobante enviado:</p>
          <a
            href={order.paymentProof}
            target="_blank"
            className="text-blue-600 underline"
          >
            Ver comprobante
          </a>
        </div>
      )}

      {/* 🔥 PAGO YAPE */}
      {order.paymentStatus !== "paid" && (
        <div className="border p-4 rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Pago con Yape</h3>

          <p className="text-sm mb-2">
            Número: <strong>+51 959 502168</strong>
          </p>

          <img
            src="/images/yape-qr.png"
            alt="QR Yape"
            className="w-40 mb-4"
          />

          <form onSubmit={handleUploadProof}>
            <input
              type="file"
              onChange={handleFileChange}
              required
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

      {/* 🔥 PRODUCTOS */}
      {order.stores?.map((store) => (
        <div key={store.id} className="border p-4 rounded">
          <h2 className="font-semibold mb-2">{store.name}</h2>

          {store.items.map((item) => (
            <div key={item.id} className="text-sm flex justify-between">
              <span>
                {item.product.title} x {item.quantity}
              </span>
              <span>
                S/ {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}