"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useCategories from "@/hooks/useCategories";
import PriceInput from "@/components/PriceInput";

const CLOUDINARY_CLOUD_NAME = "dqx8wx5fj";
const UPLOAD_PRESET = "mi_tienda_unsigned";

export default function EditProductForm({ productId }) {
  const { categories = [], loading: loadingCategories } = useCategories();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [form, setForm] = useState({
    title: "",
    price: "",
    originalPrice: "",
    discountPct: "",
    categoryId: "",
    stock: 0,
    description: "",
  });

  const [newImages, setNewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // Fetch current user from custom JWT auth
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          setCurrentUser(data?.user || null);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!productId) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store", credentials: "include" });
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
          originalPrice: data.originalPrice ?? "",
          discountPct: data.discountPct ?? "",
          categoryId: data.category?.id ?? "",
          stock: data.stock ?? 0,
          description: data.description ?? "",
        });

        // Ownership check using custom JWT user
        const ownerId = data.userId ? String(data.userId) : null;
        const storeUserId = data.store?.user?.id ? String(data.store.user.id) : null;
        const currentUserId = currentUser?.id ? String(currentUser.id) : null;
        const admin = currentUser?.role === "admin" || currentUser?.role === "ADMIN";

        const isOwnerOfProduct = currentUserId && ownerId && currentUserId === ownerId;
        const isOwnerOfStore = currentUserId && storeUserId && currentUserId === storeUserId;

        setIsOwner(admin || isOwnerOfProduct || isOwnerOfStore);
      } catch (err) {
        console.error("Error fetching product:", err);
        toast.error("Error cargando producto");
      }
    })();

    return () => { mounted = false; };
  }, [productId, currentUser?.id, currentUser?.role]);

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
    const { uploadImage } = await import("@/lib/upload");
    return uploadImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Permitimos enviar el formulario aunque el editor no sea el owner.
    // El backend validará cambios sensibles (seller/user) y rechazará si corresponde.
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
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
        discountPct: form.discountPct ? Number(form.discountPct) : null,
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
      toast.success("Producto actualizado");
      setProduct(data);
      setForm({
        title: data.title ?? "",
        price: data.price ?? "",
        originalPrice: data.originalPrice ?? "",
        discountPct: data.discountPct ?? "",
        categoryId: data.category?.id ?? "",
        stock: data.stock ?? 0,
        description: data.description ?? "",
      });
      setNewImages([]);
      previewImages.forEach((url) => URL.revokeObjectURL(url));
      setPreviewImages([]);
      router.push("/dashboard/products");
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

  if (!product) return <p className="text-gray-500">Cargando...</p>;

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed";
  const readOnlyClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Editable title */}
      <div>
        <label htmlFor="edit-title" className={labelClass}>Nombre del producto</label>
        <input
          id="edit-title"
          name="title"
          value={form.title}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {!isOwner && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
          Puedes editar el nombre y algunos campos. Stock, precio, categoría e imágenes son solo lectura para tu cuenta.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Vendedor</label>
          <input value={product.user?.name || ""} readOnly className={readOnlyClass} />
        </div>
        <div>
          <label className={labelClass}>Tienda</label>
          <input value={product.store?.name || "Sin Tienda"} readOnly className={readOnlyClass} />
        </div>
      </div>

      {/* Precios */}
      <PriceInput
        originalPrice={form.originalPrice}
        discountPct={form.discountPct}
        price={form.price}
        onChange={({ originalPrice: op, discountPct: dp, price: p }) => {
          setForm((prev) => ({
            ...prev,
            originalPrice: op || "",
            discountPct: dp || "",
            price: p || "",
          }));
        }}
      />

      {/* Stock */}
      <div>
        <label htmlFor="edit-stock" className={labelClass}>Stock</label>
        <input
          id="edit-stock"
          type="number"
          name="stock"
          value={form.stock}
          onChange={handleChange}
          className={inputClass}
          disabled={!isOwner}
        />
      </div>

      <div>
        <label htmlFor="edit-category" className={labelClass}>Categoría</label>
        <select
          id="edit-category"
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          className={inputClass + " bg-white"}
          disabled={!isOwner || loadingCategories}
        >
          <option value="">Seleccione</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {isOwner && (
        <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-800">Permitir en Ofertas Flash</p>
            <p className="text-xs text-gray-500">Si está desactivado, tu producto no aparecerá en ofertas flash de la plataforma</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const newVal = !(product.flashSaleAllowed !== false);
              try {
                await fetch(`/api/products/${productId}/flash-sale`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ flashSaleAllowed: newVal }),
                });
                setProduct(prev => ({ ...prev, flashSaleAllowed: newVal }));
                toast.success(newVal ? "Producto habilitado para ofertas flash" : "Producto excluido de ofertas flash");
              } catch {
                toast.error("Error al actualizar");
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              product.flashSaleAllowed !== false ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              product.flashSaleAllowed !== false ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      )}

      <div>
        <label htmlFor="edit-desc" className={labelClass}>Descripción</label>
        <textarea
          id="edit-desc"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className={inputClass + " resize-none"}
          disabled={!isOwner}
        />
      </div>

      <div>
        <label className={labelClass}>Imágenes existentes</label>
        <div className="flex gap-2 flex-wrap">
          {product.images?.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-200" alt={`Imagen ${i + 1}`} />
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRemoveExisting(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                  aria-label={`Eliminar imagen ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div>
          <label htmlFor="edit-new-images" className={labelClass}>Agregar imágenes</label>
          <input
            id="edit-new-images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium file:cursor-pointer hover:file:bg-green-100"
          />

          {previewImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {previewImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-gray-200" alt={`Nueva imagen ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() => handleRemoveNew(i)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 text-xs rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                    aria-label={`Eliminar nueva imagen ${i + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          disabled={loading}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-semibold text-white transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Eliminar: solo owner */}
      <button type="button" onClick={handleDelete} className="bg-red-600 text-white p-2 rounded" disabled={!isOwner}>
        Eliminar
      </button>
    </form>
  );
}
