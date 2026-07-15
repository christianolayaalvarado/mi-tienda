"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";

const imageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export default function ProductCard({ product, priority }) {
  const [imgError, setImgError] = useState(false);
  const { isFavorited, toggle, loaded } = useFavorites();

  if (!product) return null;

  const categoryName = product.category?.name || "Sin categoría";
  const storeName = product.store?.name || "Tienda";
  const storeCode = product.store?.code;

  const hasValidImage = product.images?.[0] && !imgError;
  const productId = product.id?.toString() || product.id;
  const fav = loaded && isFavorited(productId);

  return (
    <div className="group card-theme rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Link href={`/product/${productId}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <span className="absolute top-2 left-2 z-10 bg-black/20 text-white text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm">
            {categoryName}
          </span>

          {product.originalPrice && product.originalPrice > product.price && (
            <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
              -{product.discountPct || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}

          {hasValidImage ? (
            <img
              src={product.images[0]}
              alt={product.title || "Producto"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <img
              src="/images/placeholder.png"
              alt="Imagen por defecto"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-3">
          <h2 className="text-sm font-semibold line-clamp-2 text-theme-primary">
            {product.title || "Producto sin título"}
          </h2>

          <p className="text-green-600 font-bold text-lg mt-1">
            S/ {product.price ?? 0}
          </p>

          {product.stock === 1 && (
            <p className="text-red-600 text-xs font-semibold mt-1">🔥 Última unidad</p>
          )}

          {product.stock > 1 && product.stock <= 3 && (
            <p className="text-orange-600 text-xs font-semibold mt-1">🔥 Solo quedan {product.stock}</p>
          )}
        </div>
      </Link>

      <div className="px-3 pb-3 flex items-center gap-2">
        <p className="text-xs text-theme-secondary flex-1">
          por{" "}
          {storeCode ? (
            <Link href={`/store/${storeCode}`} className="font-medium hover:underline hover:text-green-600">
              {storeName}
            </Link>
          ) : (
            <span className="font-medium">{storeName}</span>
          )}
        </p>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(productId);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition flex-shrink-0"
          aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <svg
            className="w-5 h-5 transition-colors"
            fill={fav ? "#ef4444" : "none"}
            stroke={fav ? "#ef4444" : "#9ca3af"}
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <Link href={`/product/${productId}`}>
          <button className="btn-primary py-1.5 px-3 rounded-lg text-sm font-medium transition">
            Ver detalle
          </button>
        </Link>
      </div>
    </div>
  );
}
