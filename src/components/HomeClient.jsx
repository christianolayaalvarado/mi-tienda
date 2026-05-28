"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";

export default function HomeClient() {
  console.log("Render HomeClient");

  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------------- PARAMS ----------------
  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  // ---------------- STATES ----------------
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchController = useRef(null);
  const isFirstLoad = useRef(true);

  // ---------------- FETCH PRODUCTS ----------------
  const fetchProducts = async () => {
    try {
      setLoading(true);

      if (fetchController.current) fetchController.current.abort();
      fetchController.current = new AbortController();

      const params = new URLSearchParams();
      if (currentSearch) params.set("search", currentSearch);
      if (currentCategory) params.set("category", currentCategory);
      if (currentSort) params.set("sort", currentSort);
      params.set("page", currentPage);

      const res = await fetch(`/api/products?${params.toString()}`, {
        signal: fetchController.current.signal,
      });

      if (!res.ok) throw new Error("Error al obtener productos");

      const data = await res.json();

      // 🔹 Evitar duplicados
      const uniqueProducts = Array.from(
        new Map(data.products.map((p) => [p.id, p])).values()
      );

      setProducts(uniqueProducts);
      setTotalPages(data.totalPages || 1);

    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Error fetch productos:", err);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EFFECT ----------------
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchProducts();
      return;
    }
    const timer = setTimeout(fetchProducts, 400);
    return () => clearTimeout(timer);
  }, [currentSearch, currentCategory, currentSort, currentPage]);

  // ---------------- PAGINACIÓN ----------------
  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;

    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSort) params.set("sort", currentSort);
    params.set("page", page);

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // ---------------- RENDER ----------------
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* LOADING */}
      {loading && (
        <p className="text-center text-sm text-gray-500 mb-4">
          Cargando productos...
        </p>
      )}

      {/* 🔥 GRID MIXTO (SIN TIENDAS) */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={idx < 5}
            />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {!loading && products.length === 0 && (
        <p className="text-center">No se encontraron productos.</p>
      )}

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => changePage(page)}
              className={`px-3 py-1 rounded border ${
                currentPage === page
                  ? "bg-green-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}