import Image from "next/image"
import Link from "next/link"

export default function ProductCard({ product, priority }) {
  return (
  <Link href={`/product/${product.id}`} className="block">
    <div className="group bg-white rounded-xl shadow-md overflow-hidden transform transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-48">

      <span className="absolute top-3 left-3 z-10 bg-black/20 text-white text-[10px] font-semibold px-3 py-1 rounded-md backdrop-blur-sm">
      {product.category}
      </span>

      {product.images?.[0] && (
      <Image
      src={product.images[0]}
      alt={product.title}
      fill
      priority={priority}
      sizes="(max-width: 640px) 50vw,
         (max-width: 1024px) 33vw,
         (max-width: 1280px) 25vw,
         16vw"
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbGw9JyNlNWU3ZWInLz48L3N2Zz4="
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      )  }
      </div>

      <div className="p-4">
        <h2 className="text-base sm:text-sm truncate font-semibold line-clamp-2">
          {product.title}
        </h2>

        <p className="text-green-600 font-bold text-2xl sm:text-xl mt-2">
          S/ {product.price}
        </p>
        
        {product.stock === 1 && (
          <p className="text-red-600 text-xs font-semibold mt-1">
            🔥 Última unidad
          </p>
        )}

        {product.stock > 1 && product.stock <= 3 && (
          <p className="text-orange-600 text-xs font-semibold mt-1">
            🔥 Solo quedan {product.stock}
          </p>
        )}  


        <p className="text-xs text-gray-500 mt-1">
        por <span className="font-medium"> {product.store}</span>
        </p>
        

          <button className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-medium shadow-sm hover:bg-green-700 hover:shadow-md transition ">
          Ver detalle
          </button>
       
      </div>
    </div>
    </Link>
  )
}