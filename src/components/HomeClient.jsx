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
import AbandonedCartBanner from "@/components/AbandonedCartBanner";
import RecentlyViewed from "@/components/RecentlyViewed";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

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

  const { recentlyViewed } = useRecentlyViewed();

  // Width percentages per state (desktop):
  //   0s:   Featured=100%, Mascots=0%,    Latest=0%
  //   +10s: Featured=70%,  Mascots=30%,   Latest=0%
  //   +20s: Featured=0%,   Mascots=30%,   Latest=70%
  //   +34s: Featured=70%,  Mascots=30%,   Latest=0%
  //   +44s: Featured=100%, Mascots=0%,    Latest=0%
  const featuredWidth = featuredHidden ? "0%" : promoVisible ? "70%" : "100%";
  const mascotWidth = promoVisible ? "30%" : "0%";
  const latestWidth = latestVisible ? "70%" : "0%";

  // Mobile: which banner is active (0=Featured, 1=Mascots, 2=Latest)
  const mobileActiveIndex = featuredHidden && latestVisible ? 2 : promoVisible ? 1 : 0;

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

      {/* Banner Fiestas Patrias */}
      {!currentSearch && !currentCategory && (
        <a href="/ofertas" className="block mb-4 rounded-xl overflow-hidden relative group">
          <div className="w-full h-[100px] sm:h-[120px] flex items-center justify-between px-5 sm:px-8"
            style={{ background: "linear-gradient(135deg, #C8102E 0%, #8B0000 40%, #C8102E 70%, #fff 100%)" }}>
            <div className="flex items-center gap-3 sm:gap-4">
              <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-lg">
                <defs>
                  <radialGradient id="rGradR2" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#e8304a" />
                    <stop offset="100%" stopColor="#C8102E" />
                  </radialGradient>
                  <radialGradient id="rGradW2" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#fff" />
                    <stop offset="100%" stopColor="#e8e8e8" />
                  </radialGradient>
                </defs>
                <path d="M36,58 L14,96 Q18,100 22,96 L40,58Z" fill="#fff" />
                <path d="M40,58 L22,96 Q26,100 30,96 L44,58Z" fill="#C8102E" />
                <path d="M44,58 L30,96 Q34,100 38,96 L48,58Z" fill="#fff" />
                <path d="M60,58 L56,96 Q60,100 64,96 L68,58Z" fill="#fff" />
                <path d="M64,58 L64,96 Q68,100 72,96 L76,58Z" fill="#C8102E" />
                <path d="M70,58 L72,96 Q76,100 80,96 L84,58Z" fill="#fff" />
                {Array.from({length:14}).map((_,i) => {
                  const angle = (i * (360/14)) * Math.PI / 180;
                  const cx = 50 + Math.cos(angle) * 28;
                  const cy = 38 + Math.sin(angle) * 28;
                  return <ellipse key={`ow${i}`} cx={cx} cy={cy} rx="13" ry="9" transform={`rotate(${i*(360/14)} ${cx} ${cy})`} fill="url(#rGradR2)" />;
                })}
                {Array.from({length:14}).map((_,i) => {
                  const angle = (i * (360/14) + 360/28) * Math.PI / 180;
                  const cx = 50 + Math.cos(angle) * 20;
                  const cy = 38 + Math.sin(angle) * 20;
                  return <ellipse key={`ir${i}`} cx={cx} cy={cy} rx="10" ry="7" transform={`rotate(${i*(360/14)+360/28} ${cx} ${cy})`} fill="url(#rGradW2)" stroke="#ddd" strokeWidth="0.3" />;
                })}
                <circle cx="50" cy="38" r="14" fill="url(#rGradR2)" stroke="#a0082a" strokeWidth="1" />
                <circle cx="50" cy="38" r="10" fill="none" stroke="#fff" strokeWidth="0.6" strokeDasharray="2,1.5" />
                <text x="50" y="42" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">PE</text>
              </svg>
              <div>
                <p className="text-white text-lg sm:text-2xl font-extrabold drop-shadow-lg tracking-wide">FIESTAS PATRIAS</p>
                <p className="text-white/90 text-xs sm:text-sm font-semibold">Ofertas especiales por semana patria</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="bg-white text-[#C8102E] text-sm font-bold px-4 py-2 rounded-full group-hover:scale-105 transition-transform">
                Ver ofertas →
              </span>
            </div>
          </div>
        </a>
      )}

      {/* 3 banners: Featured + Mascots + Latest */}
      {!currentSearch && !currentCategory && (
        <>
          {/* Mobile: carousel push effect — one banner at a time */}
          <div className="relative w-full h-[200px] lg:hidden rounded-xl overflow-hidden">
            <div
              className="flex h-full transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateX(-${mobileActiveIndex * 100}%)` }}
            >
              <div className="w-full h-full shrink-0">
                <FeaturedCarousel />
              </div>
              <div className="w-full h-full shrink-0">
                <MascotPromoBanner />
              </div>
              <div className="w-full h-full shrink-0">
                <LatestProductsBanner />
              </div>
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

      {/* Abandoned cart reminder */}
      {!currentSearch && !currentCategory && <AbandonedCartBanner />}

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

      {/* Recently viewed products */}
      {!currentSearch && !currentCategory && <RecentlyViewed items={recentlyViewed} />}

      {/* Mascota animada */}
      <ScrollMascot onClick={() => window.dispatchEvent(new CustomEvent("open-help-modal"))} />
    </div>
  );
}
