"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AddProductForm() {
  const router = useRouter();
  const { data: session } = useSession();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    price: "",
    stock: 0,
    categoryId: "",
    description: "",
    images: [],
  });
  const [imagesPreview, setImagesPreview] = useState([]);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(false);

  // 🔹 Traer categorías
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  // 🔹 Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // 🔹 Manejo de imágenes
  const handleImages = (e) => {
    const files = Array.from(e.target.files);

    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((base64Images) => {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...base64Images],
      }));

      setImagesPreview((prev) => [...prev, ...base64Images]);
    });
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));

    setImagesPreview((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // 🔹 Validación
  const validate = () => {
    const newErrors = {};

    if (!form.title.trim())
      newErrors.title = "El nombre es obligatorio";

    if (!form.price || Number(form.price) <= 0)
      newErrors.price = "Precio inválido";

    if (!form.stock || Number(form.stock) < 0)
      newErrors.stock = "Stock inválido";

    if (!form.categoryId)
      newErrors.categoryId = "Selecciona una categoría";

    if (form.images.length === 0)
      newErrors.images = "Debes subir al menos una imagen";

    return newErrors;
  };

  // 🔹 Guardar producto
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session?.user?.id) {
      return alert("No estás logueado");
    }

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newProduct = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newProduct),
    });

    const data = await res.json();

    if (!res.ok) {
      return alert(data.error || "Error al guardar el producto");
    }

    setToast(true);

    setTimeout(() => {
      router.push("/dashboard/products");
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Agregar nuevo producto
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <input
          name="title"
          placeholder="Nombre del producto"
          className="border p-3 rounded"
          value={form.title}
          onChange={handleChange}
        />
        {errors.title && (
          <p className="text-red-500 text-sm">
            {errors.title}
          </p>
        )}

        <input
          name="price"
          type="number"
          placeholder="Precio"
          className="border p-3 rounded"
          value={form.price}
          onChange={handleChange}
        />
        {errors.price && (
          <p className="text-red-500 text-sm">
            {errors.price}
          </p>
        )}

        <input
          name="stock"
          type="number"
          placeholder="Stock"
          className="border p-3 rounded"
          value={form.stock}
          onChange={handleChange}
        />
        {errors.stock && (
          <p className="text-red-500 text-sm">
            {errors.stock}
          </p>
        )}

        <select
          name="categoryId"
          className="border p-3 rounded"
          value={form.categoryId}
          onChange={handleChange}
        >
          <option value="">
            Seleccionar categoría
          </option>

          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {errors.categoryId && (
          <p className="text-red-500 text-sm">
            {errors.categoryId}
          </p>
        )}

        <textarea
          name="description"
          placeholder="Descripción"
          className="border p-3 rounded min-h-[120px]"
          value={form.description}
          onChange={handleChange}
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImages}
        />

        {errors.images && (
          <p className="text-red-500 text-sm">
            {errors.images}
          </p>
        )}

        {imagesPreview.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-2">
            {imagesPreview.map((img, i) => (
              <div
                key={i}
                className="relative w-full aspect-square border rounded overflow-hidden"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded hover:bg-black"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div className="mt-3 p-3 bg-green-100 border border-green-300 text-green-800 rounded text-sm">
            Producto guardado correctamente
          </div>
        )}

        <button className="bg-lime-600 text-white p-3 rounded hover:bg-lime-700">
          Guardar producto
        </button>
      </form>
    </div>
  );
}