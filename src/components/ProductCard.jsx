"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import SocialProof from "@/components/SocialProof";
import { optimizeCloudinary } from "@/lib/cloudinaryOptimize";
import FeaturedBadge from "@/components/FeaturedBadge";
import { useCelebrations } from "@/context/CelebrationsContext";

const imageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

export default function ProductCard({ product, priority }) {
  const [imgError, setImgError] = useState(false);
  const { active: celebration } = useCelebrations();

  if (!product) return null;

  const categoryName = product.category?.name || "Sin categoría";
  const storeName = product.store?.name || "Tienda";
  const storeCode = product.store?.code;

  const hasValidImage = product.images?.[0] && !imgError;
  const productId = product.id?.toString() || product.id;

  return (
    <div className="group card-theme rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Link href={`/product/${productId}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <span className="absolute top-2 left-2 z-10 bg-black/20 text-white text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm">
            {categoryName}
          </span>

          {product.featured && (
            <div className="absolute top-2 left-2 z-20 mt-6">
              <FeaturedBadge plan={product.featured} />
            </div>
          )}

          {/* Imagen de celebración activa */}
          {celebration && celebration.cardImage && (
            <div className="absolute top-1.5 right-1.5 z-10" title={celebration.name}>
              <img src={celebration.cardImage} alt={celebration.name} width="60" height="60" className="drop-shadow object-contain" />
            </div>
          )}

          {product.originalPrice && product.originalPrice > product.price && (
            <span className="absolute bottom-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
              -{product.discountPct || Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </span>
          )}

          {product.stock === 0 && (
            <span className="absolute bottom-2 left-2 z-10 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
              Agotado
            </span>
          )}

          {hasValidImage ? (
            <img
              src={optimizeCloudinary(product.images[0], { width: 600 })}
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

          <div className="mt-1">
            <SocialProof productId={product.id} type="viewing" />
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 flex items-center gap-2">
        <p className="text-xs text-theme-secondary flex-1 min-w-0 truncate">
          por{" "}
          {storeCode ? (
            <Link href={`/store/${storeCode}`} className="font-medium hover:underline hover:text-green-600">
              {storeName}
            </Link>
          ) : (
            <span className="font-medium">{storeName}</span>
          )}
          {product.user?.isVerified && <span title="Vendedor verificado" className="inline-flex items-center ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded-full font-medium">✓</span>}
        </p>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${product.title || "Producto"} - S/ ${product.price}\nhttps://mi-tienda-app-theta.vercel.app/product/${productId}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Compartir por WhatsApp"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

        <Link href={`/product/${productId}`} className="shrink-0">
          <span className="btn-primary py-1.5 px-3 rounded-lg text-sm font-medium transition whitespace-nowrap">
            Ver detalle
          </span>
        </Link>
      </div>
    </div>
  );
}
