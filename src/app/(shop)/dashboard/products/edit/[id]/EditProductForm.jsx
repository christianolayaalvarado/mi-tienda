"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import useCategories from "@/hooks/useCategories";

const CLOUDINARY_CLOUD_NAME = "dqx8wx5fj";
const UPLOAD_PRESET = "mi_tienda_unsigned";

export default function EditProductForm({ productId }) {
  const { data: session } = useSession();
  const { categories = [], loading: loadingCategories } = useCategories();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [form, setForm] = useState({
    title: "",
    price: "",
    categoryId: "",
    stock: 0,
    description: "",
  });

  const [newImages, setNewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  useEffect(() => {
    if (!productId) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        if (res.status === 401) {
          toast.error("No autorizado. Inicia sesión.");
          return;
        }
        if (res.status === 403) {
          toast.error("No tienes permiso para ver este producto.");
          return;
        }
        if (!res.ok) {
          toast.error("Error cargando producto");
          return;
        }
        const data = await res.json();
        if (!mounted) return;

        setProduct(data);
        setForm({
          title: data.title ?? "",
          price: data.price ?? "",
          categoryId: data.category?.id ?? "",
          stock: data.stock ?? 0,
          description: data.description ?? "",
        });

        const ownerId = data.userId ?? data.user?.id;
        const admin = session?.user?.role === "admin";
        setIsOwner(admin || (session?.user?.id && ownerId === session.user.id));
      } catch (err) {
        console.error("Error fetching product:", err);
        toast.error("Error cargando producto");
      }
    })();

    return () => {
      mounted = false;
    };
    // intentionally include session.user.id and role so ownership recalculates when session changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, session?.user?.id, session?.user?.role]);

  useEffect(() => {
    return () => {
      previewImages.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewImages]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // parse numeric fields
    if (name === "price") {
      setForm((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else if (name === "stock") {
      setForm((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const filtered = files.filter((f) => f.size <= 10 * 1024 * 1024);
    if (files.length !== filtered.length) {
      toast.error("Algunas imágenes exceden 10MB y no serán subidas.");
    }
    setNewImages((prev) => [...prev, ...filtered]);
    const previews = filtered.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...previews]);
  };

  const handleRemoveExisting = (index) => {
    const updated = [...(product.images || [])];
    updated.splice(index, 1);
    setProduct((prev) => ({ ...prev, images: updated }));
  };

  const handleRemoveNew = (index) => {
    const updatedFiles = [...newImages];
    const updatedPreviews = [...previewImages];
    const removedPreview = updatedPreviews[index];
    if (removedPreview) URL.revokeObjectURL(removedPreview);
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setNewImages(updatedFiles);
    setPreviewImages(updatedPreviews);
  };

  const uploadToCloudinary = async (file) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "mi_tienda");
    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error("No tienes permiso para editar este producto.");
      return;
    }

    setLoading(true);
    try {
      const newImageUrls = [];
      for (const file of newImages) {
        try {
          const url = await uploadToCloudinary(file);
          newImageUrls.push(url);
        } catch (uploadErr) {
          console.error("Error subiendo imagen:", uploadErr);
          toast.error("Error subiendo alguna imagen. Revisa la consola.");
        }
      }

      // Ensure numeric types for price/stock
      const payload = {
        id: productId,
        title: form.title,
        price: form.price === "" ? undefined : Number(form.price),
        categoryId: form.categoryId || undefined,
        stock: form.stock === "" ? undefined : Number(form.stock),
        description: form.description,
        newImages: newImageUrls,
        imagesToKeep: product.images || [],
      };

      const res = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        toast.error("No autorizado. Inicia sesión.");
        setLoading(false);
        return;
      }
      if (res.status === 403) {
        toast.error("No tienes permiso para editar este producto.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        console.error("Error actualizando producto:", res.status, text);
        toast.error("Error actualizando producto");
        setLoading(false);
        return;
      }

      const data = await res.json();
      toast.success("Producto actualizado ✅");
      setProduct(data);
      setForm({
        title: data.title ?? "",
        price: data.price ?? "",
        categoryId: data.category?.id ?? "",
        stock: data.stock ?? 0,
        description: data.description ?? "",
      });
      setNewImages([]);
      // revoke old previews
      previewImages.forEach((url) => URL.revokeObjectURL(url));
      setPreviewImages([]);
    } catch (err) {
      console.error(err);
      toast.error("Error inesperado al actualizar producto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) {
      toast.error("No tienes permiso para eliminar este producto.");
      return;
    }
    if (!confirm("¿Eliminar producto?")) return;

    try {
      const res = await fetch(`/api/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [productId] }),
      });

      if (res.status === 401) {
        toast.error("No autorizado. Inicia sesión.");
        return;
      }
      if (res.status === 403) {
        toast.error("No tienes permiso para eliminar este producto.");
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        console.error("Error eliminando producto:", res.status, text);
        toast.error("Error eliminando producto");
        return;
      }

      toast.success("Producto eliminado ✅");
      window.location.href = "/dashboard/products";
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error eliminando producto");
    }
  };

  if (!product) return <p>Cargando...</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">{form.title}</h2>

      {!isOwner && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded">
          No tienes permiso para editar este producto. Estás en modo solo lectura.
        </div>
      )}

      <div>
        <label>Seller:</label>
        <input value={product.user?.name || ""} readOnly className="border p-2 w-full" />
      </div>

      <div>
        <label>Tienda:</label>
        <input value={product.store?.name || "Sin Tienda"} readOnly className="border p-2 w-full" />
      </div>

      <div>
        <label>Precio:</label>
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          className="border p-2 w-full"
          disabled={!isOwner}
          step="0.01"
        />
      </div>

      <div>
        <label>Stock:</label>
        <input
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          className="border p-2 w-full"
          disabled={!isOwner}
        />
      </div>

      <div>
        <label>Categoría:</label>
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          className="border p-2 w-full"
          disabled={!isOwner || loadingCategories}
        >
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
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className="border p-2 w-full"
          disabled={!isOwner}
        />
      </div>

      <div>
        <label>Imágenes existentes:</label>
        <div className="flex gap-2 flex-wrap">
          {product.images?.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} className="w-24 h-24 object-cover rounded" />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(i)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 text-xs rounded-full"
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label>Agregar imágenes:</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          className="border p-2 w-full"
          disabled={!isOwner}
        />

        <div className="flex gap-2 flex-wrap mt-2">
          {previewImages.map((img, i) => (
            <div key={i} className="relative">
              <img src={img} className="w-24 h-24 object-cover rounded" />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemoveNew(i)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-6 h-6 text-xs rounded-full"
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <button disabled={loading || !isOwner} className="bg-blue-600 text-white p-2 rounded">
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>

      <button type="button" onClick={handleDelete} className="bg-red-600 text-white p-2 rounded" disabled={!isOwner}>
        Eliminar
      </button>
    </form>
  );
}
