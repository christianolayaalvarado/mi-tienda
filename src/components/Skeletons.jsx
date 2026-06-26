export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-lg border border-gray-100 animate-pulse">
      <div className="w-20 h-20 bg-gray-200 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="flex items-center gap-2 mt-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-8 h-4 bg-gray-200 rounded" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-16 shrink-0" />
    </div>
  );
}

export function OrderItemSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-6 bg-gray-200 rounded-full w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-gray-200 rounded w-24" />
        <div className="h-8 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="bg-white rounded-xl p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-14 h-14 bg-gray-200 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
