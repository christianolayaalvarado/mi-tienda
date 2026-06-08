// components/navbar/CategoryScroller.jsx
"use client";

export default function CategoryScroller({ categories = [], currentCategory = "", onSelect = () => {}, buildURL = () => "#" }) {
  return (
    <div className="border-t relative">
      <div className="max-w-7xl mx-auto px-6 py-2 flex gap-6 text-sm overflow-x-auto whitespace-nowrap scrollbar-none">
        <button onClick={() => onSelect("")} className={`font-semibold px-2 py-1 rounded ${currentCategory === "" ? "bg-green-600 text-white" : "hover:text-green-600"}`}>Todos</button>
        {categories.map((cat, index) => (
          <button key={index} onClick={() => onSelect(cat)} className={`px-2 py-1 rounded ${currentCategory === cat ? "bg-green-600 text-white" : "hover:text-green-600"}`}>{cat}</button>
        ))}
      </div>
    </div>
  );
}
