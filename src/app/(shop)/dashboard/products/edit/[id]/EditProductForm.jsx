"use client";

import { useState, useEffect } from "react";

const CLOUDINARY_CLOUD_NAME = "dqx8wx5fj"; // tu cloud name
const UPLOAD_PRESET = "mi_tienda_unsigned"; // reemplaza por tu upload preset unsigned

export default function EditProductForm({ productId }) {
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    price: "",
    categoryId: "",
    stock: 0,
    description: "",
  });

  const [newImages, setNewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Selección de imágenes (archivos)
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);

    const filtered = files.filter((f) => f.size <= 10 * 1024 * 1024);
    if (files.length !== filtered.length) {
      alert("Algunas imágenes exceden 10MB y no serán subidas.");
    }

    setNewImages((prev) => [...prev, ...filtered]);

    const previews = filtered.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...previews]);
  };

  // Eliminar imagen existente
  const handleRemoveExisting = (index) => {
    const updated = [...product.images];
    updated.splice(index, 1);
    setProduct((prev) => ({ ...prev, images: updated }));
  };

  // Eliminar nueva imagen
  const handleRemoveNew = (index) => {
    const updatedFiles = [...newImages];
    const updatedPreviews = [...previewImages];

    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setNewImages(updatedFiles);
    setPreviewImages(updatedPreviews);
  };

  // Cargar datos
  useEffect(() => {
    if (!productId) return;

    // Producto
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data) return;

        setProduct(data);

        setForm({
          title: data.title || "",
          price: data.price || "",
          categoryId: data.category?.id || "",
          stock: data.stock || 0,
          description: data.description || "",
        });
      });

    // Categorías
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data || []));
  }, [productId]);

  // Helper: subir un archivo a Cloudinary (unsigned preset)
  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "mi_tienda");

    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    return data.secure_url;
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1) Subir nuevas imágenes (si las hay) a Cloudinary desde el cliente
      const newImageUrls = [];
      for (const file of newImages) {
        try {
          const url = await uploadToCloudinary(file);
          newImageUrls.push(url);
        } catch (uploadErr) {
          console.error("Error subiendo imagen:", uploadErr);
          alert("Error subiendo alguna imagen. Revisa la consola.");
        }
      }

      // 2) Enviar al backend solo URLs (imagesToKeep + newImageUrls)
      const res = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          ...form,
          newImages: newImageUrls, // ya son URLs o dataURI si lo prefieres
          imagesToKeep: product.images || [],
        }),
      });

      // Manejo robusto de respuesta
      if (!res.ok) {
        const text = await res.text();
        console.error("Error actualizando producto:", res.status, text);
        alert(`Error actualizando producto: ${res.status} ${text}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      alert("Producto actualizado ✅");
      setProduct(data);
      setNewImages([]);
      setPreviewImages([]);
    } catch (err) {
      console.error(err);
      alert("Error inesperado al actualizar producto");
    }

    setLoading(false);
  };

  // Eliminar producto
  const handleDelete = async () => {
    if (!confirm("¿Eliminar producto?")) return;

    const res = await fetch(`/api/products`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [productId] }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Error eliminando producto:", res.status, text);
      alert("Error eliminando producto");
      return;
    }

    alert("Producto eliminado ✅");
    window.location.href = "/dashboard/products";
  };

  if (!product) return <p>Cargando...</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{form.title}</h2>

      {/* SOLO LECTURA */}
      <div>
        <label>Seller:</label>
        <input value={product.user?.name || ""} readOnly className="border p-2 w-full" />
      </div>

      <div>
        <label>Tienda:</label>
        <input value={product.store?.name || "Sin Tienda"} readOnly className="border p-2 w-full" />
      </div>

      {/* EDITABLES */}
      <div>
        <label>Precio:</label>
        <input type="number" name="price" value={form.price} onChange={handleChange} className="border p-2 w-full" />
      </div>

      <div>
        <label>Stock:</label>
        <input type="number" name="stock" value={form.stock} onChange={handleChange} className="border p-2 w-full" />
      </div>

      <div>
        <label>Categoría:</label>
        <select name="categoryId" value={form.categoryId} onChange={handleChange} className="border p-2 w-full">
          <option value="">Seleccione</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Descripción:</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="border p-2 w-full" />
      </div>

      {/* Imágenes existentes */}
      <div>
        <label>Imágenes existentes:</label>
        <div className="flex gap-2 flex-wrap">
          {product.images?.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} className="w-24 h-24 object-cover rounded" />
              <button type="button" onClick={() => handleRemoveExisting(i)} className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 text-xs rounded-full">
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Nuevas imágenes */}
      <div>
        <label>Agregar imágenes:</label>
        <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="border p-2 w-full" />

        <div className="flex gap-2 flex-wrap mt-2">
          {previewImages.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} className="w-24 h-24 object-cover rounded" />
              <button type="button" onClick={() => handleRemoveNew(i)} className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 text-xs rounded-full">
                X
              </button>
            </div>
          ))}
        </div>
      </div>

      <button disabled={loading} className="bg-blue-600 text-white p-2 rounded">
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>

      <button type="button" onClick={handleDelete} className="bg-red-600 text-white p-2 rounded">
        Eliminar
      </button>
    </form>
  );
}
