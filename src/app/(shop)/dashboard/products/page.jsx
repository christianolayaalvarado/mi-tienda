"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import useCategories from "@/hooks/useCategories";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductsPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  const debouncedSearch = useDebounce(search, 500);

  const { categories, loading: loadingCategories } = useCategories();

  useEffect(() => {
    const loadUser = async () => {
      setAuthLoading(true);
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          setUser(data?.user || null);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error cargando usuario:", err);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    loadUser();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryId) params.append("categoryId", categoryId);
      if (stockFilter) params.append("stock", stockFilter);
      params.append("page", page);
      params.append("limit", limit);

      const res = await fetch(`/api/products/mine?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        toast.error("No autorizado. Inicia sesión.");
        setProducts([]);
        setTotalPages(1);
        return;
      }

      const data = await res.json().catch(() => null);
      setProducts(data?.products || []);
      setTotalPages(data?.totalPages || 1);
      setSelectedProducts([]);
    } catch (err) {
      console.error("Error cargando productos:", err);
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [debouncedSearch, categoryId, stockFilter]);
  useEffect(() => { fetchProducts(); }, [debouncedSearch, categoryId, stockFilter, page]);

  const toggleSelect = (id) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) setSelectedProducts([]);
    else setSelectedProducts(products.map((p) => p.id));
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`¿Eliminar ${selectedProducts.length} producto(s)?`)) return;

    const loadingToast = toast.loading("Eliminando productos...");
    try {
      setDeleting(true);
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedProducts }),
      });

      if (res.status === 401) {
        toast.dismiss(loadingToast);
        toast.error("No autorizado. Inicia sesión.");
        return;
      }
      if (res.status === 403) {
        toast.dismiss(loadingToast);
        toast.error("No tienes permiso para eliminar esos productos.");
        return;
      }

      const data = await res.json().catch(() => ({}));
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

  const handlePrev = () => { if (page > 1) setPage((p) => p - 1); };
  const handleNext = () => { if (page < totalPages) setPage((p) => p + 1); };

  if (authLoading || loading) return <p>Cargando productos...</p>;
  if (!user) return <p>Debes iniciar sesión para ver tus productos.</p>;

  const normalize = (v) => (v == null ? null : String(v));

  return (
    <div className="p-6">
      <Breadcrumbs />

      <div className="flex justify-between items-center mb-4 mt-4">
        <h1 className="text-2xl font-bold">Mis Productos</h1>

        <div className="flex gap-2">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedProducts.length === 0 || deleting}
            className={`px-4 py-2 rounded text-white ${selectedProducts.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
          >
            {deleting ? "Eliminando..." : `🗑 Eliminar (${selectedProducts.length})`}
          </button>

          <Link href="/dashboard/products/new">
            <button className="bg-green-600 text-white px-4 py-2 rounded">+ Nuevo</button>
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2 rounded flex-1" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="border p-2 rounded">
          <option value="">Todas</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="border p-2 rounded">
          <option value="">Todo el stock</option>
          <option value="available">Disponibles</option>
          <option value="out">Agotados</option>
        </select>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={products.length > 0 && selectedProducts.length === products.length} onChange={toggleSelectAll} />
          Seleccionar todos
        </label>

        {selectedProducts.length > 0 && <span className="text-sm text-gray-600">{selectedProducts.length} seleccionados</span>}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="package"
          title="No tienes productos"
          description="Crea tu primer producto para empezar a vender."
          actionHref="/dashboard/products/new"
          actionLabel="Crear producto"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => {
            const sessionUserId = normalize(user?.id);
            const productUserId = normalize(product.userId);
            const productStoreId = normalize(product.storeId);
            const sessionStoreCode = normalize(user?.storeCode);
            const sessionRole = user?.role ?? null;

            const isOwner = sessionUserId && productUserId && sessionUserId === productUserId;
            const isStoreOwner = sessionStoreCode && productStoreId && sessionStoreCode === productStoreId;
            const isAdmin = sessionRole === "admin";

            const canEdit = isAdmin || isOwner || isStoreOwner;

            return (
              <div key={product.id} className={`border p-3 rounded ${selectedProducts.includes(product.id) ? "ring-2 ring-red-500" : ""}`}>
                <div className="flex justify-between mb-2">
                  <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleSelect(product.id)} />

                  {canEdit ? (
                    <Link href={`/dashboard/products/edit/${product.id}`}>
                      <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Editar</button>
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500 px-2 py-1">Solo lectura</span>
                  )}
                </div>

                {product.images?.[0] && <img src={product.images[0]} className="w-full h-24 object-cover mb-2 rounded" />}

                <h2 className="text-sm font-bold line-clamp-2">{product.title}</h2>
                <p className="text-sm font-semibold text-green-700">S/ {product.price}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs font-medium ${product.stock === 0 ? "text-red-600" : product.stock <= 3 ? "text-orange-600" : "text-gray-500"}`}>
                    {product.stock === 0 ? "Agotado" : `Stock: ${product.stock}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-4">
          <button onClick={handlePrev} disabled={page === 1}>Anterior</button>
          <span>Página {page} de {totalPages}</span>
          <button onClick={handleNext} disabled={page === totalPages}>Siguiente</button>
        </div>
      )}
    </div>
  );
}
