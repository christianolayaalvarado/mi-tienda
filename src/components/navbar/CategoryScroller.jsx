// components/navbar/CategoryScroller.jsx
"use client";

import Link from "next/link";

export default function CategoryScroller({ categories = [], currentCategory = "", onSelect = () => {} }) {
  return (
    <div className="border-t relative">
      <div className="w-full px-4 sm:px-6 py-2 flex gap-4 sm:gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-none">
        <button onClick={() => onSelect("")} className={`font-semibold px-3 py-1 rounded shrink-0 ${currentCategory === "" ? "bg-green-600 text-white" : "hover:text-green-600"}`}>Todos</button>
        {categories.map((cat, index) => (
          <button key={index} onClick={() => onSelect(cat)} className={`px-3 py-1 rounded shrink-0 ${currentCategory === cat ? "bg-green-600 text-white" : "hover:text-green-600"}`}>{cat}</button>
        ))}
        {categories.length > 0 && categories[categories.length - 1] === "Vidrio" && (
          <Link href="/ofertas" className="flex items-center gap-1 px-3 py-1 rounded text-red-600 hover:text-red-700 font-bold shrink-0">
            <span>🔥</span>
            <span>Ofertas</span>
          </Link>
        )}
        <Link href="/blog" className="flex items-center gap-1 px-3 py-1 rounded text-gray-600 hover:text-green-600 font-medium shrink-0">
          <span>📝</span>
          <span>Blog</span>
        </Link>
      </div>
    </div>
  );
}
