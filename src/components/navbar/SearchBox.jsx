// components/navbar/SearchBox.jsx
"use client";

import { useEffect, useState } from "react";

export default function SearchBox({ initial = "", onSearch }) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    const handler = setTimeout(() => onSearch?.(value || ""), 500);
    return () => clearTimeout(handler);
  }, [value, onSearch]);

  useEffect(() => setValue(initial), [initial]);

  return (
    <div className="w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar productos..."
          aria-label="Buscar productos"
          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />
      </div>
    </div>
  );
}
