"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CLOUDINARY_CLOUD_NAME = "dqx8wx5fj";
const UPLOAD_PRESET = "mi_tienda_unsigned";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 8; // opcional: límite de archivos por producto

export default function AddProductForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data || []))
      .catch((err) => {
        console.error("Error cargando categorías", err);
        toast.error("No se pudieron cargar las categorías");
      });
  }, []);

  useEffect(() => {
    // limpiar object URLs al desmontar
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    // limitar cantidad total
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
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Subir un archivo a Cloudinary (unsigned preset)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!title || !price || !categoryId) {
      toast.error("Completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    const uploadingToast = toast.loading("Subiendo imágenes...");

    try {
      // 1) Subir archivos a Cloudinary desde el cliente (paralelo controlado)
      const uploadPromises = files.map((file) =>
        uploadToCloudinary(file).then(
          (url) => ({ status: "fulfilled", value: url }),
          (err) => ({ status: "rejected", reason: err })
        )
      );

      const results = await Promise.all(uploadPromises);

      const successful = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.warn("Algunas imágenes fallaron al subir:", failed);
        toast.error(`${failed.length} imagen(es) no se subieron correctamente.`);
      }

      // 2) Enviar metadata al backend (solo URLs)
      const payload = {
        title: title.trim(),
        price: Number(price),
        stock: Number(stock),
        description: description || "",
        categoryId,
        images: successful, // solo URLs
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error creando producto:", res.status, text);
        toast.error(`Error creando producto: ${res.status}`);
        toast.dismiss(uploadingToast);
        setLoading(false);
        return;
      }

      const data = await res.json();
      toast.success("Producto creado ✅");
      toast.dismiss(uploadingToast);

      // limpiar y redirigir
      setTitle("");
      setPrice("");
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
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold">Nuevo producto</h2>

      <div>
        <label className="block">Título *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full"
          placeholder="Nombre del producto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Precio *</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border p-2 w-full"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label>Stock *</label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="border p-2 w-full"
            min="0"
          />
        </div>
      </div>

      <div>
        <label>Categoría *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">Seleccione</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      <div>
        <label>Imágenes (máx 10MB cada una)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFiles}
          className="border p-2 w-full"
          disabled={files.length >= MAX_FILES}
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {previews.map((p, i) => (
            <div key={i} className="relative">
              <img src={p} className="w-24 h-24 object-cover rounded" alt={`preview-${i}`} />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 text-xs rounded-full"
              >
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Crear producto"}
        </button>

        <button
          type="button"
          onClick={() => {
            files.forEach((_, i) => removeFile(i));
            setFiles([]);
            setPreviews([]);
          }}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Limpiar imágenes
        </button>
      </div>
    </form>
  );
}
