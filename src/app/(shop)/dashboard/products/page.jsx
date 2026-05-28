"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast"; // 🔥 IMPORT

// 🔹 Debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  const debouncedSearch = useDebounce(search, 500);

  // 🔹 Fetch productos
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryId) params.append("categoryId", categoryId);
      params.append("page", page);
      params.append("limit", limit);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);

      setSelectedProducts([]);

    } catch (err) {
      console.error("Error cargando productos:", err);
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 categorías
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();

      const unique = Array.from(
        new Map(data.map((c) => [c.id, c])).values()
      );

      setCategories(unique);
    } catch (err) {
      console.error(err);
      toast.error("Error cargando categorías");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, categoryId, page]);

  // 🔹 selección
  const toggleSelect = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  // 🔥 DELETE MULTIPLE CON TOAST
  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;

    const confirmDelete = confirm(
      `¿Eliminar ${selectedProducts.length} producto(s)?`
    );
    if (!confirmDelete) return;

    const loadingToast = toast.loading("Eliminando productos...");

    try {
      setDeleting(true);

      const res = await fetch("/api/products/bulk-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedProducts }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        toast.dismiss(loadingToast);
        toast.error(data.error || "Error eliminando productos");
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Productos eliminados correctamente");

      await fetchProducts();

    } catch (err) {
      console.error("Error eliminando:", err);
      toast.dismiss(loadingToast);
      toast.error("Error eliminando productos");
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 paginación
  const handlePrev = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  if (loading) return <p>Cargando productos...</p>;

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Mis Productos</h1>

        <div className="flex gap-2">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedProducts.length === 0 || deleting}
            className={`px-4 py-2 rounded text-white ${
              selectedProducts.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {deleting
              ? "Eliminando..."
              : `🗑 Eliminar (${selectedProducts.length})`}
          </button>

          <Link href="/dashboard/products/new">
            <button className="bg-green-600 text-white px-4 py-2 rounded">
              + Nuevo
            </button>
          </Link>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded flex-1"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Todas</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* SELECT ALL */}
      <div className="mb-4 flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={
              products.length > 0 &&
              selectedProducts.length === products.length
            }
            onChange={toggleSelectAll}
          />
          Seleccionar todos
        </label>

        {selectedProducts.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedProducts.length} seleccionados
          </span>
        )}
      </div>

      {/* GRID */}
      {products.length === 0 ? (
        <p>No tienes productos</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`border p-3 rounded ${
                selectedProducts.includes(product.id)
                  ? "ring-2 ring-red-500"
                  : ""
              }`}
            >
              <div className="flex justify-between mb-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => toggleSelect(product.id)}
                />

                <Link href={`/dashboard/products/edit/${product.id}`}>
                  <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    Editar
                  </button>
                </Link>
              </div>

              {product.images?.[0] && (
                <img
                  src={product.images[0]}
                  className="w-full h-24 object-cover mb-2 rounded"
                />
              )}

              <h2 className="text-sm font-bold line-clamp-2">
                {product.title}
              </h2>

              <p className="text-sm">S/ {product.price}</p>
            </div>
          ))}
        </div>
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-4">
          <button onClick={handlePrev} disabled={page === 1}>
            Anterior
          </button>

          <span>
            Página {page} de {totalPages}
          </span>

          <button onClick={handleNext} disabled={page === totalPages}>
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}