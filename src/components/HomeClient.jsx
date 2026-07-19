"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import MascotPromoBanner from "@/components/MascotPromoBanner";
import LatestProductsBanner from "@/components/LatestProductsBanner";
import MascotWelcomeModal from "@/components/MascotWelcomeModal";
import ScrollMascot from "@/components/ScrollMascot";
import EmptyState from "@/components/EmptyState";

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------------- PARAMS (lectura segura y memoizada)
  const currentSearch = searchParams?.get("search") || "";
  const currentCategory = searchParams?.get("category") || "";
  const currentSort = searchParams?.get("sort") || "";
  const currentPage = Number(searchParams?.get("page") || 1) || 1;

  // ---------------- STATES
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promoVisible, setPromoVisible] = useState(false);
  const [latestVisible, setLatestVisible] = useState(false);
  const [featuredHidden, setFeaturedHidden] = useState(false);

  // Width percentages per state:
  //   0s:   Featured=100%, Mascots=0%,    Latest=0%
  //   +10s: Featured=70%,  Mascots=30%,   Latest=0%
  //   +20s: Featured=0%,   Mascots=30%,   Latest=70%
  //   +34s: Featured=70%,  Mascots=30%,   Latest=0%
  //   +44s: Featured=100%, Mascots=0%,    Latest=0%
  const featuredWidth = featuredHidden ? "0%" : promoVisible ? "70%" : "100%";
  const mascotWidth = promoVisible ? "30%" : "0%";
  const latestWidth = latestVisible ? "70%" : "0%";

  const fetchController = useRef(null);
  const isFirstLoad = useRef(true);
  const mounted = useRef(false);

  // Banner cycle: 10s mascots → 20s latest+hide featured → 34s featured+hide latest → 44s hide mascots → 45s restart
  useEffect(() => {
    let timers = [];
    const clear = () => timers.forEach(clearTimeout);
    const delay = (ms, fn) => { timers.push(setTimeout(fn, ms)); };

    const runCycle = () => {
      setPromoVisible(false);
      setLatestVisible(false);
      setFeaturedHidden(false);
      delay(10000, () => setPromoVisible(true));
      delay(20000, () => { setFeaturedHidden(true); setLatestVisible(true); });
      delay(34000, () => { setFeaturedHidden(false); setLatestVisible(false); });
      delay(44000, () => setPromoVisible(false));
      delay(45000, runCycle);
    };

    runCycle();
    return clear;
  }, []);

  // evitar renderizar una paginación enorme
  const safeTotalPages = Math.max(1, Math.min(Number(totalPages || 1), 500));

  // memoizar parámetros para evitar recrear URLSearchParams en cada render
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSort) params.set("sort", currentSort);
    params.set("page", String(currentPage || 1));
    params.set("limit", "15");
    return params.toString();
  }, [currentSearch, currentCategory, currentSort, currentPage]);

  // ---------------- FETCH PRODUCTS (robusto)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Abort previo
      if (fetchController.current) {
        try { fetchController.current.abort(); } catch {}
      }
      fetchController.current = new AbortController();

      const res = await fetch(`/api/products?${queryString}`, {
        signal: fetchController.current.signal,
        headers: { Accept: "application/json" },
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("API /api/products responded with non-ok status:", res.status, text);
        throw new Error(text || `Error al obtener productos (${res.status})`);
      }

      if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "");
        console.error("API /api/products returned non-JSON response:", text);
        throw new Error("Respuesta inválida del servidor (no JSON)");
      }

      const data = await res.json();

      if (!data || !Array.isArray(data.products)) {
        console.error("Payload inesperado de /api/products:", data);
        throw new Error("Respuesta inválida del servidor");
      }

      // Evitar duplicados por id
      const uniqueProducts = Array.from(new Map(data.products.map((p) => [p.id, p])).values());

      setProducts(uniqueProducts);
      setTotalPages(Number(data.totalPages || 1));
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error("Error fetch productos:", err);
      setProducts([]);
      setTotalPages(1);
      setError(err?.message || "Error al obtener productos");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- EFFECT: carga inicial y cambios de filtros
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (fetchController.current) {
        try { fetchController.current.abort(); } catch {}
        fetchController.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      fetchProducts();
      return;
    }
    const t = setTimeout(() => {
      if (mounted.current) fetchProducts();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  // ---------------- PAGINACIÓN (navegación segura)
  const changePage = (page) => {
    if (page < 1 || page > safeTotalPages) return;

    const params = new URLSearchParams();
    if (currentSearch) params.set("search", currentSearch);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSort) params.set("sort", currentSort);
    params.set("page", String(page));
    params.set("limit", "15");

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // ---------------- RENDER
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-8 pb-20 sm:pb-16">
      {/* Modal de bienvenida de mascotas */}
      <MascotWelcomeModal />

      {/* 3 banners: Featured + Mascots + Latest */}
      {!currentSearch && !currentCategory && (
        <>
          {/* Mobile: one banner at a time, fixed height, smooth fade */}
          <div className="relative w-full h-[200px] lg:hidden rounded-xl overflow-hidden">
            {/* Featured */}
            <div
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: featuredHidden ? 0 : 1, pointerEvents: featuredHidden ? "none" : "auto" }}
            >
              <FeaturedCarousel />
            </div>
            {/* Mascots */}
            <div
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: promoVisible ? 1 : 0, pointerEvents: promoVisible ? "auto" : "none" }}
            >
              <MascotPromoBanner />
            </div>
            {/* Latest */}
            <div
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: latestVisible ? 1 : 0, pointerEvents: latestVisible ? "auto" : "none" }}
            >
              <LatestProductsBanner />
            </div>
          </div>

          {/* Desktop: side by side, smooth fade + width */}
          <div className="hidden lg:flex gap-3 w-full h-[200px]">
            <div
              className="h-full shrink-0 overflow-hidden rounded-xl transition-all duration-1000 ease-in-out"
              style={{ width: featuredWidth, opacity: featuredHidden ? 0 : 1 }}
            >
              <FeaturedCarousel />
            </div>
            <div
              className="h-full shrink-0 overflow-hidden rounded-xl transition-all duration-1000 ease-in-out"
              style={{ width: mascotWidth, opacity: promoVisible ? 1 : 0 }}
            >
              <MascotPromoBanner />
            </div>
            <div
              className="h-full shrink-0 overflow-hidden rounded-xl transition-all duration-1000 ease-in-out"
              style={{ width: latestWidth, opacity: latestVisible ? 1 : 0 }}
            >
              <LatestProductsBanner />
            </div>
          </div>
        </>
      )}

      {/* Título de sección + selector de orden */}
      {!currentSearch && !currentCategory && (
        <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Todos los productos</h2>
            <p className="text-gray-500 text-sm mt-1">Explora nuestro catálogo completo</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs text-gray-500 whitespace-nowrap">Ordenar por:</label>
            <select
              id="sort-select"
              value={currentSort}
              onChange={(e) => {
                const params = new URLSearchParams();
                if (currentSearch) params.set("search", currentSearch);
                if (currentCategory) params.set("category", currentCategory);
                if (e.target.value) params.set("sort", e.target.value);
                params.set("page", "1");
                params.set("limit", "15");
                router.push(`/?${params.toString()}`, { scroll: false });
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none cursor-pointer"
            >
              <option value="">Más recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">A → Z</option>
              <option value="name-desc">Z → A</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 5} />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <EmptyState
          icon="search"
          title="No se encontraron productos"
          description={currentSearch ? `No hay resultados para "${currentSearch}". Intenta con otros términos.` : "Aún no hay productos disponibles. Vuelve pronto."}
          actionHref={currentSearch ? "/" : undefined}
          actionLabel={currentSearch ? "Limpiar búsqueda" : undefined}
        />
      )}

      {safeTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ←
          </button>

          {Array.from({ length: safeTotalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => changePage(page)}
              className={`px-3 py-1 rounded border ${currentPage === page ? "bg-green-600 text-white" : "hover:bg-gray-100"}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === safeTotalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            →
          </button>
        </div>
      )}

      {/* Mascota animada */}
      <ScrollMascot onClick={() => window.dispatchEvent(new CustomEvent("open-help-modal"))} />
    </div>
  );
}
