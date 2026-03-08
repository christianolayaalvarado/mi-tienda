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
      blurDataURL="/placeholder.jpg"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      )  }
      </div>

      <div className="p-4">
        <h2 className="text-sm truncate font-semibold line-clamp-2">
          {product.title}
        </h2>

        <p className="text-green-600 font-bold text-xl mt-2">
          S/ {product.price}
        </p>
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