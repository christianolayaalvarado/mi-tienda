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
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar productos..."
        aria-label="Buscar productos"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
      />
    </div>
  );
}
