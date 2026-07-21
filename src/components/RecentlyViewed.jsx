"use client";

import Link from "next/link";

export default function RecentlyViewed({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-10 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Vistos recientemente</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.id}`}
            className="flex-shrink-0 w-36 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            {item.image ? (
              <img src={item.image} alt={item.title} className="w-full h-24 object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-300">📦</div>
            )}
            <div className="p-2">
              <p className="text-xs font-medium text-gray-800 line-clamp-2">{item.title}</p>
              <p className="text-xs font-bold text-green-600 mt-1">S/ {item.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
