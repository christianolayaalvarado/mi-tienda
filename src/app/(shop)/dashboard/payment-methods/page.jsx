"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { fetchSession } from "@/lib/useSessionCheck";

const PAYMENT_TYPES = [
  { value: "yape", label: "Yape", icon: "📱" },
  { value: "plin", label: "Plin", icon: "💳" },
  { value: "bank_transfer", label: "Transferencia bancaria", icon: "🏦" },
];

export default function PaymentMethodsPage() {
  const [sellerId, setSellerId] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSellerId() {
      try {
        const user = await fetchSession();
        if (!isMounted) return;
        setSellerId(user?.id ?? null);
      } catch (err) {
        console.error("Error loading session:", err);
        if (isMounted) setSellerId(null);
      }
    }
    loadSellerId();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (sellerId) fetchMethods();
  }, [sellerId]);

  async function fetchMethods() {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/payment-methods`);
      if (!res.ok) {
        toast.error("No se pudieron cargar métodos de pago");
        setMethods([]);
        return;
      }
      const data = await res.json();
      setMethods(Array.isArray(data) ? data : Array.isArray(data.methods) ? data.methods : []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Error cargando métodos de pago");
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setForm((prev) => ({ ...prev, qrImageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sellerId) {
      toast.error("No autenticado");
      return;
    }
    if (!form.type) {
      toast.error("Selecciona un tipo de pago");
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading("Guardando método...");

    try {
      let qrUrl = form.qrImageUrl;

      // Si hay archivo nuevo, subirlo a Cloudinary
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "payment-methods");

        const uploadRes = await fetch("/api/uploads/image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => null);
          throw new Error(errData?.error || "Error subiendo imagen");
        }

        const uploadData = await uploadRes.json();
        qrUrl = uploadData.url;
        setUploading(false);
      }

      // Crear método de pago
      const createRes = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          phone: form.phone || null,
          account: form.account || null,
          cci: form.cci || null,
          details: form.details || null,
          isPrimary: !!form.isPrimary,
          qrImageUrl: qrUrl || null,
        }),
      });

      if (!createRes.ok) {
        const text = await createRes.text().catch(() => null);
        throw new Error(text || "Error creando método de pago");
      }

      toast.dismiss(loadingToast);
      toast.success("Método de pago guardado");
      resetForm();
      await fetchMethods();
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(err?.message || "Error guardando método");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({ type: "yape", phone: "", account: "", cci: "", details: "", isPrimary: false, qrImageUrl: "" });
    setFile(null);
    setPreviewUrl(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSetPrimary = async (pmId) => {
    if (!sellerId) return;
    try {
      const res = await fetch(
        `/api/sellers/${encodeURIComponent(sellerId)}/payment-methods/${encodeURIComponent(pmId)}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPrimary: true }) }
      );
      if (!res.ok) throw new Error("Error marcando principal");
      toast.success("Método marcado como principal");
      await fetchMethods();
    } catch (err) {
      toast.error("No se pudo marcar principal");
    }
  };

  const handleDelete = async (pmId) => {
    if (!pmId || !confirm("¿Eliminar este método de pago?")) return;
    try {
      const res = await fetch(
        `/api/sellers/${encodeURIComponent(sellerId)}/payment-methods/${encodeURIComponent(pmId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Error eliminando");
      await res.json().catch(() => null);
      setMethods((prev) => prev.filter((m) => m.id !== pmId));
      toast.success("Método eliminado");
    } catch (err) {
      toast.error(err?.message || "Error eliminando método");
    }
  };

  const typeLabel = (t) => PAYMENT_TYPES.find((p) => p.value === t)?.label || t;
  const typeIcon = (t) => PAYMENT_TYPES.find((p) => p.value === t)?.icon || "💰";

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Formas de pago</h2>
          <p className="text-sm text-gray-500 mt-1">Configura cómo recibirás los pagos de tus clientes</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Agregar método
          </button>
        )}
      </div>

      {/* Lista de métodos existentes */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : methods.length === 0 && !showForm ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin métodos de pago</h3>
          <p className="text-gray-500 text-sm mb-4">Agrega un método para que tus clientes puedan pagarte</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Agregar primer método
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div key={m.id} className={`bg-white border rounded-xl p-4 flex items-start gap-4 ${m.isPrimary ? "border-green-300 ring-1 ring-green-200" : "border-gray-200"}`}>
              {/* Icono */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${m.isPrimary ? "bg-green-100" : "bg-gray-100"}`}>
                {typeIcon(m.type)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{typeLabel(m.type)}</h3>
                  {m.isPrimary && (
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Principal</span>
                  )}
                </div>
                <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                  {m.phone && <p>Teléfono: {m.phone}</p>}
                  {m.account && <p>Cuenta: {m.account}</p>}
                  {m.cci && <p>CCI: {m.cci}</p>}
                  {m.details && <p className="text-gray-400">{m.details}</p>}
                </div>
                {m.qrImageUrl && (
                  <img src={m.qrImageUrl} alt="QR" className="w-24 h-24 object-contain mt-2 border rounded-lg" />
                )}
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {!m.isPrimary && (
                  <button onClick={() => handleSetPrimary(m.id)} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">
                    Principal
                  </button>
                )}
                <button onClick={() => handleDelete(m.id)} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulario nuevo método */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Nuevo método de pago</h3>
            <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de pago</label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_TYPES.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: pt.value })}
                  className={`border-2 rounded-lg p-3 text-center transition ${
                    form.type === pt.value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl block mb-1">{pt.icon}</span>
                  <span className="text-sm font-medium">{pt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ej: 999 123 456"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
              <input
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                placeholder="Número de cuenta"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CCI</label>
            <input
              value={form.cci}
              onChange={(e) => setForm({ ...form, cci: e.target.value })}
              placeholder="Código de cuenta interbancario"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detalles adicionales</label>
            <input
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              placeholder="Nombre del titular, banco, etc."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            />
          </div>

          {/* QR Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Código QR (opcional)</label>

            {previewUrl || form.qrImageUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl || form.qrImageUrl} alt="QR preview" className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg" />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition"
              >
                <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Haz clic para seleccionar imagen</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG o WEBP (máx. 5MB)</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Principal */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Marcar como método principal</span>
          </label>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Guardando...
                </>
              ) : (
                "Guardar método"
              )}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
