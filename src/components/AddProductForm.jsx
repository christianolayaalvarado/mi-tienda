"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useCategories from "@/hooks/useCategories";
import PriceInput from "@/components/PriceInput";

const CLOUDINARY_CLOUD_NAME = "dqx8wx5fj";
const UPLOAD_PRESET = "mi_tienda_unsigned";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 8;

export default function AddProductForm() {
  const router = useRouter();
  const { categories, loading: loadingCategories } = useCategories();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [stock, setStock] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p));
  }, [previews]);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    if (files.length + selected.length > MAX_FILES) {
      toast.error(`Máximo ${MAX_FILES} imágenes por producto.`);
      return;
    }

    const filtered = selected.filter((f) => f.size <= MAX_FILE_SIZE);
    if (selected.length !== filtered.length) {
      toast.error("Algunas imágenes exceden 10MB y no serán añadidas.");
    }

    const newPreviews = filtered.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...filtered]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (fieldErrors.images) setFieldErrors((prev) => ({ ...prev, images: "" }));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);
    fd.append("folder", "mi_tienda");

    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.secure_url;
  };

  const validate = () => {
    const errors = {};
    if (!title.trim()) errors.title = "El título es requerido";
    if (!price || Number(price) <= 0) errors.price = "Precio inválido";
    if (!categoryId) errors.categoryId = "Selecciona una categoría";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    const uploadingToast = toast.loading("Subiendo imágenes...");

    try {
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file).then(
          (url) => ({ status: "fulfilled", value: url }),
          (err) => ({ status: "rejected", reason: err })
        )
      );

      const results = await Promise.all(uploadPromises);
      const successful = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        toast.error(`${failed.length} imagen(es) no se subieron correctamente.`);
      }

      const payload = {
        title: title.trim(),
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        discountPct: discountPct ? Number(discountPct) : null,
        stock: Number(stock),
        description: description || "",
        categoryId,
        images: successful,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        toast.error(`Error creando producto: ${res.status}`);
        toast.dismiss(uploadingToast);
        setLoading(false);
        return;
      }

      toast.success("Producto creado");
      toast.dismiss(uploadingToast);

      setTitle("");
      setPrice("");
      setOriginalPrice("");
      setDiscountPct("");
      setStock(1);
      setDescription("");
      setFiles([]);
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews([]);
      router.push("/dashboard/products");
    } catch (err) {
      console.error("Error en creación:", err);
      toast.error("Error creando producto");
      toast.dismiss(uploadingToast);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-6">Nuevo producto</h2>

      <div className="space-y-5">
        {/* Título */}
        <div>
          <label htmlFor="prod-title" className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            id="prod-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: "" })); }}
            placeholder="Nombre del producto"
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition ${
              fieldErrors.title ? "border-red-400" : "border-gray-300"
            }`}
          />
          {fieldErrors.title && <p className="text-red-500 text-xs mt-1">{fieldErrors.title}</p>}
        </div>

        {/* Precios */}
        <PriceInput
          originalPrice={originalPrice}
          discountPct={discountPct}
          price={price}
          onChange={({ originalPrice: op, discountPct: dp, price: p }) => {
            setOriginalPrice(op || "");
            setDiscountPct(dp || "");
            setPrice(p || "");
            if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: "" }));
          }}
        />
        {fieldErrors.price && <p className="text-red-500 text-xs mt-1">{fieldErrors.price}</p>}

        {/* Stock */}
        <div>
          <label htmlFor="prod-stock" className="block text-sm font-medium text-gray-700 mb-1">
            Stock *
          </label>
          <input
            id="prod-stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            min="0"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          />
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="prod-category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría *
          </label>
          <select
            id="prod-category"
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); if (fieldErrors.categoryId) setFieldErrors((p) => ({ ...p, categoryId: "" })); }}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-white ${
              fieldErrors.categoryId ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Seleccione una categoría</option>
            {loadingCategories ? (
              <option value="" disabled>Cargando categorías...</option>
            ) : (
              (categories || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
          {fieldErrors.categoryId && <p className="text-red-500 text-xs mt-1">{fieldErrors.categoryId}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="prod-desc" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="prod-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe tu producto..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
          />
        </div>

        {/* Imágenes */}
        <div>
          <label htmlFor="prod-images" className="block text-sm font-medium text-gray-700 mb-1">
            Imágenes (máx {MAX_FILES}, 10MB cada una)
          </label>
          <input
            id="prod-images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFiles}
            disabled={files.length >= MAX_FILES}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium file:cursor-pointer hover:file:bg-green-100"
          />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((p, i) => (
                <div key={i} className="relative group">
                  <img src={p} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-200" alt={`Vista previa ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                    aria-label={`Eliminar imagen ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-semibold text-white transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Guardando...
            </span>
          ) : (
            "Crear producto"
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            files.forEach((_, i) => removeFile(i));
            setFiles([]);
            setPreviews([]);
          }}
          className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-medium"
        >
          Limpiar imágenes
        </button>
      </div>
    </form>
  );
}
