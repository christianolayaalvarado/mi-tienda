export default function ProductCardSkeleton() {
  return (
    <div className="animate-pulse border rounded-lg p-4 shadow-sm">

      {/* Imagen */}
      <div className="w-full h-40 bg-gray-300 rounded mb-4"></div>

      {/* Título */}
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>

      {/* Precio */}
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>

      {/* Botón */}
      <div className="h-8 bg-gray-300 rounded w-full mt-4"></div>

    </div>
  )
}