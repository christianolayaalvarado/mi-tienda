import Image from "next/image";
import Link from "next/link";

export default function ProductCard({ product, priority }) {
  if (!product) return null;

  const categoryName = product.category?.name || "Sin categoría";
  const storeName = product.store?.name || "Tienda";
  const storeCode = product.store?.code;

  // sizes para imágenes con fill: ajustar según tu layout
  const imageSizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return (
    <div className="group bg-white rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <Link href={`/product/${product.id.toString()}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <span className="absolute top-2 left-2 z-10 bg-black/20 text-white text-[10px] font-semibold px-2 py-1 rounded-md backdrop-blur-sm">
            {categoryName}
          </span>

          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title || "Producto"}
              fill
              sizes={imageSizes}
              loading={priority ? "eager" : "lazy"}
              priority={priority || false}
              style={{ objectFit: "cover" }}
              className="transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Image
              src="/images/placeholder.png"
              alt="Imagen por defecto"
              fill
              sizes={imageSizes}
              loading={priority ? "eager" : "lazy"}
              style={{ objectFit: "cover" }}
              className="object-cover"
            />
          )}
        </div>

        <div className="p-3">
          <h2 className="text-sm font-semibold line-clamp-2">
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

      <div className="px-3 pb-3">
        <p className="text-xs text-gray-500">
          por{" "}
          {storeCode ? (
            <Link href={`/store/${storeCode}`} className="font-medium hover:underline hover:text-green-600">
              {storeName}
            </Link>
          ) : (
            <span className="font-medium">{storeName}</span>
          )}
        </p>

        <Link href={`/product/${product.id.toString()}`}>
          <button className="mt-2 w-full bg-green-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            Ver detalle
          </button>
        </Link>
      </div>
    </div>
  );
}
