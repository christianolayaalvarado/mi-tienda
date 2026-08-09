// components/navbar/CategoryScroller.jsx
"use client";

import Link from "next/link";

export default function CategoryScroller({ categories = [], currentCategory = "", onSelect = () => {} }) {
  return (
    <div className="border-t relative">
      <div className="max-w-7xl mx-auto px-6 py-2 flex gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-none">
        <button onClick={() => onSelect("")} className={`font-semibold px-2 py-1 rounded ${currentCategory === "" ? "bg-green-600 text-white" : "hover:text-green-600"}`}>Todos</button>
        {categories.map((cat, index) => (
          <button key={index} onClick={() => onSelect(cat)} className={`px-2 py-1 rounded ${currentCategory === cat ? "bg-green-600 text-white" : "hover:text-green-600"}`}>{cat}</button>
        ))}
        {categories.length > 0 && categories[categories.length - 1] === "Vidrio" && (
          <Link href="/ofertas" className="flex items-center gap-1 px-2 py-1 rounded text-red-600 hover:text-red-700 font-bold">
            <span>🔥</span>
            <span>Ofertas</span>
          </Link>
        )}
        <Link href="/blog" className="flex items-center gap-1 px-2 py-1 rounded text-gray-600 hover:text-green-600 font-medium">
          <span>📝</span>
          <span>Blog</span>
        </Link>
      </div>
    </div>
  );
}
