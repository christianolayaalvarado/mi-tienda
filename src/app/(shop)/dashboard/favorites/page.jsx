"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((data) => {
        setFavorites(data.favorites || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function removeFavorite(productId) {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
    await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Favoritos</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-4">❤️</p>
          <p className="text-gray-500 text-sm">Aún no tienes favoritos</p>
          <p className="text-gray-400 text-xs mt-1">Toca el corazón en cualquier producto para guardarlo aquí</p>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
          >
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {favorites.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              <Link href={`/product/${product.id}`} className="block">
                <div className="relative h-36 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl">
                      📷
                    </div>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      -{product.discountPct || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <Link href={`/product/${product.id}`}>
                  <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 hover:text-green-600 transition">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-green-600 font-bold text-sm mt-1">S/ {product.price}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{product.store?.name || "Tienda"}</p>

                <button
                  onClick={() => removeFavorite(product.id)}
                  className="mt-2 w-full text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5 rounded-lg transition"
                >
                  Quitar de favoritos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
