"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function FeaturedCarousel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselRef = useRef(null);

  // Detectar items por vista según tamaño de pantalla
  useEffect(() => {
    const updateItemsPerView = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) setItemsPerView(1);
        else if (window.innerWidth < 1024) setItemsPerView(2);
        else setItemsPerView(3);
      }
    };
    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch("/api/products?limit=10&sort=featured");
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          const fallbackRes = await fetch("/api/products?limit=10&sort=newest");
          const fallbackData = await fallbackRes.json();
          setProducts(fallbackData.products || []);
        }
      } catch (err) {
        console.error("Error fetching featured products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (isPaused || products.length <= itemsPerView) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, products.length, itemsPerView]);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const getVisibleProducts = () => {
    const visible = [];
    for (let i = 0; i < itemsPerView; i++) {
      const idx = (currentIndex + i) % products.length;
      visible.push(products[idx]);
    }
    return visible;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl animate-pulse flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-300 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (products.length === 0) return null;

  const visibleProducts = getVisibleProducts();
  const maxIndex = products.length - itemsPerView;

  return (
    <div
      data-banner="featured"
      className="relative w-full h-full overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 shadow-lg shadow-blue-500/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={carouselRef}
    >
      {/* Header compacto */}
      <div className="relative z-10 px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center featured-icon">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Productos Destacados</h2>
              <p className="text-xs text-gray-500 hidden sm:block">Los más populares de nuestra tienda</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Dots indicators */}
            <div className="hidden sm:flex items-center gap-1">
              {products.slice(0, maxIndex + 1).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "bg-blue-600 w-4" : "bg-gray-300"
                  }`}
                  aria-label={`Ir al slide ${idx + 1}`}
                />
              ))}
            </div>
            {/* Nav arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                className="w-8 h-8 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all"
                disabled={products.length <= itemsPerView}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="w-8 h-8 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all"
                disabled={products.length <= itemsPerView}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative z-10 px-4 sm:px-6 pb-4">
        <div className="flex gap-3 transition-transform duration-500 ease-out">
          {visibleProducts.map((product, idx) => (
            <div key={product.id + "-" + idx} className="flex-1 min-w-0">
              <div className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 overflow-hidden group">
                <div className="flex items-center gap-3 p-3">
                  {/* Imagen */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name || product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {product.category?.name && (
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {product.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {product.name || product.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base font-bold text-blue-600">
                        S/ {Number(product.price || 0).toFixed(2)}
                      </span>
                      {product._avgRating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {product._avgRating.toFixed(1)}
                        </span>
                      )}
                      {product._totalSold > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {product._totalSold} vendidos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/product/${product.id}`}
                    className="flex-shrink-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center text-white transition-all hover:scale-110"
                    aria-label="Ver producto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
