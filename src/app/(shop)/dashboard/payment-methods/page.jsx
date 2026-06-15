"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function PaymentMethodsPage() {
  const { data: session } = useSession();
  const sellerId = session?.user?.id;

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [form, setForm] = useState({
    type: "yape",
    phone: "",
    account: "",
    cci: "",
    details: "",
    isPrimary: false,
    qrImageUrl: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    fetchMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  async function fetchMethods() {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/payment-methods`);
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("GET payment-methods failed:", res.status, text);
        toast.error("No se pudieron cargar métodos de pago");
        setMethods([]);
        return;
      }
      const data = await res.json();
      // Aceptar ambos formatos: array directo o { methods: [...] }
      if (Array.isArray(data)) {
        setMethods(data);
      } else if (Array.isArray(data.methods)) {
        setMethods(data.methods);
      } else {
        setMethods([]);
      }
    } catch (err) {
      console.error("Fetch payment methods error:", err);
      toast.error("Error cargando métodos de pago");
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFileAndCreateMethod(fileToUpload, formData) {
    // Si no hay archivo, crear directamente
    if (!fileToUpload) {
      const createRes = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!createRes.ok) {
        const text = await createRes.text().catch(() => null);
        throw new Error(text || "Error creando método");
      }
      return createRes.json();
    }

    // Obtener presign para subir el archivo
    const presignRes = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: fileToUpload.name, contentType: fileToUpload.type }),
    });

    if (!presignRes.ok) {
      const text = await presignRes.text().catch(() => null);
      console.error("Presign failed:", presignRes.status, text);
      throw new Error("No se pudo obtener URL de subida");
    }

    const presignJson = await presignRes.json();
    const { uploadUrl, publicUrl } = presignJson;

    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": fileToUpload.type },
      body: fileToUpload,
    });

    if (!putRes.ok) {
      const text = await putRes.text().catch(() => null);
      console.error("Upload to storage failed:", putRes.status, text);
      throw new Error("Error subiendo imagen al storage");
    }

    const createRes = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/payment-methods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, qrImageUrl: publicUrl }),
    });

    if (!createRes.ok) {
      const text = await createRes.text().catch(() => null);
      console.error("Create payment method failed:", createRes.status, text);
      throw new Error("No se pudo crear método de pago");
    }

    return createRes.json();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sellerId) {
      toast.error("No autenticado");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading("Guardando método...");
    try {
      if (!form.type) throw new Error("Selecciona un tipo");

      await uploadFileAndCreateMethod(file, {
        type: form.type,
        phone: form.phone || null,
        account: form.account || null,
        cci: form.cci || null,
        details: form.details || null,
        isPrimary: !!form.isPrimary,
        qrImageUrl: form.qrImageUrl || null,
      });

      toast.dismiss(loadingToast);
      toast.success("Método guardado");
      setFile(null);
      setForm({ type: "yape", phone: "", account: "", cci: "", details: "", isPrimary: false, qrImageUrl: "" });
      await fetchMethods();
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(err?.message || "Error guardando método");
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (pmId) => {
    if (!sellerId) return;
    try {
      const res = await fetch(
        `/api/sellers/${encodeURIComponent(sellerId)}/payment-methods/${encodeURIComponent(pmId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPrimary: true }),
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || "Error marcando principal");
      }
      toast.success("Método marcado como principal");
      await fetchMethods();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo marcar principal");
    }
  };

  async function handleDelete(pmId) {
    if (!pmId) return;
    if (!confirm("Eliminar método de pago?")) return;

    try {
      const res = await fetch(
        `/api/sellers/${encodeURIComponent(sellerId)}/payment-methods/${encodeURIComponent(pmId)}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        console.error("DELETE failed:", res.status, text);
        throw new Error(text || `Error eliminando (status ${res.status})`);
      }

      await res.json().catch(() => null);
      setMethods((prev) => prev.filter((m) => m.id !== pmId));
      toast.success("Método eliminado");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err?.message || "Error eliminando método");
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Formas de pago</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-3 mb-6">
          {methods.length === 0 && <p className="text-sm text-gray-500">No hay métodos configurados</p>}
          {methods.map((m) => (
            <div key={m.id} className="border p-3 rounded flex justify-between items-start">
              <div>
                <p>
                  <strong>
                    {m.type}
                    {m.isPrimary ? " (Principal)" : ""}
                  </strong>
                </p>
                {m.phone && <p className="text-sm">Tel: {m.phone}</p>}
                {m.account && <p className="text-sm">Cuenta: {m.account}</p>}
                {m.cci && <p className="text-sm">CCI: {m.cci}</p>}
                {m.details && <p className="text-sm text-gray-600">{m.details}</p>}
                {m.qrImageUrl && <img src={m.qrImageUrl} alt="QR" className="w-28 mt-2" />}
              </div>
              <div className="flex flex-col gap-2">
                {!m.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(m.id)}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Marcar principal
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
        <div>
          <label className="block text-sm font-medium">Tipo</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1">
            <option value="yape">Yape</option>
            <option value="plin">Plin</option>
            <option value="bank_transfer">Transferencia bancaria</option>
          </select>
        </div>

        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Teléfono"
          className="w-full"
        />
        <input
          value={form.account}
          onChange={(e) => setForm({ ...form, account: e.target.value })}
          placeholder="Cuenta"
          className="w-full"
        />
        <input
          value={form.cci}
          onChange={(e) => setForm({ ...form, cci: e.target.value })}
          placeholder="CCI"
          className="w-full"
        />
        <input
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          placeholder="Detalles (opcional)"
          className="w-full"
        />

        <div>
          <label className="block text-sm font-medium">QR (opcional)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="mt-2">
            <button
              type="button"
              onClick={async () => {
                if (!file) return toast.error("Selecciona un archivo primero");
                setUploading(true);
                try {
                  const presignRes = await fetch("/api/uploads/presign", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename: file.name, contentType: file.type }),
                  });
                  if (!presignRes.ok) {
                    const text = await presignRes.text().catch(() => null);
                    throw new Error(text || "Error presign");
                  }
                  const { uploadUrl, publicUrl } = await presignRes.json();
                  const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
                  if (!putRes.ok) throw new Error("Error subiendo archivo");
                  setForm((prev) => ({ ...prev, qrImageUrl: publicUrl }));
                  toast.success("QR subido. Ahora guarda el método.");
                  setFile(null);
                } catch (err) {
                  console.error(err);
                  toast.error("Error subiendo QR");
                } finally {
                  setUploading(false);
                }
              }}
              disabled={!file || uploading}
              className="bg-gray-600 text-white px-3 py-1 rounded"
            >
              {uploading ? "Subiendo..." : "Subir QR"}
            </button>
          </div>
        </div>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
          <span className="text-sm">Marcar como principal</span>
        </label>

        <button type="submit" disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded">
          {saving ? "Guardando..." : "Guardar método"}
        </button>
      </form>
    </div>
  );
}
